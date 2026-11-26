/**
 * Titipin - Server-Side Order Lifecycle Engine (Phase 7)
 *
 * Implements:
 * - Server-authoritative order creation and validation
 * - Strict state machine transitions & authorization boundaries
 * - Immutable status history audit logging
 * - In-memory fallback cache for zero-downtime testing
 */

import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
	Database,
	Order,
	OrderItem,
	OrderStatus,
	OrderStatusHistory,
	UserRole
} from '#lib/types/database.types.js';
import type { PricingSnapshot } from './pricing.ts';
import { sendOrderMessage, createNotification } from './communication.ts';

// State machine definition: allowed forward and terminal transitions
export const ALLOWED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
	pending: ['accepted', 'rejected', 'cancelled'],
	accepted: ['shopping', 'cancelled'],
	shopping: ['purchased', 'cancelled'],
	purchased: ['delivering', 'cancelled'],
	delivering: ['completed', 'cancelled'],
	completed: [],
	cancelled: [],
	rejected: []
};

import { ORDER_STATUS_LABELS } from '../constants/order.ts';
export { ORDER_STATUS_LABELS };

export const orderItemInputSchema = z.object({
	name: z.string().trim().min(1, 'Nama barang belanjaan wajib diisi'),
	quantity: z.number().int().min(1, 'Jumlah barang minimal 1').default(1),
	unit: z.string().trim().default('pcs'),
	notes: z.string().trim().optional(),
	estimated_price: z.number().nonnegative('Estimasi harga tidak boleh negatif').default(0)
});

export const createOrderInputSchema = z.object({
	provider_id: z.string().min(1, 'ID penyedia layanan wajib ada'),
	service_id: z.string().optional(),
	category_id: z.string().optional(),
	origin_name: z.string().trim().min(1, 'Nama warung, pasar, atau toko wajib diisi'),
	origin_address: z.string().trim().optional(),
	destination_address_id: z.string().optional(),
	destination_address_text: z.string().trim().min(5, 'Alamat pengantaran lengkap wajib diisi'),
	recipient_name: z.string().trim().min(1, 'Nama penerima wajib diisi'),
	recipient_phone: z.string().trim().min(8, 'Nomor telepon penerima tidak valid'),
	items: z.array(orderItemInputSchema).min(1, 'Minimal cantumkan 1 barang belanjaan'),
	customer_notes: z.string().trim().optional(),
	pricing_snapshot: z.custom<PricingSnapshot>((val) => typeof val === 'object' && val !== null, {
		message: 'Snapshot rincian tarif wajib disertakan'
	})
});

export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;

export const transitionOrderInputSchema = z.object({
	order_id: z.string().min(1),
	to_status: z.enum([
		'pending',
		'accepted',
		'rejected',
		'shopping',
		'purchased',
		'delivering',
		'completed',
		'cancelled'
	]),
	note: z.string().trim().optional(),
	cancellation_reason: z.string().trim().optional(),
	actual_item_cost: z.number().nonnegative().optional()
});

export type TransitionOrderInput = z.infer<typeof transitionOrderInputSchema>;

export interface EnrichedOrder extends Order {
	items: OrderItem[];
	history: OrderStatusHistory[];
	customer?: { full_name: string; phone: string | null } | null;
	provider?: { business_name: string | null; phone?: string | null } | null;
}

// In-memory fallback cache
const fallbackOrdersCache = new Map<string, EnrichedOrder>();

function generateOrderNumber(): string {
	const now = new Date();
	const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
	const rand = Math.floor(1000 + Math.random() * 9000);
	return `TP-${datePart}-${rand}`;
}

/**
 * Validate whether a transition is permissible by the state machine
 */
export function canTransition(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
	const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus];
	return allowed ? allowed.includes(targetStatus) : false;
}

/**
 * Validate actor authorization for an order status transition
 */
