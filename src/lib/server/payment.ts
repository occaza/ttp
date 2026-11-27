/**
 * Titipin - Manual Payment MVP Engine & Audit Trail (Phase 9)
 *
 * Implements:
 * - Pilot manual payment workflow (COD Tunai, Transfer Bank Manual, QRIS Manual)
 * - Strict decoupling: payment status is independent of order lifecycle status
 * - Unverified transfer proofs remain `awaiting_verification` until privileged approval
 * - Privileged verification/rejection/refund (admin or assigned provider) with immutable audit trail
 * - Private storage proof upload (`order-evidence` bucket) with signed URLs
 * - In-memory fallback caches for zero-downtime local testing
 */

import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
	Database,
	Order,
	Payment,
	PaymentEvent,
	PaymentEventType,
	PaymentMethod,
	PaymentStatus,
	UserRole
} from '#lib/types/database.types.js';
import { validateEvidenceFile, sendOrderMessage, createNotification } from './communication.ts';
import { getOrderDetails } from './order.ts';

export const ALLOWED_PAYMENT_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
	unpaid: ['unpaid', 'awaiting_verification', 'verified'],
	awaiting_verification: ['awaiting_verification', 'verified', 'rejected'],
	rejected: ['unpaid', 'awaiting_verification', 'verified'],
	verified: ['refunded'],
	refunded: []
};

export const submitPaymentSchema = z.object({
	order_id: z.string().min(1, 'ID pesanan wajib diisi'),
	method: z.enum(['cash_on_delivery', 'bank_transfer', 'qris_manual']),
	payer_name: z.string().trim().max(120, 'Nama pengirim maksimal 120 karakter').optional(),
	external_reference: z
		.string()
		.trim()
		.max(120, 'Nomor referensi transaksi maksimal 120 karakter')
		.optional(),
	notes: z.string().trim().max(300, 'Catatan maksimal 300 karakter').optional()
});

export const verifyPaymentSchema = z.object({
	order_id: z.string().min(1, 'ID pesanan wajib diisi'),
	paid_amount: z.number().nonnegative('Nominal pembayaran tidak boleh negatif'),
	external_reference: z.string().trim().max(120).optional(),
	note: z.string().trim().max(300).optional()
});

export const rejectPaymentSchema = z.object({
	order_id: z.string().min(1, 'ID pesanan wajib diisi'),
	rejection_reason: z
		.string()
		.trim()
		.min(3, 'Alasan penolakan minimal 3 karakter')
		.max(300, 'Alasan penolakan maksimal 300 karakter')
});

export const refundPaymentSchema = z.object({
	order_id: z.string().min(1, 'ID pesanan wajib diisi'),
	note: z
		.string()
		.trim()
		.min(3, 'Catatan pengembalian dana minimal 3 karakter')
		.max(300, 'Catatan maksimal 300 karakter')
});

export interface EnrichedPayment extends Payment {
	events: PaymentEvent[];
	proofSignedUrl?: string | null;
}

// In-memory fallback stores keyed by order_id
const fallbackPaymentsCache = new Map<string, Payment>();
const fallbackPaymentEventsCache = new Map<string, PaymentEvent[]>();

export function generatePaymentReference(): string {
	const now = new Date();
	const y = now.getFullYear();
	const m = String(now.getMonth() + 1).padStart(2, '0');
	const d = String(now.getDate()).padStart(2, '0');
	const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
	return `PAY-${y}${m}${d}-${rand}`;
}

export function canTransitionPayment(fromStatus: PaymentStatus, toStatus: PaymentStatus): boolean {
	return ALLOWED_PAYMENT_TRANSITIONS[fromStatus]?.includes(toStatus) ?? false;
}

export function isPrivilegedPaymentActor(
	actorRole: UserRole,
	actorId: string,
	order: Pick<Order, 'customer_id' | 'provider_id'>
): { authorized: boolean; reason?: string } {
	if (actorRole === 'admin') {
		return { authorized: true };
	}
	if (actorRole === 'provider' && order.provider_id === actorId) {
		return { authorized: true };
	}
	return {
		authorized: false,
		reason:
			'Hanya Admin/Owner atau Mitra Kurir terkait yang berwenang memverifikasi, menolak, atau mengembalikan pembayaran.'
	};
}

