/**
 * Titipin - Customer Reviews, Rating Summary & Provider Earnings (Phase 10)
 *
 * Implements:
 * - Strict customer review eligibility (completed orders only, 1 review per order)
 * - Provider rating summary & distribution (1-5 stars)
 * - Provider earnings calculation from recorded order amounts & pricing_snapshot fee rules
 * - Explicit payout tracking: never implies payouts have occurred unless recorded
 * - In-memory fallback stores for zero-downtime local testing
 */

import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Order, ProviderPayout, Review } from '#lib/types/database.types.js';
import type { PricingSnapshot } from './pricing.ts';
import { getOrderDetails, getProviderOrders } from './order.ts';

export const submitReviewSchema = z.object({
	order_id: z.string().min(1, 'ID pesanan wajib diisi'),
	rating: z
		.number()
		.int('Rating harus berupa bilangan bulat')
		.min(1, 'Rating minimal 1 bintang')
		.max(5, 'Rating maksimal 5 bintang'),
	comment: z.string().trim().max(500, 'Ulasan maksimal 500 karakter').optional()
});

export interface ReviewWithAuthor extends Review {
	customer_name?: string;
}

export interface ProviderRatingSummary {
	ratingAvg: number;
	ratingCount: number;
	distribution: Record<1 | 2 | 3 | 4 | 5, number>;
	recentReviews: ReviewWithAuthor[];
}

export interface OrderEarningEntry {
	orderId: string;
	orderNumber: string;
	originName: string;
	completedAt: string;
	itemReimbursement: number;
	grossServiceFee: number;
	platformFee: number;
	netProviderEarning: number;
	recordedTotal: number;
}

export interface ProviderEarningsSummary {
	completedOrdersCount: number;
	grossServiceFees: number;
	platformFees: number;
	netProviderEarnings: number;
	totalItemReimbursements: number;
	recordedPayoutTotal: number;
	unpaidRecordedBalance: number;
	hasRecordedPayouts: boolean;
	history: OrderEarningEntry[];
	payouts: ProviderPayout[];
}

// In-memory fallback stores
const fallbackReviewsByOrder = new Map<string, ReviewWithAuthor>();
const fallbackPayoutsByProvider = new Map<string, ProviderPayout[]>();

/**
 * Pure helper to compute review eligibility
 */
export function checkReviewEligibilityFromOrder(
	customerId: string,
	order: Pick<Order, 'id' | 'customer_id' | 'status'>,
	existingReview: Review | null
): { eligible: boolean; reason?: string } {
	if (order.customer_id !== customerId) {
		return {
			eligible: false,
			reason: 'Hanya pemesan pemilik order yang dapat memberikan ulasan.'
		};
	}
	if (order.status !== 'completed') {
		return {
			eligible: false,
			reason: 'Ulasan hanya dapat dikirim setelah pesanan selesai (completed).'
		};
	}
	if (existingReview) {
		return {
			eligible: false,
			reason: 'Pesanan ini sudah pernah Anda beri ulasan.'
		};
	}
	return { eligible: true };
}

/**
 * Fetch review for a specific order
 */
export async function getOrderReview(
	supabase: SupabaseClient<Database> | null,
	orderId: string
): Promise<ReviewWithAuthor | null> {
	if (supabase) {
		try {
			const { data, error } = await supabase
				.from('reviews')
				.select('*')
				.eq('order_id', orderId)
				.maybeSingle();

			if (!error && data) {
				fallbackReviewsByOrder.set(orderId, data);
				return data;
			}
		} catch (err) {
			console.warn('[Reviews] DB fetch order review fallback:', err);
		}
	}

	return fallbackReviewsByOrder.get(orderId) || null;
}

/**
 * Submit a customer review for a completed order
 */
export async function submitOrderReview(
	supabase: SupabaseClient<Database> | null,
	customerId: string,
	rawInput: unknown
): Promise<ReviewWithAuthor> {
	const input = submitReviewSchema.parse(rawInput);

	const order = await getOrderDetails(supabase, input.order_id);
	if (!order) {
		throw new Error(`Pesanan dengan ID "${input.order_id}" tidak ditemukan.`);
	}

	const existing = await getOrderReview(supabase, order.id);
	const eligibility = checkReviewEligibilityFromOrder(customerId, order, existing);
	if (!eligibility.eligible) {
		throw new Error(eligibility.reason || 'Tidak memenuhi syarat untuk mengulas pesanan ini.');
	}

	const now = new Date().toISOString();
	const newReview: Review = {
		id: crypto.randomUUID(),
		order_id: order.id,
		customer_id: customerId,
		provider_id: order.provider_id,
		rating: input.rating,
		comment: input.comment || null,
		created_at: now,
		updated_at: now
	};

	if (supabase) {
		try {
			const { data, error } = await supabase.from('reviews').insert(newReview).select().single();

			if (error) {
				throw new Error(`Gagal menyimpan ulasan: ${error.message}`);
			}
			if (data) {
				fallbackReviewsByOrder.set(order.id, data);
				return data;
			}
		} catch (err) {
			if (err instanceof Error && err.message.startsWith('Gagal menyimpan')) {
				throw err;
			}
			console.warn('[Reviews] DB insert review fallback:', err);
		}
	}

	fallbackReviewsByOrder.set(order.id, newReview);
	return newReview;
}

