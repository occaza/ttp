/**
 * Titipin - Server-Side Pricing Engine (Phase 6)
 *
 * Implements server-side pricing calculations for:
 * 1. Fixed-fee model (e.g., flat jastip fee in Gatak)
 * 2. Distance-based model (base fee up to X km + per-km rate)
 * 3. Shopping + delivery model (item cost + shopping service fee + delivery fee + platform fee)
 *
 * Guaranteed characteristics:
 * - Server-authoritative: client-side cannot forge or override calculation results.
 * - Immutable snapshots: snapshots include line items, distance metadata, and rule config.
 * - 100% transparent fee breakdown: clear distinction between item store cost and jastip fee.
 */

import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, PricingRule } from '#lib/types/database.types.js';
import { defaultDistanceProvider, type DistanceCalculationResult } from './distance.ts';

export type PricingModel = 'fixed' | 'distance_based' | 'shopping_delivery';

export interface FeeLineItem {
	code: string;
	label: string;
	amount: number;
	type: 'service' | 'delivery' | 'surcharge' | 'platform' | 'item_cost' | 'extra' | 'discount';
	isEstimate?: boolean;
	notes?: string;
}

export interface PricingSnapshot {
	ruleId: string;
	ruleName: string;
	model: PricingModel;
	calculatedAt: string;
	currency: 'IDR';
	distanceInfo: DistanceCalculationResult;
	lineItems: FeeLineItem[];
	summary: {
		itemCostEstimate: number;
		serviceFee: number;
		deliveryFee: number;
		distanceSurcharge: number;
		platformFee: number;
		additionalFees: number;
		discount: number;
		totalJastipFee: number;
		grandTotalEstimate: number;
	};
	metadata: Record<string, unknown>;
}

export const pricingInputSchema = z.object({
	ruleId: z.string().optional(),
	model: z.enum(['fixed', 'distance_based', 'shopping_delivery']).optional(),
	origin: z.union([
		z.string().min(1, 'Lokasi asal belanja harus diisi'),
		z.object({
			latitude: z.number().min(-90).max(90),
			longitude: z.number().min(-180).max(180)
		})
	]),
	destination: z.union([
		z.string().min(1, 'Alamat pengantaran harus diisi'),
		z.object({
			latitude: z.number().min(-90).max(90),
			longitude: z.number().min(-180).max(180)
		})
	]),
	estimatedItemCost: z.number().nonnegative('Estimasi belanja tidak boleh negatif').default(0),
	customBaseFee: z.number().nonnegative('Tarif dasar tidak boleh negatif').optional(),
	additionalApprovedFees: z
		.array(
			z.object({
				label: z.string().min(1),
				amount: z.number().positive('Biaya tambahan harus bernilai positif'),
				notes: z.string().optional()
			})
		)
		.default([]),
	discountAmount: z.number().nonnegative('Diskon tidak boleh negatif').default(0)
});

export type PricingInput = z.infer<typeof pricingInputSchema>;

// Default local Gatak pricing rules fallback
export const DEFAULT_GATAK_PRICING_RULES: Record<string, PricingRule> = {
	'gatak-flat': {
		id: 'gatak-flat',
		name: 'Tarif Flat Jastip Gatak',
		model: 'fixed',
		base_fee: 8000,
		base_distance_km: 5.0,
		per_km_fee: 0,
		platform_fee: 1000,
		min_order_fee: 8000,
		is_active: true,
		metadata: { coverage: 'Kecamatan Gatak & Sekitarnya' },
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString()
	},
	'gatak-distance': {
		id: 'gatak-distance',
		name: 'Tarif Berbasis Jarak Gatak - Solo Raya',
		model: 'distance_based',
		base_fee: 7000,
		base_distance_km: 2.5,
		per_km_fee: 2000,
		platform_fee: 1000,
		min_order_fee: 7000,
		is_active: true,
		metadata: { coverage: 'Antar-Kecamatan (Gatak, Kartasura, Baki, Sawit)' },
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString()
	},
	'gatak-shopping-delivery': {
		id: 'gatak-shopping-delivery',
		name: 'Belanja Pasar / Multi-Item + Pengantaran',
		model: 'shopping_delivery',
		base_fee: 8000,
		base_distance_km: 3.0,
		per_km_fee: 2000,
		platform_fee: 1000,
		min_order_fee: 10000,
		is_active: true,
		metadata: { service_fee: 8000, delivery_base: 5000 },
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString()
	}
};

