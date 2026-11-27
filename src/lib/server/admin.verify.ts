/**
 * Verification Suite for Phase 11: Admin Console, Moderation, Disputes & Audit Logs
 * Run: node --experimental-strip-types src/lib/server/admin.verify.ts
 */

import assert from 'node:assert/strict';
import {
	createDispute,
	getAllPricingRules,
	getAuditLogs,
	getDisputesForAdmin,
	moderateProvider,
	recordAuditLog,
	seedFallbackProviderForTest,
	updateDisputeStatus,
	updatePricingRule
} from './admin.ts';
import { createOrder } from './order.ts';
import type { PricingSnapshot } from './pricing.ts';

async function runTests() {
	console.log('--- Running Phase 11 Admin, Disputes & Audit Log Verification ---');

	const adminId = 'admin-001';
	const customerId = 'cust-p11-001';
	const providerId = 'prov-p11-001';

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
			{ code: 'ITEM_ESTIMATE', label: 'Estimasi Belanja', amount: 35000, type: 'item_cost' }
		],
		summary: {
			itemCostEstimate: 35000,
			serviceFee: 8000,
			deliveryFee: 0,
			distanceSurcharge: 0,
			platformFee: 1000,
			additionalFees: 0,
			discount: 0,
			totalJastipFee: 9000,
			grandTotalEstimate: 44000
		},
		metadata: {}
	};

	// 1. Permission protection checks
	await assert.rejects(
		() =>
			recordAuditLog(null, customerId, 'customer', {
				action: 'unauthorized.attempt',
				target_type: 'settings'
			}),
		/hanya admin/i,
		'Customer must not be allowed to record audit logs'
	);

	await assert.rejects(
		() =>
			updatePricingRule(null, providerId, 'provider', {
				id: 'gatak-flat',
				name: 'Hack Tarif',
				base_fee: 100,
				base_distance_km: 5,
				per_km_fee: 0,
				platform_fee: 0,
				min_order_fee: 100,
				is_active: true
			}),
		/hanya admin/i,
		'Provider must not be allowed to update pricing rules'
	);

	// 2. Create order & file dispute as customer
	const createdOrder = await createOrder(null, customerId, {
		provider_id: providerId,
		origin_name: 'Toko Kelontong Gatak',
		origin_address: 'Jl. Raya Gatak No. 5',
		destination_address_text: 'Blimbing RT 01, Gatak',
		recipient_name: 'Pelanggan Uji',
		recipient_phone: '081234567890',
		items: [{ name: 'Minyak Goreng 2L', quantity: 1, unit: 'pcs', estimated_price: 35000 }],
		pricing_rule_id: 'gatak-flat',
		pricing_snapshot: mockSnapshot
	});

	// Unrelated user cannot file dispute on someone else's order
	await assert.rejects(
		() =>
			createDispute(null, 'other-cust-999', 'customer', {
				order_id: createdOrder.id,
				reason: 'Barang salah',
				description: 'Saya tidak memesan ini tapi mau lapor.'
			}),
		/tidak ditemukan|akses/i
	);

	const dispute = await createDispute(null, customerId, 'customer', {
		order_id: createdOrder.id,
		reason: 'Item kurang saat pengantaran',
		description: 'Minyak goreng belum diterima sesuai catatan pesanan.'
	});
	assert.equal(dispute.status, 'open');
	assert.equal(dispute.order_id, createdOrder.id);

	// Non-admin cannot resolve dispute
	await assert.rejects(
		() =>
			updateDisputeStatus(null, providerId, 'provider', {
				dispute_id: dispute.id,
				status: 'resolved',
				resolution_note: 'Selesai sepihak'
			}),
		/hanya admin/i
	);

	// Admin resolves dispute & generates audit log
	const resolved = await updateDisputeStatus(null, adminId, 'admin', {
		dispute_id: dispute.id,
		status: 'resolved',
		resolution_note: 'Kurir sudah mengantarkan ulang kekurangan barang.'
	});
	assert.equal(resolved.status, 'resolved');
	assert.equal(resolved.resolved_by, adminId);

	const adminDisputes = await getDisputesForAdmin(null);
	assert.ok(adminDisputes.some((d) => d.id === dispute.id && d.status === 'resolved'));

	// 3. Provider moderation + audit log
	seedFallbackProviderForTest({
		id: providerId,
		user_id: providerId,
		business_name: 'Titipin Kurir Gatak',
		bio: 'Kurir lokal',
		coverage_area: 'Gatak',
		is_verified: false,
		is_active: true,
		rating_avg: 5.0,
		rating_count: 0,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		full_name: 'Kurir Gatak',
		phone: '08123456789',
		services_count: 2
	});

	const moderated = await moderateProvider(null, adminId, 'admin', {
		provider_id: providerId,
		is_verified: true,
		is_active: true
	});
	assert.equal(moderated.is_verified, true);

	// 4. Pricing rule update + audit log
	const updatedRule = await updatePricingRule(null, adminId, 'admin', {
		id: 'gatak-flat',
		name: 'Tarif Flat Jastip Gatak',
		base_fee: 9000,
		base_distance_km: 5,
		per_km_fee: 0,
		platform_fee: 1000,
		min_order_fee: 9000,
		is_active: true
	});
	assert.equal(updatedRule.base_fee, 9000);

	const allRules = await getAllPricingRules(null);
	assert.ok(allRules.some((r) => r.id === 'gatak-flat' && r.base_fee === 9000));

	// 5. Verify audit logs recorded all 3 admin actions
	const logs = await getAuditLogs(null, 20);
	assert.ok(logs.some((l) => l.action === 'dispute.status_updated' && l.target_id === dispute.id));
	assert.ok(logs.some((l) => l.action === 'provider.moderated' && l.target_id === providerId));
	assert.ok(logs.some((l) => l.action === 'pricing_rule.updated' && l.target_id === 'gatak-flat'));

	console.log('All Phase 11 Admin, Disputes & Audit Log tests PASSED!');
}

runTests().catch((err) => {
	console.error('Verification failed:', err);
	process.exit(1);
});