/**
 * Compute rating summary and recent reviews for a provider
 */
export async function getProviderRatingSummary(
	supabase: SupabaseClient<Database> | null,
	providerId: string
): Promise<ProviderRatingSummary> {
	let reviews: ReviewWithAuthor[] = [];

	if (supabase) {
		try {
			const { data, error } = await supabase
				.from('reviews')
				.select('*')
				.eq('provider_id', providerId)
				.order('created_at', { ascending: false })
				.limit(20);

			if (!error && data) {
				const customerIds = [...new Set(data.map((r) => r.customer_id))];
				const { data: profiles } =
					customerIds.length > 0
						? await supabase.from('profiles').select('id, full_name').in('id', customerIds)
						: { data: [] };
				const nameMap = new Map((profiles || []).map((p) => [p.id, p.full_name]));
				reviews = data.map((r) => ({
					...r,
					customer_name: nameMap.get(r.customer_id) || 'Pelanggan'
				}));
			}
		} catch (err) {
			console.warn('[Reviews] DB rating summary fallback:', err);
		}
	} else {
		reviews = Array.from(fallbackReviewsByOrder.values())
			.filter((r) => r.provider_id === providerId)
			.sort((a, b) => b.created_at.localeCompare(a.created_at));
	}

	const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
	let totalScore = 0;

	for (const r of reviews) {
		const clamped = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
		distribution[clamped] += 1;
		totalScore += r.rating;
	}

	const ratingCount = reviews.length;
	const ratingAvg = ratingCount > 0 ? Number((totalScore / ratingCount).toFixed(2)) : 5.0;

	return {
		ratingAvg,
		ratingCount,
		distribution,
		recentReviews: reviews
	};
}

/**
 * Compute provider earnings strictly from recorded completed orders and fee rules.
 * Never implies payouts have occurred unless explicitly recorded in `provider_payouts`.
 */
export function calculateEarningsFromOrders(
	orders: Pick<
		Order,
		| 'id'
		| 'order_number'
		| 'origin_name'
		| 'status'
		| 'estimated_item_cost'
		| 'actual_item_cost'
		| 'jastip_fee'
		| 'total_estimated'
		| 'actual_total'
		| 'pricing_snapshot'
		| 'updated_at'
	>[],
	payouts: ProviderPayout[] = []
): ProviderEarningsSummary {
	const completed = orders.filter((o) => o.status === 'completed');

	let grossServiceFees = 0;
	let platformFees = 0;
	let totalItemReimbursements = 0;

	const history: OrderEarningEntry[] = completed.map((ord) => {
		const snapshot = ord.pricing_snapshot as unknown as PricingSnapshot | null;
		const platformFee = Number(snapshot?.summary?.platformFee ?? 0);
		const grossFee = Number(ord.jastip_fee || 0);
		const netEarning = Math.max(0, grossFee - platformFee);
		const itemReimbursement = Number(ord.actual_item_cost ?? ord.estimated_item_cost ?? 0);
		const recordedTotal = Number(ord.actual_total ?? ord.total_estimated ?? 0);

		grossServiceFees += grossFee;
		platformFees += platformFee;
		totalItemReimbursements += itemReimbursement;

		return {
			orderId: ord.id,
			orderNumber: ord.order_number,
			originName: ord.origin_name,
			completedAt: ord.updated_at,
			itemReimbursement,
			grossServiceFee: grossFee,
			platformFee,
			netProviderEarning: netEarning,
			recordedTotal
		};
	});

	const netProviderEarnings = Math.max(0, grossServiceFees - platformFees);
	const paidPayouts = payouts.filter((p) => p.status === 'paid');
	const recordedPayoutTotal = paidPayouts.reduce((sum, p) => sum + Number(p.amount || 0), 0);
	const unpaidRecordedBalance = Math.max(0, netProviderEarnings - recordedPayoutTotal);

	return {
		completedOrdersCount: completed.length,
		grossServiceFees,
		platformFees,
		netProviderEarnings,
		totalItemReimbursements,
		recordedPayoutTotal,
		unpaidRecordedBalance,
		hasRecordedPayouts: payouts.length > 0,
		history,
		payouts
	};
}

/**
 * Fetch provider earnings summary from Supabase (or fallback)
 */
export async function getProviderEarningsSummary(
	supabase: SupabaseClient<Database> | null,
	providerId: string
): Promise<ProviderEarningsSummary> {
	const orders = await getProviderOrders(supabase, providerId);
	let payouts: ProviderPayout[] = [];

	if (supabase) {
		try {
			const { data, error } = await supabase
				.from('provider_payouts')
				.select('*')
				.eq('provider_id', providerId)
				.order('created_at', { ascending: false });

			if (!error && data) {
				payouts = data;
				fallbackPayoutsByProvider.set(providerId, data);
			}
		} catch (err) {
			console.warn('[Earnings] DB payouts fetch fallback:', err);
		}
	} else {
		payouts = fallbackPayoutsByProvider.get(providerId) || [];
	}

	return calculateEarningsFromOrders(orders, payouts);
}