async function resolveProofSignedUrl(
	supabase: SupabaseClient<Database> | null,
	filePath: string | null
): Promise<string | null> {
	if (!supabase || !filePath) return null;
	try {
		const { data } = await supabase.storage.from('order-evidence').createSignedUrl(filePath, 3600);
		return data?.signedUrl || null;
	} catch {
		return null;
	}
}

async function appendPaymentEvent(
	supabase: SupabaseClient<Database> | null,
	params: {
		paymentId: string;
		orderId: string;
		eventType: PaymentEventType;
		fromStatus: string | null;
		toStatus: string;
		actorId: string | null;
		actorRole: 'customer' | 'provider' | 'admin' | 'system';
		amount?: number | null;
		externalReference?: string | null;
		note?: string | null;
	}
): Promise<PaymentEvent> {
	const evt: PaymentEvent = {
		id: crypto.randomUUID(),
		payment_id: params.paymentId,
		order_id: params.orderId,
		event_type: params.eventType,
		from_status: params.fromStatus,
		to_status: params.toStatus,
		actor_id: params.actorId,
		actor_role: params.actorRole,
		amount: params.amount ?? null,
		external_reference: params.externalReference ?? null,
		note: params.note ?? null,
		created_at: new Date().toISOString()
	};

	if (supabase) {
		try {
			const { data, error } = await supabase.from('payment_events').insert(evt).select().single();
			if (!error && data) {
				const existing = fallbackPaymentEventsCache.get(params.orderId) || [];
				fallbackPaymentEventsCache.set(params.orderId, [...existing, data]);
				return data;
			}
		} catch (err) {
			console.warn('[Payment] DB payment_events insert fallback:', err);
		}
	}

	const existing = fallbackPaymentEventsCache.get(params.orderId) || [];
	fallbackPaymentEventsCache.set(params.orderId, [...existing, evt]);
	return evt;
}

/**
 * Fetch payment + immutable audit events for an order
 */
export async function getPaymentByOrderId(
	supabase: SupabaseClient<Database> | null,
	orderId: string
): Promise<EnrichedPayment | null> {
	if (supabase) {
		try {
			const { data: paymentRow, error } = await supabase
				.from('payments')
				.select('*')
				.eq('order_id', orderId)
				.maybeSingle();

			if (!error && paymentRow) {
				const { data: eventRows } = await supabase
					.from('payment_events')
					.select('*')
					.eq('payment_id', paymentRow.id)
					.order('created_at', { ascending: true });

				const events = eventRows || [];
				fallbackPaymentsCache.set(orderId, paymentRow);
				fallbackPaymentEventsCache.set(orderId, events);

				const proofSignedUrl = await resolveProofSignedUrl(supabase, paymentRow.proof_file_path);
				return { ...paymentRow, events, proofSignedUrl };
			}
		} catch (err) {
			console.warn('[Payment] DB fetch payment fallback:', err);
		}
	}

	const cached = fallbackPaymentsCache.get(orderId);
	if (!cached) return null;
	const events = fallbackPaymentEventsCache.get(orderId) || [];
	return { ...cached, events, proofSignedUrl: null };
}

/**
 * List recent payments for Admin / Owner verification console
 */
export async function getAllPayments(
	supabase: SupabaseClient<Database> | null,
	limit = 50
): Promise<EnrichedPayment[]> {
	if (supabase) {
		try {
			const { data: rows, error } = await supabase
				.from('payments')
				.select('*')
				.order('updated_at', { ascending: false })
				.limit(limit);

			if (!error && rows) {
				const enriched = await Promise.all(
					rows.map(async (row) => {
						const { data: eventRows } = await supabase
							.from('payment_events')
							.select('*')
							.eq('payment_id', row.id)
							.order('created_at', { ascending: true });
						const proofSignedUrl = await resolveProofSignedUrl(supabase, row.proof_file_path);
						return { ...row, events: eventRows || [], proofSignedUrl };
					})
				);
				return enriched;
			}
		} catch (err) {
			console.warn('[Payment] DB list payments fallback:', err);
		}
	}

	return Array.from(fallbackPaymentsCache.values())
		.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
		.slice(0, limit)
		.map((p) => ({
			...p,
			events: fallbackPaymentEventsCache.get(p.order_id) || [],
			proofSignedUrl: null
		}));
}

/**
 * Customer or participant selects payment method and/or submits manual transfer proof.
 * INVARIANT: Unverified transfer proof NEVER sets status to 'verified'.
 */
