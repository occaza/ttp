import {
	checkReviewEligibilityFromOrder,
	submitOrderReview,
	getProviderRatingSummary,
	calculateEarningsFromOrders,
	getProviderEarningsSummary
} from './review_earnings.ts';
import { createOrder, transitionOrderStatus } from './order.ts';
import type { PricingSnapshot } from './pricing.ts';

async function runReviewAndEarningsVerification() {
	console.log('Testing Phase 10 Customer Reviews & Provider Earnings...');

	const mockSnapshot: PricingSnapshot = {
		ruleId: 'gatak-flat',
		ruleName: 'Tarif Flat Gatak',
		model: 'fixed',
		calculatedAt: new Date().toISOString(),
		currency: 'IDR',
		distanceInfo: {
			distanceKm: 2.0,
			durationMinutes: 10,
			isMock: true,
			source: 'local_matrix_mock',
			providerNotes: 'mock'
		},
		lineItems: [
			{ code: 'JASTIP_FLAT', label: 'Tarif Flat', amount: 8000, type: 'service' },
			{ code: 'PLATFORM_FEE', label: 'Biaya Platform', amount: 1000, type: 'platform' },
			{ code: 'ITEM_ESTIMATE', label: 'Estimasi Belanja', amount: 25000, type: 'item_cost' }
		],
		summary: {
			itemCostEstimate: 25000,
			serviceFee: 8000,
			deliveryFee: 0,
			distanceSurcharge: 0,
			platformFee: 1000,
			additionalFees: 0,
			discount: 0,
			totalJastipFee: 9000,
			grandTotalEstimate: 34000
		},
		metadata: {}
	};

	// 1. Test Review Eligibility Rules
	const pendingEligibility = checkReviewEligibilityFromOrder(
		'cust-r1',
		{ id: 'ord-1', customer_id: 'cust-r1', status: 'pending' },
		null
	);
	if (pendingEligibility.eligible) {
		throw new Error('Pending order must NOT be eligible for review');
	}

	const wrongUserEligibility = checkReviewEligibilityFromOrder(
		'other-cust',
		{ id: 'ord-1', customer_id: 'cust-r1', status: 'completed' },
		null
	);
	if (wrongUserEligibility.eligible) {
		throw new Error('Non-owner customer must NOT be eligible for review');
	}

	const validEligibility = checkReviewEligibilityFromOrder(
		'cust-r1',
		{ id: 'ord-1', customer_id: 'cust-r1', status: 'completed' },
		null
	);
	if (!validEligibility.eligible) {
		throw new Error('Completed order by owner should be eligible');
	}
	console.log('✔ Review Eligibility Rules Passed');

	// 2. End-to-End Review Submission + Duplicate Guard + Rating Summary
	const order1 = await createOrder(null, 'cust-r1', {
		provider_id: 'prov-r10',
		origin_name: 'Pasar Gawok',
		destination_address_text: 'Gatak RT 01',
		recipient_name: 'Ani',
		recipient_phone: '081234567890',
		items: [{ name: 'Sayur Bayam', quantity: 2, unit: 'ikat', estimated_price: 12500 }],
		pricing_snapshot: mockSnapshot
	});

	// Attempt review before completion -> MUST fail
	let blockedBeforeComplete = false;
	try {
		await submitOrderReview(null, 'cust-r1', {
			order_id: order1.id,
			rating: 5,
			comment: 'Cepat'
		});
	} catch {
		blockedBeforeComplete = true;
	}
	if (!blockedBeforeComplete) {
		throw new Error('Review before order completion MUST be rejected');
	}

	// Fast-complete order1 via 4-step path
	await transitionOrderStatus(null, 'prov-r10', 'provider', {
		order_id: order1.id,
		to_status: 'shopping'
	});
	await transitionOrderStatus(null, 'prov-r10', 'provider', {
		order_id: order1.id,
		to_status: 'delivering',
		actual_item_cost: 24000
	});
	await transitionOrderStatus(null, 'prov-r10', 'provider', {
		order_id: order1.id,
		to_status: 'completed'
	});

	const rev1 = await submitOrderReview(null, 'cust-r1', {
		order_id: order1.id,
		rating: 5,
		comment: 'Sesuai struk kasir dan cepat.'
	});
	if (rev1.rating !== 5) throw new Error('Expected rating 5');

	// Duplicate review on same order -> MUST fail
	let duplicateBlocked = false;
	try {
		await submitOrderReview(null, 'cust-r1', {
			order_id: order1.id,
			rating: 4
		});
	} catch {
		duplicateBlocked = true;
	}
	if (!duplicateBlocked) {
		throw new Error('Duplicate review on same order MUST be rejected');
	}

	// Second completed order with rating 4
	const order2 = await createOrder(null, 'cust-r2', {
		provider_id: 'prov-r10',
		origin_name: 'Apotek Sehat',
		destination_address_text: 'Mayang RT 03',
		recipient_name: 'Budi',
		recipient_phone: '081299998888',
		items: [{ name: 'Vitamin C', quantity: 1, unit: 'box', estimated_price: 25000 }],
		pricing_snapshot: mockSnapshot
	});
	await transitionOrderStatus(null, 'prov-r10', 'provider', {
		order_id: order2.id,
		to_status: 'shopping'
	});
	await transitionOrderStatus(null, 'prov-r10', 'provider', {
		order_id: order2.id,
		to_status: 'delivering',
		actual_item_cost: 25000
	});
	await transitionOrderStatus(null, 'prov-r10', 'provider', {
		order_id: order2.id,
		to_status: 'completed'
	});
	await submitOrderReview(null, 'cust-r2', {
		order_id: order2.id,
		rating: 4,
		comment: 'Ramah dan tepat waktu.'
	});

	const ratingSummary = await getProviderRatingSummary(null, 'prov-r10');
	if (ratingSummary.ratingCount !== 2 || ratingSummary.ratingAvg !== 4.5) {
		throw new Error(
			`Expected ratingCount=2 and ratingAvg=4.5, got count=${ratingSummary.ratingCount}, avg=${ratingSummary.ratingAvg}`
		);
	}
	console.log('✔ Review Submission, Duplicate Guard & Rating Summary Passed');

	// 3. Provider Earnings & No-Implied-Payout Check
	// Add a pending order that MUST be ignored in earnings
	await createOrder(null, 'cust-r3', {
		provider_id: 'prov-r10',
		origin_name: 'Minimarket',
		destination_address_text: 'Gatak RT 05',
		recipient_name: 'Citra',
		recipient_phone: '081300001111',
		items: [{ name: 'Air Mineral', quantity: 1, unit: 'dus', estimated_price: 20000 }],
		pricing_snapshot: mockSnapshot
	});

	const earnings = await getProviderEarningsSummary(null, 'prov-r10');
	if (earnings.completedOrdersCount !== 2) {
		throw new Error(
			`Expected 2 completed orders in earnings, got ${earnings.completedOrdersCount}`
		);
	}
	// Each completed order has jastip_fee=9000, platformFee=1000 -> net=8000 -> 2 orders = 16000
	if (
		earnings.grossServiceFees !== 18000 ||
		earnings.platformFees !== 2000 ||
		earnings.netProviderEarnings !== 16000
	) {
		throw new Error(
			`Unexpected earnings totals: gross=${earnings.grossServiceFees}, platform=${earnings.platformFees}, net=${earnings.netProviderEarnings}`
		);
	}
	if (earnings.totalItemReimbursements !== 49000) {
		throw new Error(
			`Expected totalItemReimbursements=49000, got ${earnings.totalItemReimbursements}`
		);
	}
	if (earnings.recordedPayoutTotal !== 0 || earnings.hasRecordedPayouts) {
		throw new Error('Must NOT imply payouts occurred when none are recorded');
	}

	// Explicit payout recorded check
	const withPayout = calculateEarningsFromOrders(
		[
			{
				id: 'o1',
				order_number: 'TP-TEST1',
				origin_name: 'Toko A',
				status: 'completed',
				estimated_item_cost: 20000,
				actual_item_cost: 20000,
				jastip_fee: 9000,
				total_estimated: 29000,
				actual_total: 29000,
				pricing_snapshot: mockSnapshot as never,
				updated_at: new Date().toISOString()
			}
		],
		[
			{
				id: 'pay-out-1',
				provider_id: 'prov-r10',
				amount: 8000,
				reference: 'PO-001',
				status: 'paid',
				note: 'Dicairkan tunai',
				recorded_by: 'admin-1',
				paid_at: new Date().toISOString(),
				created_at: new Date().toISOString()
			}
		]
	);
	if (withPayout.recordedPayoutTotal !== 8000 || withPayout.unpaidRecordedBalance !== 0) {
		throw new Error('Explicitly recorded paid payout calculation failed');
	}
	console.log('✔ Provider Earnings & Explicit Payout Tracking Passed');

	console.log('\nAll Phase 10 Review & Provider Earnings tests passed cleanly!');
}

runReviewAndEarningsVerification().catch((err) => {
	console.error('❌ Review & Earnings verification failed:', err);
	process.exit(1);
});