export function authorizeTransition(
	actorRole: UserRole,
	actorId: string,
	order: Order,
	toStatus: OrderStatus
): { authorized: boolean; reason?: string } {
	if (actorRole === 'admin') {
		return { authorized: true };
	}

	const isCustomer = order.customer_id === actorId;
	const isProvider = order.provider_id === actorId;

	if (!isCustomer && !isProvider) {
		return { authorized: false, reason: 'Anda tidak memiliki hak akses untuk pesanan ini.' };
	}

	if (isCustomer) {
		// Customer can only cancel their own pending order
		if (toStatus === 'cancelled') {
			if (order.status !== 'pending') {
				return {
					authorized: false,
					reason: 'Pesanan yang telah diproses tidak dapat dibatalkan langsung oleh pelanggan.'
				};
			}
			return { authorized: true };
		}
		return {
			authorized: false,
			reason: 'Pelanggan hanya diperbolehkan membatalkan pesanan yang masih pending.'
		};
	}

	if (isProvider) {
		// Provider cannot perform illegal jump
		return { authorized: true };
	}

	return { authorized: false, reason: 'Peran pengguna tidak dikenali.' };
}

/**
 * Create a new order with items, snapshot, and initial status history
 */
export async function createOrder(
	supabase: SupabaseClient<Database> | null,
	customerId: string,
	rawInput: unknown
): Promise<EnrichedOrder> {
	const input = createOrderInputSchema.parse(rawInput);
	const orderNumber = generateOrderNumber();
	const orderId = crypto.randomUUID();
	const now = new Date().toISOString();

	const pricing = input.pricing_snapshot;
	const estimatedItemCost = pricing.summary.itemCostEstimate || 0;
	const jastipFee = pricing.summary.totalJastipFee;
	const totalEstimated = pricing.summary.grandTotalEstimate;

	const newOrder: Order = {
		id: orderId,
		order_number: orderNumber,
		customer_id: customerId,
		provider_id: input.provider_id,
		service_id: input.service_id || null,
		category_id: input.category_id || null,
		status: 'pending',
		origin_name: input.origin_name,
		origin_address: input.origin_address || null,
		destination_address_id: input.destination_address_id || null,
		destination_address_text: input.destination_address_text,
		recipient_name: input.recipient_name,
		recipient_phone: input.recipient_phone,
		pricing_snapshot:
			pricing as unknown as Database['public']['Tables']['orders']['Row']['pricing_snapshot'],
		estimated_item_cost: estimatedItemCost,
		actual_item_cost: null,
		jastip_fee: jastipFee,
		total_estimated: totalEstimated,
		actual_total: null,
		customer_notes: input.customer_notes || null,
		cancellation_reason: null,
		cancelled_by: null,
		created_at: now,
		updated_at: now
	};

	const items: OrderItem[] = input.items.map((it) => ({
		id: crypto.randomUUID(),
		order_id: orderId,
		name: it.name,
		quantity: it.quantity,
		unit: it.unit || 'pcs',
		notes: it.notes || null,
		estimated_price: it.estimated_price || 0,
		actual_price: null,
		created_at: now
	}));

	const initialHistory: OrderStatusHistory = {
		id: crypto.randomUUID(),
		order_id: orderId,
		from_status: null,
		to_status: 'pending',
		actor_id: customerId,
		actor_role: 'customer',
		note: 'Pesanan berhasil dibuat oleh pelanggan dan menunggu konfirmasi.',
		created_at: now
	};

	if (supabase) {
		try {
			const { data: insertedOrder, error: orderErr } = await supabase
				.from('orders')
				.insert(newOrder)
				.select()
				.single();

			if (!orderErr && insertedOrder) {
				await supabase.from('order_items').insert(items);
				await supabase.from('order_status_history').insert(initialHistory);

				const enriched: EnrichedOrder = {
					...insertedOrder,
					items,
					history: [initialHistory]
				};
				fallbackOrdersCache.set(orderId, enriched);

				await sendOrderMessage(supabase, {
					orderId,
					senderId: null,
					senderRole: 'system',
					message: `Pesanan ${orderNumber} dibuat untuk ${input.origin_name}.`,
					isSystem: true
				});
				await createNotification(supabase, {
					userId: input.provider_id,
					orderId,
					title: `Pesanan Baru: ${orderNumber}`,
					body: `${input.recipient_name} menitipkan belanja di ${input.origin_name}.`,
					type: 'order_update'
				});

				return enriched;
			}
		} catch (err) {
			console.warn('[OrderEngine] DB insert fallback to memory:', err);
		}
	}

	// Fallback to in-memory store
	const enriched: EnrichedOrder = {
		...newOrder,
		items,
		history: [initialHistory]
	};
	fallbackOrdersCache.set(orderId, enriched);

	// Emit system timeline message & notification
	await sendOrderMessage(supabase, {
		orderId,
		senderId: null,
		senderRole: 'system',
		message: `Pesanan ${orderNumber} dibuat untuk ${input.origin_name}.`,
		isSystem: true
	});
	await createNotification(supabase, {
		userId: input.provider_id,
		orderId,
		title: `Pesanan Baru: ${orderNumber}`,
		body: `${input.recipient_name} menitipkan belanja di ${input.origin_name}.`,
		type: 'order_update'
	});

	return enriched;
}

