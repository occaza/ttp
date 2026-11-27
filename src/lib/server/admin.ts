/**
 * Titipin - Admin Console, Moderation, Disputes & Audit Logs (Phase 11)
 *
 * Implements:
 * - Permission-protected admin actions (admin role strictly enforced)
 * - Append-only audit logging for all admin & moderation operations
 * - Dispute/report foundation for order issues
 * - Provider moderation (verification & operational status)
 * - Pricing rules management
 */

import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
	AuditLog,
	Database,
	Dispute,
	Json,
	PricingRule,
	ProviderProfile,
	UserRole
} from '#lib/types/database.types.js';
import { DEFAULT_GATAK_PRICING_RULES } from './pricing.ts';
import { getOrderDetails } from './order.ts';

export const createDisputeSchema = z.object({
	order_id: z.string().min(1, 'ID pesanan wajib diisi'),
	reason: z
		.string()
		.trim()
		.min(3, 'Judul/alasan laporan minimal 3 karakter')
		.max(120, 'Alasan laporan maksimal 120 karakter'),
	description: z
		.string()
		.trim()
		.min(5, 'Deskripsi masalah minimal 5 karakter')
		.max(1000, 'Deskripsi masalah maksimal 1000 karakter')
});

export const updateDisputeSchema = z.object({
	dispute_id: z.string().min(1, 'ID laporan wajib diisi'),
	status: z.enum(['open', 'investigating', 'resolved', 'dismissed']),
	resolution_note: z
		.string()
		.trim()
		.max(500, 'Catatan penyelesaian maksimal 500 karakter')
		.optional()
});

export const moderateProviderSchema = z.object({
	provider_id: z.string().min(1, 'ID mitra wajib diisi'),
	is_verified: z.boolean().optional(),
	is_active: z.boolean().optional()
});

export const updatePricingRuleSchema = z.object({
	id: z.string().min(1, 'ID aturan tarif wajib diisi'),
	name: z.string().trim().min(3, 'Nama aturan minimal 3 karakter').max(100),
	base_fee: z.number().nonnegative('Tarif dasar tidak boleh negatif'),
	base_distance_km: z.number().nonnegative('Jarak dasar tidak boleh negatif'),
	per_km_fee: z.number().nonnegative('Tarif per km tidak boleh negatif'),
	platform_fee: z.number().nonnegative('Biaya platform tidak boleh negatif'),
	min_order_fee: z.number().nonnegative('Tarif minimum tidak boleh negatif'),
	is_active: z.boolean()
});

export interface AuditLogWithActor extends AuditLog {
	actor_name?: string;
}

export interface DisputeWithDetails extends Dispute {
	order_number?: string | null;
	reporter_name?: string | null;
}

export interface ProviderAdminEntry extends ProviderProfile {
	full_name?: string;
	phone?: string | null;
	services_count: number;
}

// In-memory fallback stores for offline/verification runs
const fallbackAuditLogs: AuditLogWithActor[] = [];
const fallbackDisputes = new Map<string, DisputeWithDetails>();
const fallbackProviders = new Map<string, ProviderAdminEntry>();
const fallbackPricingRules = new Map<string, PricingRule>(
	Object.entries(DEFAULT_GATAK_PRICING_RULES)
);

function assertAdminRole(actorRole: string, actionLabel: string): void {
	if (actorRole !== 'admin') {
		throw new Error(`Akses ditolak: hanya admin yang dapat ${actionLabel}.`);
	}
}

/**
 * Record an auditable admin action
 */
export async function recordAuditLog(
	supabase: SupabaseClient<Database> | null | undefined,
	actorId: string,
	actorRole: string,
	input: {
		action: string;
		target_type: string;
		target_id?: string | null;
		metadata?: Record<string, unknown>;
	}
): Promise<AuditLog> {
	assertAdminRole(actorRole, 'mencatat audit log');

	const payload = {
		actor_id: actorId,
		actor_role: actorRole,
		action: input.action,
		target_type: input.target_type,
		target_id: input.target_id ?? null,
		metadata: (input.metadata ?? {}) as Json
	};

	if (supabase) {
		try {
			const { data, error } = await supabase
				.from('audit_logs')
				.insert(payload)
				.select('*')
				.single();

			if (!error && data) {
				return data;
			}
		} catch (err) {
			console.warn('[Admin] Failed to insert audit_logs, using fallback:', err);
		}
	}

	const fallbackEntry: AuditLogWithActor = {
		id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
		actor_id: payload.actor_id,
		actor_role: payload.actor_role,
		action: payload.action,
		target_type: payload.target_type,
		target_id: payload.target_id,
		metadata: payload.metadata,
		created_at: new Date().toISOString()
	};
	fallbackAuditLogs.unshift(fallbackEntry);
	return fallbackEntry;
}