export async function submitCustomerPayment(
	supabase: SupabaseClient<Database> | null,
	actorId: string,
	actorRole: UserRole,
	params: {
		orderId: string;
		method: PaymentMethod;
		payerName?: string;
		externalReference?: string;
		notes?: string;
		fileName?: string;
		mimeType?: string;
		fileSize?: number;
		fileBuffer?: ArrayBuffer | Uint8Array;
	}
): Promise<EnrichedPayment> {
	const validated = submitPaymentSchema.parse({
		order_id: params.orderId,
		method: params.method,
		payer_name: params.payerName,
		external_reference: params.externalReference,
		notes: params.notes
	});

	const order = await getOrderDetails(supabase, validated.order_id);
	if (!order) {
		throw new Error(`Pesanan dengan ID "${validated.order_id}" tidak ditemukan.`);
	}

	const isParticipant =
		order.customer_id === actorId || order.provider_id === actorId || actorRole === 'admin';
	if (!isParticipant) {
		throw new Error('Anda tidak memiliki akses untuk mengelola pembayaran pesanan ini.');
	}

	const existing = await getPaymentByOrderId(supabase, order.id);
	if (existing && (existing.status === 'verified' || existing.status === 'refunded')) {
		throw new Error(
			`Pembayaran sudah berstatus "${existing.status}" dan tidak dapat diubah lagi oleh pemesan.`
		);
	}

	// Validate optional transfer proof file
	let uploadedPath: string | null = existing?.proof_file_path || null;
	let uploadedName: string | null = existing?.proof_file_name || null;
	let uploadedMime: string | null = existing?.proof_mime_type || null;
	let uploadedSize: number | null = existing?.proof_file_size || null;
	let hasNewProofFile = false;

	if (params.fileName && params.fileSize && params.fileSize > 0) {
		const mime = params.mimeType || 'application/octet-stream';
		const validation = validateEvidenceFile(mime, params.fileSize);
		if (!validation.valid) {
			throw new Error(validation.error || 'File bukti pembayaran tidak valid.');
		}

		const sanitizedName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
		const storagePath = `payments/${order.id}/${Date.now()}-${sanitizedName}`;

		if (supabase && params.fileBuffer) {
			try {
				const { error: uploadErr } = await supabase.storage
					.from('order-evidence')
					.upload(storagePath, params.fileBuffer, {
						contentType: mime,
						upsert: false
					});
				if (uploadErr) {
					throw new Error(`Gagal mengunggah bukti ke penyimpanan: ${uploadErr.message}`);
				}
			} catch (err) {
				if (err instanceof Error && err.message.startsWith('Gagal mengunggah')) {
					throw err;
				}
				console.warn('[Payment] Storage upload fallback:', err);
			}
		}

		uploadedPath = storagePath;
		uploadedName = params.fileName;
		uploadedMime = mime;
		uploadedSize = params.fileSize;
		hasNewProofFile = true;
	}

	const hasExternalRef = Boolean(validated.external_reference?.trim());
	// Determine next status: unverified transfer proof ALWAYS becomes 'awaiting_verification', NEVER 'verified'
	const nextStatus: PaymentStatus =
		validated.method === 'cash_on_delivery'
			? 'unpaid'
			: hasNewProofFile || hasExternalRef || Boolean(uploadedPath)
				? 'awaiting_verification'
				: 'unpaid';

	const expectedAmount = Number(order.actual_total ?? order.total_estimated ?? 0);
	const now = new Date().toISOString();
	const fromStatus = existing?.status || null;

	const record: Payment = {
		id: existing?.id || crypto.randomUUID(),
		order_id: order.id,
		payment_reference: existing?.payment_reference || generatePaymentReference(),
		customer_id: order.customer_id,
		method: validated.method,
		status: nextStatus,
		expected_amount: expectedAmount,
		paid_amount: existing?.paid_amount ?? null,
		external_reference: validated.external_reference || existing?.external_reference || null,
		payer_name: validated.payer_name || existing?.payer_name || null,
		proof_file_path: uploadedPath,
		proof_file_name: uploadedName,
		proof_mime_type: uploadedMime,
		proof_file_size: uploadedSize,
		verified_by: null,
		verified_at: null,
		rejection_reason: null,
		notes: validated.notes || existing?.notes || null,
		created_at: existing?.created_at || now,
		updated_at: now
	};

	if (supabase) {
		try {
			if (existing) {
				const { data, error } = await supabase
					.from('payments')
					.update({
						method: record.method,
						status: record.status,
						expected_amount: record.expected_amount,
						external_reference: record.external_reference,
						payer_name: record.payer_name,
						proof_file_path: record.proof_file_path,
						proof_file_name: record.proof_file_name,
						proof_mime_type: record.proof_mime_type,
						proof_file_size: record.proof_file_size,
						rejection_reason: null,
						notes: record.notes,
						updated_at: now
					})
					.eq('id', existing.id)
					.select()
					.single();
				if (!error && data) {
					Object.assign(record, data);
				}
			} else {
				const { data, error } = await supabase.from('payments').insert(record).select().single();
				if (!error && data) {
					Object.assign(record, data);
				}
			}
		} catch (err) {
			console.warn('[Payment] DB save fallback:', err);
		}
	}

	fallbackPaymentsCache.set(order.id, record);

	const eventType: PaymentEventType = !existing
		? nextStatus === 'awaiting_verification'
			? 'proof_submitted'
			: 'created'
		: nextStatus === 'awaiting_verification'
			? 'proof_submitted'
			: 'method_selected';

	const eventNote =
		nextStatus === 'awaiting_verification'
			? `Bukti/referensi pembayaran diunggah (${validated.method}). Menunggu verifikasi resmi.`
			: `Metode pembayaran dipilih: ${validated.method}.`;

	await appendPaymentEvent(supabase, {
		paymentId: record.id,
		orderId: order.id,
		eventType,
		fromStatus,
		toStatus: nextStatus,
		actorId,
		actorRole,
		amount: expectedAmount,
		externalReference: record.external_reference,
		note: eventNote
	});

	await sendOrderMessage(supabase, {
		orderId: order.id,
		senderId: null,
		senderRole: 'system',
		message:
			nextStatus === 'awaiting_verification'
				? `Bukti pembayaran (${record.payment_reference}) dikirim dan menunggu verifikasi.`
				: `Metode pembayaran dipilih: ${validated.method === 'cash_on_delivery' ? 'COD Tunai' : validated.method} (${record.payment_reference}).`,
		isSystem: true
	});

	if (nextStatus === 'awaiting_verification') {
		await createNotification(supabase, {
			userId: order.provider_id,
			orderId: order.id,
			title: `Verifikasi Pembayaran: ${order.order_number}`,
			body: `Pemesan mengirim bukti pembayaran (${record.payment_reference}). Periksa sebelum mengonfirmasi lunas.`,
			type: 'payment_update'
		});
	}

	const events = fallbackPaymentEventsCache.get(order.id) || [];
	const proofSignedUrl = await resolveProofSignedUrl(supabase, record.proof_file_path);
	return { ...record, events, proofSignedUrl };
}