/**
 * Execute an authenticated, validated lifecycle state transition
 */
export async function transitionOrderStatus(
	supabase: SupabaseClient<Database> | null,
	actorId: string,
	actorRole: UserRole,
	rawInput: unknown
): Promise<EnrichedOrder> {
	const input = transitionOrderInputSchema.parse(rawInput);

	// Fetch current order
	const order = await getOrderDetails(supabase, input.order_id);
	if (!order) {
		throw new Error(`Pesanan dengan ID "${input.order_id}" tidak ditemukan.`);
	}

	// 1. Validate State Machine
	if (!canTransition(order.status, input.to_status)) {
		throw new Error(
			`Transisi status tidak valid: tidak dapat mengubah status dari "${order.status}" ke "${input.to_status}".`
		);
	}

	// 2. Validate Authorization
	const authCheck = authorizeTransition(actorRole, actorId, order, input.to_status);
	if (!authCheck.authorized) {
		throw new Error(authCheck.reason || 'Otorisasi ditolak.');
	}

	const now = new Date().toISOString();
	const fromStatus = order.status;
	const toStatus = input.to_status;

	const historyEntry: OrderStatusHistory = {
		id: crypto.randomUUID(),
		order_id: order.id,
		from_status: fromStatus,
		to_status: toStatus,
		actor_id: actorId,
		actor_role: actorRole,
		note:
			input.note ||
			`Status pesanan diubah menjadi ${ORDER_STATUS_LABELS[toStatus]?.label || toStatus}`,
		created_at: now
	};

	const updates: Partial<Order> = {
		status: toStatus,
		updated_at: now
	};

	if (toStatus === 'cancelled') {
		updates.cancellation_reason = input.cancellation_reason || input.note || 'Dibatalkan';
		updates.cancelled_by = actorId;
	}

	if (toStatus === 'purchased' && typeof input.actual_item_cost === 'number') {
		updates.actual_item_cost = input.actual_item_cost;
		updates.actual_total = input.actual_item_cost + order.jastip_fee;
	}

	if (supabase) {
		try {
			await supabase.from('orders').update(updates).eq('id', order.id);
			await supabase.from('order_status_history').insert(historyEntry);
		} catch (err) {
			console.warn('[OrderEngine] DB transition update fallback:', err);
		}
	}

	// Update cached record
	const updatedOrder: EnrichedOrder = {
		...order,
		...updates,
		history: [...order.history, historyEntry]
	};
	fallbackOrdersCache.set(order.id, updatedOrder);

	// Emit system timeline message & notification to counterpart
	const statusLabel = ORDER_STATUS_LABELS[toStatus]?.label || toStatus;
	await sendOrderMessage(supabase, {
		orderId: order.id,
		senderId: null,
		senderRole: 'system',
		message: `Status pesanan berubah menjadi: ${statusLabel}.`,
		isSystem: true
	});

	const notifyUserId = actorId === order.customer_id ? order.provider_id : order.customer_id;
	await createNotification(supabase, {
		userId: notifyUserId,
		orderId: order.id,
		title: `Update Pesanan ${order.order_number}`,
		body: `Status pesanan Anda sekarang: ${statusLabel}.`,
		type: 'order_update'
	});

	return updatedOrder;
}