/**
 * Fetch recent audit logs for Admin Console
 */
export async function getAuditLogs(
	supabase: SupabaseClient<Database> | null | undefined,
	limit: number = 50
): Promise<AuditLogWithActor[]> {
	if (supabase) {
		try {
			const { data, error } = await supabase
				.from('audit_logs')
				.select('*')
				.order('created_at', { ascending: false })
				.limit(limit);

			if (!error && data) {
				const actorIds = Array.from(
					new Set(data.map((d) => d.actor_id).filter((id): id is string => Boolean(id)))
				);
				const nameMap = new Map<string, string>();
				if (actorIds.length > 0) {
					const { data: profiles } = await supabase
						.from('profiles')
						.select('id, full_name')
						.in('id', actorIds);
					if (profiles) {
						for (const p of profiles) {
							nameMap.set(p.id, p.full_name);
						}
					}
				}
				return data.map((row) => ({
					...row,
					actor_name: row.actor_id ? nameMap.get(row.actor_id) || 'Admin' : 'Sistem'
				}));
			}
		} catch (err) {
			console.warn('[Admin] Failed to fetch audit_logs:', err);
		}
	}

	return fallbackAuditLogs.slice(0, limit);
}

/**
 * Create a dispute/report on an order (customer, provider, or admin)
 */