/**
 * Privileged payment verification (`admin` or assigned `provider`).
 * Customer is strictly forbidden from calling this transition.
 */
export async function verifyPayment(
	supabase: SupabaseClient<Database> | null,
	actorId: string,
	actorRole: UserRole,
	rawInput: unknown
): Promise<EnrichedPayment> {
	const input = verifyPaymentSchema.parse(rawInput);

	const order = await getOrderDetails(supabase, input.order_id);
	if (!order) {
		throw new Error(`Pesanan dengan ID "${input.order_id}" tidak ditemukan.`);
	}

	const authCheck = isPrivilegedPaymentActor(actorRole, actorId, order);
	if (!authCheck.authorized) {
		throw new Error(authCheck.reason || 'Akses verifikasi pembayaran ditolak.');
	}

	let existing = await getPaymentByOrderId(supabase, order.id);
	const now = new Date().toISOString();

	// If no payment record exists yet (e.g., direct COD settled on delivery), initialize one
	if (!existing) {
		const initRecord: Payment = {
			id: crypto.randomUUID(),
			order_id: order.id,
			payment_reference: generatePaymentReference(),
			customer_id: order.customer_id,
			method: 'cash_on_delivery',
			status: 'unpaid',
			expected_amount: Number(order.actual_total ?? order.total_estimated ?? 0),
			paid_amount: null,
			external_reference: null,
			payer_name: order.recipient_name,
			proof_file_path: null,
			proof_file_name: null,
			proof_mime_type: null,
			proof_file_size: null,
			verified_by: null,
			verified_at: null,
			rejection_reason: null,
			notes: null,
			created_at: now,
			updated_at: now
		};

		if (supabase) {
			try {
				const { data } = await supabase.from('payments').insert(initRecord).select().single();
				if (data) Object.assign(initRecord, data);
			} catch (err) {
				console.warn('[Payment] Init before verify fallback:', err);
			}
		}

		fallbackPaymentsCache.set(order.id, initRecord);
		await appendPaymentEvent(supabase, {
			paymentId: initRecord.id,
			orderId: order.id,
			eventType: 'created',
			fromStatus: null,
			toStatus: 'unpaid',
			actorId,
			actorRole,
			amount: initRecord.expected_amount,
			note: 'Inisiasi catatan pembayaran COD.'
		});
		existing = { ...initRecord, events: fallbackPaymentEventsCache.get(order.id) || [] };
	}

	if (!canTransitionPayment(existing.status, 'verified')) {
		throw new Error(
			`Tidak dapat memverifikasi pembayaran dengan status saat ini ("${existing.status}").`
		);
	}

	const fromStatus = existing.status;
	const updated: Payment = {
		...existing,
		status: 'verified',
		paid_amount: input.paid_amount,
		external_reference: input.external_reference || existing.external_reference,
		verified_by: actorId,
		verified_at: now,
		rejection_reason: null,
		notes: input.note || existing.notes,
		updated_at: now
	};
	// Remove non-table enriched keys before DB update
	const dbPatch = {
		status: updated.status,
		paid_amount: updated.paid_amount,
		external_reference: updated.external_reference,
		verified_by: updated.verified_by,
		verified_at: updated.verified_at,
		rejection_reason: null,
		notes: updated.notes,
		updated_at: now
	};

	if (supabase) {
		try {
			const { data, error } = await supabase
				.from('payments')
				.update(dbPatch)
				.eq('id', existing.id)
				.select()
				.single();
			if (!error && data) {
				Object.assign(updated, data);
			}
		} catch (err) {
			console.warn('[Payment] DB verify update fallback:', err);
		}
	}

	fallbackPaymentsCache.set(order.id, updated);

	await appendPaymentEvent(supabase, {
		paymentId: existing.id,
		orderId: order.id,
		eventType: 'verified',
		fromStatus,
		toStatus: 'verified',
		actorId,
		actorRole,
		amount: input.paid_amount,
		externalReference: updated.external_reference,
		note:
			input.note ||
			`Pembayaran diverifikasi sebesar Rp ${Number(input.paid_amount).toLocaleString('id-ID')}.`
	});

	await sendOrderMessage(supabase, {
		orderId: order.id,
		senderId: null,
		senderRole: 'system',
		message: `Pembayaran (${updated.payment_reference}) terverifikasi lunas sebesar Rp ${Number(input.paid_amount).toLocaleString('id-ID')}.`,
		isSystem: true
	});

	await createNotification(supabase, {
		userId: order.customer_id,
		orderId: order.id,
		title: `Pembayaran Terverifikasi (${order.order_number})`,
		body: `Pembayaran ${updated.payment_reference} sebesar Rp ${Number(input.paid_amount).toLocaleString('id-ID')} telah dikonfirmasi.`,
		type: 'payment_update'
	});

	const events = fallbackPaymentEventsCache.get(order.id) || [];
	const proofSignedUrl = await resolveProofSignedUrl(supabase, updated.proof_file_path);
	return { ...updated, events, proofSignedUrl };
}