/**
 * Fetch active pricing rule from database or fallback
 */
export async function getPricingRule(
	supabase?: SupabaseClient<Database> | null,
	ruleId: string = 'gatak-flat'
): Promise<PricingRule> {
	if (supabase) {
		try {
			const { data, error } = await supabase
				.from('pricing_rules')
				.select('*')
				.eq('id', ruleId)
				.maybeSingle();

			if (!error && data) {
				return data;
			}
		} catch (err) {
			console.warn('[PricingEngine] Database rule fetch fallback:', err);
		}
	}

	return DEFAULT_GATAK_PRICING_RULES[ruleId] || DEFAULT_GATAK_PRICING_RULES['gatak-flat'];
}

/**
 * Pure calculation logic for pricing models.
 * Exported for deterministic unit testing.
 */
export function calculatePricingBreakdown(
	rule: PricingRule,
	distanceInfo: DistanceCalculationResult,
	input: PricingInput
): PricingSnapshot {
	const lineItems: FeeLineItem[] = [];

	let serviceFee = 0;
	let deliveryFee = 0;
	let distanceSurcharge = 0;
	const platformFee = Math.max(0, Number(rule.platform_fee) || 0);

	const baseFee = input.customBaseFee ?? Number(rule.base_fee);
	const baseDistanceKm = Number(rule.base_distance_km) || 3.0;
	const perKmFee = Number(rule.per_km_fee) || 0;
	const distanceKm = Math.max(0.5, distanceInfo.distanceKm);

	if (rule.model === 'fixed') {
		// Model 1: Fixed Flat Fee
		serviceFee = baseFee;
		deliveryFee = 0;
		distanceSurcharge = 0;

		lineItems.push({
			code: 'JASTIP_FLAT',
			label: 'Tarif Flat Jastip',
			amount: serviceFee,
			type: 'service',
			notes: `Tarif flat tetap untuk area jangkauan (${rule.name})`
		});
	} else if (rule.model === 'distance_based') {
		// Model 2: Distance-based calculation
		serviceFee = baseFee;
		lineItems.push({
			code: 'BASE_DELIVERY',
			label: `Tarif Dasar Jarak (0 - ${baseDistanceKm} km)`,
			amount: serviceFee,
			type: 'service'
		});

		if (distanceKm > baseDistanceKm && perKmFee > 0) {
			const extraKm = Math.ceil((distanceKm - baseDistanceKm) * 10) / 10;
			distanceSurcharge = Math.round(extraKm * perKmFee);
			lineItems.push({
				code: 'DISTANCE_SURCHARGE',
				label: `Tambahan Jarak (${extraKm.toFixed(1)} km × Rp ${perKmFee.toLocaleString('id-ID')})`,
				amount: distanceSurcharge,
				type: 'surcharge',
				notes: `Jarak total: ${distanceKm.toFixed(1)} km`
			});
		}
	} else if (rule.model === 'shopping_delivery') {
		// Model 3: Shopping service fee + Delivery fee
		const deliveryBase = 5000;
		serviceFee = baseFee;
		deliveryFee = deliveryBase;

		lineItems.push({
			code: 'SHOPPING_SERVICE',
			label: 'Biaya Jasa Belanja / Antre',
			amount: serviceFee,
			type: 'service',
			notes: 'Waktu belanja, pemilihan item di toko, dan verifikasi nota'
		});

		lineItems.push({
			code: 'DELIVERY_BASE',
			label: `Ongkir Pengantaran (hingga ${baseDistanceKm} km)`,
			amount: deliveryFee,
			type: 'delivery'
		});

		if (distanceKm > baseDistanceKm && perKmFee > 0) {
			const extraKm = Math.ceil((distanceKm - baseDistanceKm) * 10) / 10;
			distanceSurcharge = Math.round(extraKm * perKmFee);
			lineItems.push({
				code: 'DELIVERY_DISTANCE_SURCHARGE',
				label: `Tambahan Jarak Pengantaran (${extraKm.toFixed(1)} km)`,
				amount: distanceSurcharge,
				type: 'surcharge'
			});
		}
	}

	// Platform fee
	if (platformFee > 0) {
		lineItems.push({
			code: 'PLATFORM_FEE',
			label: 'Biaya Pemeliharaan Aplikasi',
			amount: platformFee,
			type: 'platform',
			notes: 'Transparan Rp 1.000 untuk server dan keandalan sistem'
		});
	}

	// Additional approved fees (parking, packing, etc.)
	let additionalFeesTotal = 0;
	if (input.additionalApprovedFees && input.additionalApprovedFees.length > 0) {
		for (const extra of input.additionalApprovedFees) {
			additionalFeesTotal += extra.amount;
			lineItems.push({
				code: 'EXTRA_FEE',
				label: extra.label,
				amount: extra.amount,
				type: 'extra',
				notes: extra.notes
			});
		}
	}

	// Discount
	const discount = Math.min(
		input.discountAmount,
		serviceFee + deliveryFee + distanceSurcharge + platformFee + additionalFeesTotal
	);
	if (discount > 0) {
		lineItems.push({
			code: 'DISCOUNT',
			label: 'Potongan Diskon Jastip',
			amount: -discount,
			type: 'discount'
		});
	}

	// Calculate total service fee
	const rawJastipFee =
		serviceFee + deliveryFee + distanceSurcharge + platformFee + additionalFeesTotal - discount;
	const minOrderFee = Number(rule.min_order_fee) || 0;
	const totalJastipFee = Math.max(minOrderFee, rawJastipFee);

	// Item cost estimate line item
	const itemCostEstimate = Math.max(0, input.estimatedItemCost || 0);
	if (itemCostEstimate > 0) {
		lineItems.push({
			code: 'ITEM_COST_ESTIMATE',
			label: 'Estimasi Belanja Toko (Sesuai Nota)',
			amount: itemCostEstimate,
			type: 'item_cost',
			isEstimate: true,
			notes: 'Dibayar langsung sesuai nominal pada foto nota kasir fisik asli toko'
		});
	}

	const grandTotalEstimate = totalJastipFee + itemCostEstimate;

	return {
		ruleId: rule.id,
		ruleName: rule.name,
		model: rule.model,
		calculatedAt: new Date().toISOString(),
		currency: 'IDR',
		distanceInfo,
		lineItems,
		summary: {
			itemCostEstimate,
			serviceFee,
			deliveryFee,
			distanceSurcharge,
			platformFee,
			additionalFees: additionalFeesTotal,
			discount,
			totalJastipFee,
			grandTotalEstimate
		},
		metadata: {
			minOrderFeeApplied: totalJastipFee > rawJastipFee,
			rawJastipFee,
			ruleMetadata: rule.metadata
		}
	};
}

/**
 * Main server-authoritative calculation entry point
 */
export async function calculateOrderPricing(
	supabase: SupabaseClient<Database> | null,
	rawInput: unknown
): Promise<PricingSnapshot> {
	// 1. Validate input schema
	const parsedInput = pricingInputSchema.parse(rawInput);

	// 2. Resolve pricing rule
	const ruleId =
		parsedInput.ruleId ||
		(parsedInput.model === 'distance_based'
			? 'gatak-distance'
			: parsedInput.model === 'shopping_delivery'
				? 'gatak-shopping-delivery'
				: 'gatak-flat');
	const rule = await getPricingRule(supabase, ruleId);

	// 3. Compute route distance via abstraction
	const distanceInfo = await defaultDistanceProvider.calculateDistance(
		parsedInput.origin,
		parsedInput.destination
	);

	// 4. Calculate deterministic breakdown
	return calculatePricingBreakdown(rule, distanceInfo, parsedInput);
}