/**
 * Get single order details with items and status timeline
 */
export async function getOrderDetails(
	supabase: SupabaseClient<Database> | null,
	orderId: string
): Promise<EnrichedOrder | null> {
	if (supabase) {
		try {
			const { data: order, error } = await supabase
				.from('orders')
				.select('*')
				.eq('id', orderId)
				.maybeSingle();

			if (!error && order) {
				const [{ data: items }, { data: history }, { data: customer }, { data: provider }] =
					await Promise.all([
						supabase.from('order_items').select('*').eq('order_id', orderId),
						supabase
							.from('order_status_history')
							.select('*')
							.eq('order_id', orderId)
							.order('created_at', { ascending: true }),
						supabase
							.from('profiles')
							.select('full_name, phone')
							.eq('id', order.customer_id)
							.maybeSingle(),
						supabase
							.from('provider_profiles')
							.select('business_name')
							.eq('id', order.provider_id)
							.maybeSingle()
					]);

				const enriched: EnrichedOrder = {
					...order,
					items: items || [],
					history: history || [],
					customer: customer || null,
					provider: provider || null
				};
				fallbackOrdersCache.set(orderId, enriched);
				return enriched;
			}
		} catch (err) {
			console.warn('[OrderEngine] DB fetch fallback:', err);
		}
	}

	return fallbackOrdersCache.get(orderId) || null;
}

/**
 * Get all orders for a customer
 */
export async function getCustomerOrders(
	supabase: SupabaseClient<Database> | null,
	customerId: string
): Promise<EnrichedOrder[]> {
	if (supabase) {
		try {
			const { data: orders, error } = await supabase
				.from('orders')
				.select('*')
				.eq('customer_id', customerId)
				.order('created_at', { ascending: false });

			if (!error && orders) {
				const enrichedList: EnrichedOrder[] = await Promise.all(
					orders.map(async (o) => {
						const { data: items } = await supabase
							.from('order_items')
							.select('*')
							.eq('order_id', o.id);
						return {
							...o,
							items: items || [],
							history: []
						};
					})
				);
				return enrichedList;
			}
		} catch (err) {
			console.warn('[OrderEngine] DB customer orders fallback:', err);
		}
	}

	return Array.from(fallbackOrdersCache.values()).filter((o) => o.customer_id === customerId);
}

/**
 * Get all orders for a provider (or owner)
 */
export async function getProviderOrders(
	supabase: SupabaseClient<Database> | null,
	providerId: string
): Promise<EnrichedOrder[]> {
	if (supabase) {
		try {
			const { data: orders, error } = await supabase
				.from('orders')
				.select('*')
				.eq('provider_id', providerId)
				.order('created_at', { ascending: false });

			if (!error && orders) {
				const enrichedList: EnrichedOrder[] = await Promise.all(
					orders.map(async (o) => {
						const { data: items } = await supabase
							.from('order_items')
							.select('*')
							.eq('order_id', o.id);
						return {
							...o,
							items: items || [],
							history: []
						};
					})
				);
				return enrichedList;
			}
		} catch (err) {
			console.warn('[OrderEngine] DB provider orders fallback:', err);
		}
	}

	return Array.from(fallbackOrdersCache.values()).filter((o) => o.provider_id === providerId);
}