/**
 * Privileged rejection of submitted payment proof (`admin` or assigned `provider`)
 */
export async function rejectPayment(
	supabase: SupabaseClient<Database> | null,
	actorId: string,
	actorRole: UserRole,
	rawInput: unknown
): Promise<EnrichedPayment> {
	const input = rejectPaymentSchema.parse(rawInput);

	const order = await getOrderDetails(supabase, input.order_id);
	if (!order) {
		throw new Error(`Pesanan dengan ID "${input.order_id}" tidak ditemukan.`);
	}

	const authCheck = isPrivilegedPaymentActor(actorRole, actorId, order);
	if (!authCheck.authorized) {
		throw new Error(authCheck.reason || 'Akses penolakan pembayaran ditolak.');
	}

	const existing = await getPaymentByOrderId(supabase, order.id);
	if (!existing) {
		throw new Error('Belum ada data pembayaran untuk pesanan ini.');
	}

	if (!canTransitionPayment(existing.status, 'rejected')) {
		throw new Error(
			`Tidak dapat menolak pembayaran dengan status saat ini ("${existing.status}").`
		);
	}

	const now = new Date().toISOString();
	const fromStatus = existing.status;

	const updated: Payment = {
		...existing,
		status: 'rejected',
		rejection_reason: input.rejection_reason,
		verified_by: null,
		verified_at: null,
		updated_at: now
	};

	if (supabase) {
		try {
			const { data, error } = await supabase
				.from('payments')
				.update({
					status: 'rejected',
					rejection_reason: input.rejection_reason,
					verified_by: null,
					verified_at: null,
					updated_at: now
				})
				.eq('id', existing.id)
				.select()
				.single();
			if (!error && data) {
				Object.assign(updated, data);
			}
		} catch (err) {
			console.warn('[Payment] DB reject update fallback:', err);
		}
	}

	fallbackPaymentsCache.set(order.id, updated);

	await appendPaymentEvent(supabase, {
		paymentId: existing.id,
		orderId: order.id,
		eventType: 'rejected',
		fromStatus,
		toStatus: 'rejected',
		actorId,
		actorRole,
		note: input.rejection_reason
	});

	await sendOrderMessage(supabase, {
		orderId: order.id,
		senderId: null,
		senderRole: 'system',
		message: `Bukti pembayaran (${updated.payment_reference}) ditolak: ${input.rejection_reason}`,
		isSystem: true
	});

	await createNotification(supabase, {
		userId: order.customer_id,
		orderId: order.id,
		title: `Bukti Pembayaran Ditolak (${order.order_number})`,
		body: `Alasan: ${input.rejection_reason}. Silakan unggah ulang bukti yang valid.`,
		type: 'payment_update'
	});

	const events = fallbackPaymentEventsCache.get(order.id) || [];
	const proofSignedUrl = await resolveProofSignedUrl(supabase, updated.proof_file_path);
	return { ...updated, events, proofSignedUrl };
}

