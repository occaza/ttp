import { canTransition, authorizeTransition, createOrder, transitionOrderStatus } from './order.ts';
import type { Order, OrderStatus } from '#lib/types/database.types.js';
import type { PricingSnapshot } from './pricing.ts';

async function runOrderLifecycleVerification() {
	console.log('Testing Phase 7 Order Creation & Lifecycle State Machine...');

	// 1. Test State Machine Transitions
	if (!canTransition('pending', 'accepted')) throw new Error('pending -> accepted should be valid');
	if (!canTransition('pending', 'rejected')) throw new Error('pending -> rejected should be valid');
	if (!canTransition('pending', 'cancelled'))
		throw new Error('pending -> cancelled should be valid');
	if (canTransition('pending', 'completed'))
		throw new Error('pending -> completed should be illegal');
	if (canTransition('pending', 'delivering'))
		throw new Error('pending -> delivering should be illegal');

	if (!canTransition('accepted', 'shopping'))
		throw new Error('accepted -> shopping should be valid');
	if (!canTransition('shopping', 'purchased'))
		throw new Error('shopping -> purchased should be valid');
	if (!canTransition('purchased', 'delivering'))
		throw new Error('purchased -> delivering should be valid');
	if (!canTransition('delivering', 'completed'))
		throw new Error('delivering -> completed should be valid');

	if (canTransition('completed', 'pending')) throw new Error('completed is terminal');
	if (canTransition('completed', 'cancelled')) throw new Error('completed is terminal');
	if (canTransition('cancelled', 'accepted')) throw new Error('cancelled is terminal');
	if (canTransition('rejected', 'accepted')) throw new Error('rejected is terminal');

	console.log('✔ Order Lifecycle State Machine Rules Passed');

	// 2. Test Authorization Boundaries
	const dummyOrder: Order = {
		id: 'order-123',
		order_number: 'TP-20261126-0001',
		customer_id: 'cust-1',
		provider_id: 'prov-1',
		service_id: null,
		category_id: null,
		status: 'pending',
		origin_name: 'Warung Soto',
		origin_address: null,
		destination_address_id: null,
		destination_address_text: 'Gatak RT 01',
		recipient_name: 'Budi',
		recipient_phone: '08123456789',
		pricing_snapshot: {},
		estimated_item_cost: 20000,
		actual_item_cost: null,
		jastip_fee: 8000,
		total_estimated: 28000,
		actual_total: null,
		customer_notes: null,
		cancellation_reason: null,
		cancelled_by: null,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString()
	};

	// Customer cancelling pending -> allowed
	const custCancelPending = authorizeTransition('customer', 'cust-1', dummyOrder, 'cancelled');
	if (!custCancelPending.authorized)
		throw new Error('Customer should be allowed to cancel pending order');

	// Customer cancelling active order -> denied
	const activeOrder = { ...dummyOrder, status: 'shopping' as OrderStatus };
	const custCancelActive = authorizeTransition('customer', 'cust-1', activeOrder, 'cancelled');
	if (custCancelActive.authorized)
		throw new Error('Customer should NOT be allowed to cancel shopping order directly');

	// Customer trying to accept order -> denied
	const custAccept = authorizeTransition('customer', 'cust-1', dummyOrder, 'accepted');
	if (custAccept.authorized) throw new Error('Customer should NOT be allowed to accept order');

	// Provider accepting pending order -> allowed
	const provAccept = authorizeTransition('provider', 'prov-1', dummyOrder, 'accepted');
	if (!provAccept.authorized)
		throw new Error('Assigned provider should be allowed to accept order');

	// Unrelated third-party actor -> denied
	const stranger = authorizeTransition('customer', 'stranger-999', dummyOrder, 'cancelled');
	if (stranger.authorized) throw new Error('Stranger should be denied');

	// Admin actor -> allowed
	const adminAction = authorizeTransition('admin', 'admin-1', activeOrder, 'cancelled');
	if (!adminAction.authorized) throw new Error('Admin should have master override authorization');

	console.log('✔ Order Authorization Boundaries Passed');

	// 3. Test Order Creation Flow
	const mockPricingSnapshot: PricingSnapshot = {
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
			{ code: 'ITEM_ESTIMATE', label: 'Estimasi Belanja', amount: 20000, type: 'item_cost' }
		],
		summary: {
			itemCostEstimate: 20000,
			serviceFee: 8000,
			deliveryFee: 0,
			distanceSurcharge: 0,
			platformFee: 1000,
			additionalFees: 0,
			discount: 0,
			totalJastipFee: 9000,
			grandTotalEstimate: 29000
		},
		metadata: {}
	};

	const createdOrder = await createOrder(null, 'cust-1', {
		provider_id: 'prov-1',
		origin_name: 'Soto Bebek Gawok',
		origin_address: 'Pasar Gawok',
		destination_address_text: 'Dukuh Krapyak RT 02/01 Gatak, Sukoharjo',
		recipient_name: 'Budi Santoso',
		recipient_phone: '081234567890',
		items: [
			{
				name: 'Soto Bebek Bungkus',
				quantity: 2,
				unit: 'porsi',
				notes: 'Kuah pisah',
				estimated_price: 15000
			},
			{ name: 'Kerupuk Kaleng', quantity: 3, unit: 'bungkus', estimated_price: 2000 }
		],
		pricing_snapshot: mockPricingSnapshot
	});

	if (!createdOrder.order_number.startsWith('TP-'))
		throw new Error('Order number must start with TP-');
	if (createdOrder.status !== 'pending') throw new Error('Initial status must be pending');
	if (createdOrder.items.length !== 2) throw new Error('Items must be populated');
	if (createdOrder.history.length !== 1) throw new Error('Initial status history must be logged');
	console.log(`✔ Order Creation Flow Passed (Created: ${createdOrder.order_number})`);

	// 4. Test Transition Execution Flow
	// pending -> accepted
	const acceptedOrder = await transitionOrderStatus(null, 'prov-1', 'provider', {
		order_id: createdOrder.id,
		to_status: 'accepted',
		note: 'Mitra bersiap menuju lokasi warung.'
	});
	if (acceptedOrder.status !== 'accepted') throw new Error('Expected status accepted');

	// accepted -> shopping
	const shoppingOrder = await transitionOrderStatus(null, 'prov-1', 'provider', {
		order_id: createdOrder.id,
		to_status: 'shopping',
		note: 'Sudah sampai di warung dan antre beli.'
	});
	if (shoppingOrder.status !== 'shopping') throw new Error('Expected status shopping');

	// shopping -> purchased (with actual receipt amount)
	const purchasedOrder = await transitionOrderStatus(null, 'prov-1', 'provider', {
		order_id: createdOrder.id,
		to_status: 'purchased',
		actual_item_cost: 21000,
		note: 'Soto dan kerupuk sudah dibeli, foto struk kasir terlampir.'
	});
	if (purchasedOrder.status !== 'purchased') throw new Error('Expected status purchased');
	if (purchasedOrder.actual_item_cost !== 21000) throw new Error('Actual item cost not recorded');
	if (purchasedOrder.actual_total !== 30000)
		throw new Error('Actual total should be 21000 + 9000 = 30000');

	// purchased -> delivering
	const deliveringOrder = await transitionOrderStatus(null, 'prov-1', 'provider', {
		order_id: createdOrder.id,
		to_status: 'delivering',
		note: 'Berangkat mengantar pesanan ke alamat pelanggan.'
	});
	if (deliveringOrder.status !== 'delivering') throw new Error('Expected status delivering');

	// delivering -> completed
	const completedOrder = await transitionOrderStatus(null, 'prov-1', 'provider', {
		order_id: createdOrder.id,
		to_status: 'completed',
		note: 'Pesanan diterima pemesan dan pembayaran kasir selesai.'
	});
	if (completedOrder.status !== 'completed') throw new Error('Expected status completed');
	if (completedOrder.history.length !== 6) throw new Error('History must have 6 audit transitions');
	console.log('✔ Complete Order Lifecycle Audit Transition Passed (6 States Recorded)');

	console.log('\nAll Phase 7 Order Creation & Lifecycle tests passed cleanly!');
}

runOrderLifecycleVerification().catch((err) => {
	console.error('❌ Order lifecycle verification failed:', err);
	process.exit(1);
});
