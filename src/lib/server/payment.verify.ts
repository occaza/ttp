import {
	canTransitionPayment,
	isPrivilegedPaymentActor,
	submitCustomerPayment,
	verifyPayment,
	rejectPayment,
	refundPayment,
	getPaymentByOrderId
} from './payment.ts';
import { createOrder, getOrderDetails } from './order.ts';
import type { PricingSnapshot } from './pricing.ts';

async function runPaymentVerification() {
	console.log('Testing Phase 9 Manual Payment MVP & Audit Trail...');

	// 1. State Machine Rules
	if (!canTransitionPayment('unpaid', 'awaiting_verification')) {
		throw new Error('unpaid -> awaiting_verification should be valid');
	}
	if (!canTransitionPayment('awaiting_verification', 'verified')) {
		throw new Error('awaiting_verification -> verified should be valid');
	}
	if (!canTransitionPayment('awaiting_verification', 'rejected')) {
		throw new Error('awaiting_verification -> rejected should be valid');
	}
	if (!canTransitionPayment('rejected', 'awaiting_verification')) {
		throw new Error('rejected -> awaiting_verification (resubmit) should be valid');
	}
	if (!canTransitionPayment('verified', 'refunded')) {
		throw new Error('verified -> refunded should be valid');
	}
	if (canTransitionPayment('refunded', 'verified')) {
		throw new Error('refunded is terminal');
	}
	if (canTransitionPayment('unpaid', 'refunded')) {
		throw new Error('unpaid -> refunded should be illegal');
	}
	console.log('✔ Payment State Machine Rules Passed');

	// 2. Authorization Boundaries
	const orderRef = { customer_id: 'cust-p9', provider_id: 'prov-p9' };
	if (isPrivilegedPaymentActor('customer', 'cust-p9', orderRef).authorized) {
		throw new Error('Customer must NEVER be privileged to verify payments');
	}
	if (isPrivilegedPaymentActor('provider', 'other-prov', orderRef).authorized) {
		throw new Error('Unrelated provider must NOT be privileged to verify order payment');
	}
	if (!isPrivilegedPaymentActor('provider', 'prov-p9', orderRef).authorized) {
		throw new Error('Assigned provider should be privileged to verify own order payment');
	}
	if (!isPrivilegedPaymentActor('admin', 'admin-1', orderRef).authorized) {
		throw new Error('Admin should be privileged to verify any order payment');
	}
	console.log('✔ Payment Privilege Authorization Boundaries Passed');

	// Create sample order for end-to-end payment tests (in-memory)
	const mockPricingSnapshot: PricingSnapshot = {
		ruleId: 'gatak-flat',
		ruleName: 'Tarif Flat Gatak',
		model: 'fixed',
		calculatedAt: new Date().toISOString(),
		currency: 'IDR',
		distanceInfo: {
			distanceKm: 1.5,
			durationMinutes: 8,
			isMock: true,
			source: 'local_matrix_mock',
			providerNotes: 'mock'
		},
		lineItems: [
			{ code: 'JASTIP_FLAT', label: 'Tarif Flat', amount: 8000, type: 'service' },
			{ code: 'ITEM_ESTIMATE', label: 'Estimasi Belanja', amount: 30000, type: 'item_cost' }
		],
		summary: {
			itemCostEstimate: 30000,
			serviceFee: 8000,
			deliveryFee: 0,
			distanceSurcharge: 0,
			platformFee: 0,
			additionalFees: 0,
			discount: 0,
			totalJastipFee: 8000,
			grandTotalEstimate: 38000
		},
		metadata: {}
	};

	const order = await createOrder(null, 'cust-p9', {
		provider_id: 'prov-p9',
		origin_name: 'Apotek Sehat Gatak',
		destination_address_text: 'Jl. Raya Gatak No. 12',
		recipient_name: 'Sari',
		recipient_phone: '081234567890',
		items: [{ name: 'Vitamin C', quantity: 1, unit: 'box', estimated_price: 30000 }],
		pricing_snapshot: mockPricingSnapshot
	});

	// 3. Customer submits bank transfer proof -> MUST stay 'awaiting_verification', NEVER 'verified'
	const submitted = await submitCustomerPayment(null, 'cust-p9', 'customer', {
		orderId: order.id,
		method: 'bank_transfer',
		payerName: 'Sari Dewi',
		externalReference: 'TRF-BCA-998877',
		fileName: 'bukti-transfer.jpg',
		mimeType: 'image/jpeg',
		fileSize: 120000
	});

	if (submitted.status !== 'awaiting_verification') {
		throw new Error(
			`Unverified transfer proof MUST NOT auto-confirm! Got status: ${submitted.status}`
		);
	}
	if (!submitted.payment_reference.startsWith('PAY-')) {
		throw new Error('Payment reference must start with PAY-');
	}
	if (submitted.events.length !== 1 || submitted.events[0].event_type !== 'proof_submitted') {
		throw new Error('Audit trail must contain proof_submitted event');
	}

	// Verify order status remained independent ('pending')
	const orderAfterSubmit = await getOrderDetails(null, order.id);
	if (orderAfterSubmit?.status !== 'pending') {
		throw new Error('Order status must remain decoupled from payment proof submission');
	}
	console.log('✔ Unverified Transfer Proof & Order Decoupling Passed');

	// 4. Customer attempting self-verification -> MUST throw error
	let customerBlocked = false;
	try {
		await verifyPayment(null, 'cust-p9', 'customer', {
			order_id: order.id,
			paid_amount: 38000
		});
	} catch {
		customerBlocked = true;
	}
	if (!customerBlocked) {
		throw new Error('Customer self-verification MUST be rejected');
	}
	console.log('✔ Customer Self-Verification Block Passed');

	// 5. Reject proof & resubmit flow
	const rejected = await rejectPayment(null, 'admin-1', 'admin', {
		order_id: order.id,
		rejection_reason: 'Nominal pada foto struk transfer buram, mohon kirim ulang.'
	});
	if (rejected.status !== 'rejected') {
		throw new Error('Payment should transition to rejected');
	}

	const resubmitted = await submitCustomerPayment(null, 'cust-p9', 'customer', {
		orderId: order.id,
		method: 'qris_manual',
		payerName: 'Sari Dewi',
		externalReference: 'QRIS-20261127-7711',
		fileName: 'bukti-qris-jelas.png',
		mimeType: 'image/png',
		fileSize: 95000
	});
	if (resubmitted.status !== 'awaiting_verification') {
		throw new Error('Resubmitted proof should return to awaiting_verification');
	}
	console.log('✔ Rejection & Resubmission Audit Flow Passed');

	// 6. Privileged verification & refund + audit trail completeness
	const verified = await verifyPayment(null, 'admin-1', 'admin', {
		order_id: order.id,
		paid_amount: 38000,
		external_reference: 'QRIS-20261127-7711',
		note: 'Dana masuk sesuai mutasi QRIS Titipin.'
	});
	if (
		verified.status !== 'verified' ||
		verified.verified_by !== 'admin-1' ||
		!verified.verified_at
	) {
		throw new Error('Admin verification must record verified status, verified_by, and verified_at');
	}

	// Verify order status STILL independent
	const orderAfterVerify = await getOrderDetails(null, order.id);
	if (orderAfterVerify?.status !== 'pending') {
		throw new Error('Payment verification must NOT implicitly mutate order status');
	}

	const refunded = await refundPayment(null, 'admin-1', 'admin', {
		order_id: order.id,
		note: 'Obat di apotek kosong, dana dikembalikan penuh.'
	});
	if (refunded.status !== 'refunded') {
		throw new Error('Payment should transition to refunded');
	}

	const fetched = await getPaymentByOrderId(null, order.id);
	if (!fetched || fetched.events.length !== 5) {
		throw new Error(`Expected 5 immutable payment_events, got ${fetched?.events.length ?? 0}`);
	}
	const expectedEventOrder = [
		'proof_submitted',
		'rejected',
		'proof_submitted',
		'verified',
		'refunded'
	];
	fetched.events.forEach((ev, i) => {
		if (ev.event_type !== expectedEventOrder[i]) {
			throw new Error(
				`Event #${i} mismatch: expected ${expectedEventOrder[i]}, got ${ev.event_type}`
			);
		}
	});
	console.log('✔ Privileged Verification, Refund & Immutable Audit Trail Passed');

	// 7. Reject invalid file proof
	let invalidFileBlocked = false;
	try {
		const order2 = await createOrder(null, 'cust-p9', {
			provider_id: 'prov-p9',
			origin_name: 'Warung Soto',
			destination_address_text: 'Gatak RT 02',
			recipient_name: 'Sari',
			recipient_phone: '081234567890',
			items: [{ name: 'Soto Ayam', quantity: 1, unit: 'porsi', estimated_price: 15000 }],
			pricing_snapshot: mockPricingSnapshot
		});
		await submitCustomerPayment(null, 'cust-p9', 'customer', {
			orderId: order2.id,
			method: 'bank_transfer',
			fileName: 'malware.exe',
			mimeType: 'application/x-msdownload',
			fileSize: 1024
		});
	} catch {
		invalidFileBlocked = true;
	}
	if (!invalidFileBlocked) {
		throw new Error('Invalid MIME type proof must be rejected');
	}
	console.log('✔ Proof File Validation Passed');

	console.log('\nAll Phase 9 Payment MVP tests passed cleanly!');
}

runPaymentVerification().catch((err) => {
	console.error('❌ Payment verification failed:', err);
	process.exit(1);
});