/**
 * Privileged refund recording (`admin` or assigned `provider`)
 */
export async function refundPayment(
	supabase: SupabaseClient<Database> | null,
	actorId: string,
	actorRole: UserRole,
	rawInput: unknown
): Promise<EnrichedPayment> {
	const input = refundPaymentSchema.parse(rawInput);

	const order = await getOrderDetails(supabase, input.order_id);
	if (!order) {
		throw new Error(`Pesanan dengan ID "${input.order_id}" tidak ditemukan.`);
	}

	const authCheck = isPrivilegedPaymentActor(actorRole, actorId, order);
	if (!authCheck.authorized) {
		throw new Error(authCheck.reason || 'Akses refund pembayaran ditolak.');
	}

	const existing = await getPaymentByOrderId(supabase, order.id);
	if (!existing) {
		throw new Error('Belum ada data pembayaran untuk pesanan ini.');
	}

	if (!canTransitionPayment(existing.status, 'refunded')) {
		throw new Error(
			`Hanya pembayaran berstatus "verified" yang dapat di-refund (status saat ini: "${existing.status}").`
		);
	}

	const now = new Date().toISOString();
	const fromStatus = existing.status;

	const updated: Payment = {
		...existing,
		status: 'refunded',
		notes: input.note,
		updated_at: now
	};

	if (supabase) {
		try {
			const { data, error } = await supabase
				.from('payments')
				.update({
					status: 'refunded',
					notes: input.note,
					updated_at: now
				})
				.eq('id', existing.id)
				.select()
				.single();
			if (!error && data) {
				Object.assign(updated, data);
			}
		} catch (err) {
			console.warn('[Payment] DB refund update fallback:', err);
		}
	}

	fallbackPaymentsCache.set(order.id, updated);

	await appendPaymentEvent(supabase, {
		paymentId: existing.id,
		orderId: order.id,
		eventType: 'refunded',
		fromStatus,
		toStatus: 'refunded',
		actorId,
		actorRole,
		amount: updated.paid_amount,
		note: input.note
	});

	await sendOrderMessage(supabase, {
		orderId: order.id,
		senderId: null,
		senderRole: 'system',
		message: `Dana pembayaran (${updated.payment_reference}) telah dikembalikan: ${input.note}`,
		isSystem: true
	});

	await createNotification(supabase, {
		userId: order.customer_id,
		orderId: order.id,
		title: `Dana Dikembalikan (${order.order_number})`,
		body: `Pembayaran ${updated.payment_reference} telah di-refund. Catatan: ${input.note}`,
		type: 'payment_update'
	});

	const events = fallbackPaymentEventsCache.get(order.id) || [];
	const proofSignedUrl = await resolveProofSignedUrl(supabase, updated.proof_file_path);
	return { ...updated, events, proofSignedUrl };
}