export async function createDispute(
	supabase: SupabaseClient<Database> | null | undefined,
	reporterId: string,
	reporterRole: UserRole,
	rawInput: unknown
): Promise<Dispute> {
	const parsed = createDisputeSchema.safeParse(rawInput);
	if (!parsed.success) {
		throw new Error(parsed.error.issues[0]?.message || 'Input laporan tidak valid.');
	}

	const input = parsed.data;
	const order = await getOrderDetails(supabase ?? null, input.order_id);
	if (!order) {
		throw new Error('Pesanan tidak ditemukan.');
	}
	if (
		reporterRole !== 'admin' &&
		order.customer_id !== reporterId &&
		order.provider_id !== reporterId
	) {
		throw new Error('Anda tidak memiliki akses untuk melaporkan pesanan ini.');
	}

	const now = new Date().toISOString();

	if (supabase) {
		const { data, error } = await supabase
			.from('disputes')
			.insert({
				order_id: input.order_id,
				reporter_id: reporterId,
				reporter_role: reporterRole,
				reason: input.reason,
				description: input.description,
				status: 'open'
			})
			.select('*')
			.single();

		if (error || !data) {
			throw new Error(`Gagal menyimpan laporan: ${error?.message || 'Kesalahan database'}`);
		}
		return data;
	}

	const dispute: DisputeWithDetails = {
		id: `disp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
		order_id: input.order_id,
		reporter_id: reporterId,
		reporter_role: reporterRole,
		reason: input.reason,
		description: input.description,
		status: 'open',
		resolution_note: null,
		resolved_by: null,
		resolved_at: null,
		created_at: now,
		updated_at: now,
		order_number: order.order_number
	};
	fallbackDisputes.set(dispute.id, dispute);
	return dispute;
}

/**
 * Get disputes linked to a specific order
 */
export async function getDisputesForOrder(
	supabase: SupabaseClient<Database> | null | undefined,
	orderId: string
): Promise<Dispute[]> {
	if (supabase) {
		try {
			const { data, error } = await supabase
				.from('disputes')
				.select('*')
				.eq('order_id', orderId)
				.order('created_at', { ascending: false });

			if (!error && data) {
				return data;
			}
		} catch (err) {
			console.warn('[Admin] Failed to fetch order disputes:', err);
		}
	}

	return Array.from(fallbackDisputes.values()).filter((d) => d.order_id === orderId);
}

/**
 * Fetch all disputes for Admin Console
 */
export async function getDisputesForAdmin(
	supabase: SupabaseClient<Database> | null | undefined,
	limit: number = 50
): Promise<DisputeWithDetails[]> {
	if (supabase) {
		try {
			const { data, error } = await supabase
				.from('disputes')
				.select('*')
				.order('created_at', { ascending: false })
				.limit(limit);

			if (!error && data) {
				const orderIds = Array.from(new Set(data.map((d) => d.order_id)));
				const reporterIds = Array.from(new Set(data.map((d) => d.reporter_id)));

				const orderMap = new Map<string, string>();
				const reporterMap = new Map<string, string>();

				if (orderIds.length > 0) {
					const { data: orders } = await supabase
						.from('orders')
						.select('id, order_number')
						.in('id', orderIds);
					if (orders) {
						for (const o of orders) orderMap.set(o.id, o.order_number);
					}
				}

				if (reporterIds.length > 0) {
					const { data: profiles } = await supabase
						.from('profiles')
						.select('id, full_name')
						.in('id', reporterIds);
					if (profiles) {
						for (const p of profiles) reporterMap.set(p.id, p.full_name);
					}
				}

				return data.map((d) => ({
					...d,
					order_number: orderMap.get(d.order_id) || null,
					reporter_name: reporterMap.get(d.reporter_id) || 'Pengguna'
				}));
			}
		} catch (err) {
			console.warn('[Admin] Failed to fetch disputes:', err);
		}
	}

	return Array.from(fallbackDisputes.values())
		.sort((a, b) => b.created_at.localeCompare(a.created_at))
		.slice(0, limit);
}

/**
 * Update dispute status & record audit log (Admin only)
 */
export async function updateDisputeStatus(
	supabase: SupabaseClient<Database> | null | undefined,
	adminId: string,
	adminRole: string,
	rawInput: unknown
): Promise<Dispute> {
	assertAdminRole(adminRole, 'memperbarui status sengketa');

	const parsed = updateDisputeSchema.safeParse(rawInput);
	if (!parsed.success) {
		throw new Error(parsed.error.issues[0]?.message || 'Input pembaruan laporan tidak valid.');
	}

	const input = parsed.data;
	const now = new Date().toISOString();
	const isTerminal = input.status === 'resolved' || input.status === 'dismissed';

	let updated: Dispute;

	if (supabase) {
		const { data, error } = await supabase
			.from('disputes')
			.update({
				status: input.status,
				resolution_note: input.resolution_note ?? null,
				resolved_by: isTerminal ? adminId : null,
				resolved_at: isTerminal ? now : null,
				updated_at: now
			})
			.eq('id', input.dispute_id)
			.select('*')
			.single();

		if (error || !data) {
			throw new Error(`Gagal memperbarui laporan: ${error?.message || 'Laporan tidak ditemukan'}`);
		}
		updated = data;
	} else {
		const existing = fallbackDisputes.get(input.dispute_id);
		if (!existing) {
			throw new Error('Laporan tidak ditemukan.');
		}
		updated = {
			...existing,
			status: input.status,
			resolution_note: input.resolution_note ?? existing.resolution_note,
			resolved_by: isTerminal ? adminId : null,
			resolved_at: isTerminal ? now : null,
			updated_at: now
		};
		fallbackDisputes.set(input.dispute_id, updated);
	}

	await recordAuditLog(supabase, adminId, adminRole, {
		action: 'dispute.status_updated',
		target_type: 'dispute',
		target_id: input.dispute_id,
		metadata: {
			status: input.status,
			resolution_note: input.resolution_note || null
		}
	});

	return updated;
}

/**
 * Fetch provider profiles & service counts for Admin moderation
 */
export async function getProvidersForAdmin(
	supabase: SupabaseClient<Database> | null | undefined
): Promise<ProviderAdminEntry[]> {
	if (supabase) {
		try {
			const { data: providers, error } = await supabase
				.from('provider_profiles')
				.select('*')
				.order('created_at', { ascending: false });

			if (!error && providers) {
				const ids = providers.map((p) => p.id);
				const profileMap = new Map<string, { full_name: string; phone: string | null }>();
				const serviceCounts = new Map<string, number>();

				if (ids.length > 0) {
					const [{ data: profiles }, { data: services }] = await Promise.all([
						supabase.from('profiles').select('id, full_name, phone').in('id', ids),
						supabase.from('provider_services').select('id, provider_id').in('provider_id', ids)
					]);

					if (profiles) {
						for (const p of profiles) {
							profileMap.set(p.id, { full_name: p.full_name, phone: p.phone });
						}
					}
					if (services) {
						for (const s of services) {
							serviceCounts.set(s.provider_id, (serviceCounts.get(s.provider_id) || 0) + 1);
						}
					}
				}

				return providers.map((prov) => ({
					...prov,
					full_name: profileMap.get(prov.id)?.full_name || prov.business_name || 'Mitra',
					phone: profileMap.get(prov.id)?.phone || null,
					services_count: serviceCounts.get(prov.id) || 0
				}));
			}
		} catch (err) {
			console.warn('[Admin] Failed to fetch providers:', err);
		}
	}

	return Array.from(fallbackProviders.values());
}

/**
 * Seed fallback provider for verification tests
 */
export function seedFallbackProviderForTest(entry: ProviderAdminEntry): void {
	fallbackProviders.set(entry.id, entry);
}

/**
 * Moderate provider (verify/activate/deactivate) with audit log
 */
export async function moderateProvider(
	supabase: SupabaseClient<Database> | null | undefined,
	adminId: string,
	adminRole: string,
	rawInput: unknown
): Promise<ProviderProfile> {
	assertAdminRole(adminRole, 'memoderasi mitra');

	const parsed = moderateProviderSchema.safeParse(rawInput);
	if (!parsed.success) {
		throw new Error(parsed.error.issues[0]?.message || 'Data moderasi mitra tidak valid.');
	}

	const input = parsed.data;
	const now = new Date().toISOString();
	const updates: Partial<ProviderProfile> = { updated_at: now };
	if (typeof input.is_verified === 'boolean') updates.is_verified = input.is_verified;
	if (typeof input.is_active === 'boolean') updates.is_active = input.is_active;

	let updated: ProviderProfile;

	if (supabase) {
		const { data, error } = await supabase
			.from('provider_profiles')
			.update(updates)
			.eq('id', input.provider_id)
			.select('*')
			.single();

		if (error || !data) {
			throw new Error(
				`Gagal memperbarui status mitra: ${error?.message || 'Mitra tidak ditemukan'}`
			);
		}
		updated = data;
	} else {
		const existing = fallbackProviders.get(input.provider_id);
		if (!existing) {
			throw new Error('Mitra tidak ditemukan.');
		}
		const merged: ProviderAdminEntry = { ...existing, ...updates };
		fallbackProviders.set(input.provider_id, merged);
		updated = merged;
	}

	await recordAuditLog(supabase, adminId, adminRole, {
		action: 'provider.moderated',
		target_type: 'provider_profile',
		target_id: input.provider_id,
		metadata: {
			is_verified: updates.is_verified,
			is_active: updates.is_active
		}
	});

	return updated;
}

/**
 * Fetch all pricing rules for Admin Console
 */
export async function getAllPricingRules(
	supabase: SupabaseClient<Database> | null | undefined
): Promise<PricingRule[]> {
	if (supabase) {
		try {
			const { data, error } = await supabase
				.from('pricing_rules')
				.select('*')
				.order('created_at', { ascending: true });

			if (!error && data && data.length > 0) {
				return data;
			}
		} catch (err) {
			console.warn('[Admin] Failed to fetch pricing_rules:', err);
		}
	}

	return Array.from(fallbackPricingRules.values());
}

/**
 * Update a pricing rule with permission check & audit log
 */
export async function updatePricingRule(
	supabase: SupabaseClient<Database> | null | undefined,
	adminId: string,
	adminRole: string,
	rawInput: unknown
): Promise<PricingRule> {
	assertAdminRole(adminRole, 'mengubah aturan tarif');

	const parsed = updatePricingRuleSchema.safeParse(rawInput);
	if (!parsed.success) {
		throw new Error(parsed.error.issues[0]?.message || 'Input aturan tarif tidak valid.');
	}

	const input = parsed.data;
	const now = new Date().toISOString();
	let updated: PricingRule;

	if (supabase) {
		const { data, error } = await supabase
			.from('pricing_rules')
			.update({
				name: input.name,
				base_fee: input.base_fee,
				base_distance_km: input.base_distance_km,
				per_km_fee: input.per_km_fee,
				platform_fee: input.platform_fee,
				min_order_fee: input.min_order_fee,
				is_active: input.is_active,
				updated_at: now
			})
			.eq('id', input.id)
			.select('*')
			.single();

		if (error || !data) {
			throw new Error(
				`Gagal memperbarui aturan tarif: ${error?.message || 'Aturan tidak ditemukan'}`
			);
		}
		updated = data;
	} else {
		const existing = fallbackPricingRules.get(input.id);
		if (!existing) {
			throw new Error('Aturan tarif tidak ditemukan.');
		}
		updated = {
			...existing,
			name: input.name,
			base_fee: input.base_fee,
			base_distance_km: input.base_distance_km,
			per_km_fee: input.per_km_fee,
			platform_fee: input.platform_fee,
			min_order_fee: input.min_order_fee,
			is_active: input.is_active,
			updated_at: now
		};
		fallbackPricingRules.set(input.id, updated);
	}

	await recordAuditLog(supabase, adminId, adminRole, {
		action: 'pricing_rule.updated',
		target_type: 'pricing_rule',
		target_id: input.id,
		metadata: {
			name: input.name,
			base_fee: input.base_fee,
			per_km_fee: input.per_km_fee,
			platform_fee: input.platform_fee,
			is_active: input.is_active
		}
	});

	return updated;
}
