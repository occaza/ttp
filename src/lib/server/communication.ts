/**
 * Titipin - Order-Scoped Chat, Evidence Attachments & Notifications (Phase 8)
 *
 * Implements:
 * - Order-scoped chat messages + automatic system timeline messages
 * - Evidence file validation (JPEG/PNG/WebP/PDF, max 5 MB)
 * - Private attachment storage (`order-evidence` bucket + signed URLs)
 * - User notification inbox with read/unread state
 * - In-memory fallback caches for zero-downtime local testing
 */

import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
	Database,
	Notification,
	OrderAttachment,
	OrderMessage
} from '#lib/types/database.types.js';

export const ALLOWED_EVIDENCE_MIME_TYPES = [
	'image/jpeg',
	'image/png',
	'image/webp',
	'application/pdf'
] as const;

export const MAX_EVIDENCE_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const sendMessageSchema = z.object({
	order_id: z.string().min(1, 'ID pesanan wajib diisi'),
	message: z
		.string()
		.trim()
		.min(1, 'Pesan tidak boleh kosong')
		.max(1000, 'Pesan maksimal 1000 karakter')
});

export const uploadEvidenceMetadataSchema = z.object({
	order_id: z.string().min(1, 'ID pesanan wajib diisi'),
	attachment_type: z.enum(['receipt', 'delivery_proof', 'chat_image']),
	note: z.string().trim().max(300, 'Catatan maksimal 300 karakter').optional()
});

export interface FileValidationResult {
	valid: boolean;
	error?: string;
}

export function validateEvidenceFile(mimeType: string, fileSize: number): FileValidationResult {
	if (!fileSize || fileSize <= 0) {
		return { valid: false, error: 'File kosong atau tidak valid.' };
	}
	if (fileSize > MAX_EVIDENCE_FILE_SIZE_BYTES) {
		return { valid: false, error: 'Ukuran file maksimal 5 MB.' };
	}
	if (
		!ALLOWED_EVIDENCE_MIME_TYPES.includes(mimeType as (typeof ALLOWED_EVIDENCE_MIME_TYPES)[number])
	) {
		return {
			valid: false,
			error: 'Format file tidak didukung. Gunakan JPG, PNG, WebP, atau PDF.'
		};
	}
	return { valid: true };
}

export interface EnrichedAttachment extends OrderAttachment {
	signedUrl?: string | null;
}

// In-memory fallback caches
const fallbackMessagesCache = new Map<string, OrderMessage[]>();
const fallbackAttachmentsCache = new Map<string, EnrichedAttachment[]>();
const fallbackNotificationsCache = new Map<string, Notification[]>();

/**
 * Send a chat message or system timeline message scoped to an order
 */
export async function sendOrderMessage(
	supabase: SupabaseClient<Database> | null,
	params: {
		orderId: string;
		senderId: string | null;
		senderRole: 'customer' | 'provider' | 'admin' | 'system';
		message: string;
		isSystem?: boolean;
	}
): Promise<OrderMessage> {
	const validated = sendMessageSchema.parse({
		order_id: params.orderId,
		message: params.message
	});

	const now = new Date().toISOString();
	const newMessage: OrderMessage = {
		id: crypto.randomUUID(),
		order_id: validated.order_id,
		sender_id: params.senderId,
		sender_role: params.senderRole,
		message: validated.message,
		is_system: Boolean(params.isSystem),
		created_at: now
	};

	if (supabase) {
		try {
			const { data, error } = await supabase
				.from('order_messages')
				.insert(newMessage)
				.select()
				.single();

			if (!error && data) {
				const existing = fallbackMessagesCache.get(params.orderId) || [];
				fallbackMessagesCache.set(params.orderId, [...existing, data]);
				return data;
			}
		} catch (err) {
			console.warn('[Communication] DB message insert fallback:', err);
		}
	}

	const existing = fallbackMessagesCache.get(params.orderId) || [];
	fallbackMessagesCache.set(params.orderId, [...existing, newMessage]);
	return newMessage;
}

/**
 * Fetch messages for an order in chronological order
 */
export async function getOrderMessages(
	supabase: SupabaseClient<Database> | null,
	orderId: string
): Promise<OrderMessage[]> {
	if (supabase) {
		try {
			const { data, error } = await supabase
				.from('order_messages')
				.select('*')
				.eq('order_id', orderId)
				.order('created_at', { ascending: true });

			if (!error && data) {
				fallbackMessagesCache.set(orderId, data);
				return data;
			}
		} catch (err) {
			console.warn('[Communication] DB messages fetch fallback:', err);
		}
	}

	return fallbackMessagesCache.get(orderId) || [];
}

/**
 * Upload evidence attachment (receipt or delivery proof)
 */
export async function uploadOrderEvidence(
	supabase: SupabaseClient<Database> | null,
	params: {
		orderId: string;
		uploaderId: string;
		attachmentType: 'receipt' | 'delivery_proof' | 'chat_image';
		fileName: string;
		mimeType: string;
		fileSize: number;
		fileBuffer?: ArrayBuffer | Uint8Array;
		note?: string;
	}
): Promise<EnrichedAttachment> {
	const meta = uploadEvidenceMetadataSchema.parse({
		order_id: params.orderId,
		attachment_type: params.attachmentType,
		note: params.note
	});

	const validation = validateEvidenceFile(params.mimeType, params.fileSize);
	if (!validation.valid) {
		throw new Error(validation.error || 'File tidak valid.');
	}

	const sanitizedName = params.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
	const storagePath = `${meta.order_id}/${Date.now()}-${sanitizedName}`;
	const now = new Date().toISOString();

	let savedUrl: string | null = null;

	if (supabase && params.fileBuffer) {
		try {
			const { error: uploadErr } = await supabase.storage
				.from('order-evidence')
				.upload(storagePath, params.fileBuffer, {
					contentType: params.mimeType,
					upsert: false
				});

			if (!uploadErr) {
				const { data: signedData } = await supabase.storage
					.from('order-evidence')
					.createSignedUrl(storagePath, 3600);
				savedUrl = signedData?.signedUrl || null;
			}
		} catch (err) {
			console.warn('[Communication] Storage upload fallback:', err);
		}
	}

	const record: OrderAttachment = {
		id: crypto.randomUUID(),
		order_id: meta.order_id,
		uploader_id: params.uploaderId,
		attachment_type: meta.attachment_type,
		file_path: storagePath,
		file_name: params.fileName,
		mime_type: params.mimeType,
		file_size: params.fileSize,
		note: meta.note || null,
		created_at: now
	};

	if (supabase) {
		try {
			const { data, error } = await supabase
				.from('order_attachments')
				.insert(record)
				.select()
				.single();

			if (!error && data) {
				const enriched: EnrichedAttachment = { ...data, signedUrl: savedUrl };
				const existing = fallbackAttachmentsCache.get(meta.order_id) || [];
				fallbackAttachmentsCache.set(meta.order_id, [enriched, ...existing]);
				return enriched;
			}
		} catch (err) {
			console.warn('[Communication] DB attachment insert fallback:', err);
		}
	}

	const enriched: EnrichedAttachment = { ...record, signedUrl: savedUrl };
	const existing = fallbackAttachmentsCache.get(meta.order_id) || [];
	fallbackAttachmentsCache.set(meta.order_id, [enriched, ...existing]);
	return enriched;
}

/**
 * Fetch order attachments with short-lived signed URLs
 */
export async function getOrderAttachments(
	supabase: SupabaseClient<Database> | null,
	orderId: string
): Promise<EnrichedAttachment[]> {
	if (supabase) {
		try {
			const { data, error } = await supabase
				.from('order_attachments')
				.select('*')
				.eq('order_id', orderId)
				.order('created_at', { ascending: false });

			if (!error && data) {
				const enriched = await Promise.all(
					data.map(async (att) => {
						try {
							const { data: signed } = await supabase.storage
								.from('order-evidence')
								.createSignedUrl(att.file_path, 3600);
							return { ...att, signedUrl: signed?.signedUrl || null };
						} catch {
							return { ...att, signedUrl: null };
						}
					})
				);
				fallbackAttachmentsCache.set(orderId, enriched);
				return enriched;
			}
		} catch (err) {
			console.warn('[Communication] DB attachments fetch fallback:', err);
		}
	}

	return fallbackAttachmentsCache.get(orderId) || [];
}

/**
 * Create a notification for a user
 */
export async function createNotification(
	supabase: SupabaseClient<Database> | null,
	params: {
		userId: string;
		orderId?: string | null;
		title: string;
		body: string;
		type?: 'order_update' | 'chat_message' | 'evidence_uploaded' | 'system';
	}
): Promise<Notification> {
	const now = new Date().toISOString();
	const notif: Notification = {
		id: crypto.randomUUID(),
		user_id: params.userId,
		order_id: params.orderId || null,
		title: params.title,
		body: params.body,
		type: params.type || 'order_update',
		is_read: false,
		created_at: now
	};

	if (supabase) {
		try {
			const { data, error } = await supabase.from('notifications').insert(notif).select().single();

			if (!error && data) {
				const existing = fallbackNotificationsCache.get(params.userId) || [];
				fallbackNotificationsCache.set(params.userId, [data, ...existing]);
				return data;
			}
		} catch (err) {
			console.warn('[Communication] DB notification insert fallback:', err);
		}
	}

	const existing = fallbackNotificationsCache.get(params.userId) || [];
	fallbackNotificationsCache.set(params.userId, [notif, ...existing]);
	return notif;
}

/**
 * Fetch user notifications
 */
export async function getUserNotifications(
	supabase: SupabaseClient<Database> | null,
	userId: string
): Promise<Notification[]> {
	if (supabase) {
		try {
			const { data, error } = await supabase
				.from('notifications')
				.select('*')
				.eq('user_id', userId)
				.order('created_at', { ascending: false })
				.limit(30);

			if (!error && data) {
				fallbackNotificationsCache.set(userId, data);
				return data;
			}
		} catch (err) {
			console.warn('[Communication] DB notifications fetch fallback:', err);
		}
	}

	return fallbackNotificationsCache.get(userId) || [];
}

/**
 * Count unread notifications for a user
 */
export async function getUnreadNotificationCount(
	supabase: SupabaseClient<Database> | null,
	userId: string
): Promise<number> {
	const list = await getUserNotifications(supabase, userId);
	return list.filter((n) => !n.is_read).length;
}

/**
 * Mark single notification as read (with ownership check)
 */
export async function markNotificationRead(
	supabase: SupabaseClient<Database> | null,
	userId: string,
	notificationId: string
): Promise<void> {
	if (supabase) {
		try {
			await supabase
				.from('notifications')
				.update({ is_read: true })
				.eq('id', notificationId)
				.eq('user_id', userId);
		} catch (err) {
			console.warn('[Communication] DB markNotificationRead fallback:', err);
		}
	}

	const list = fallbackNotificationsCache.get(userId) || [];
	fallbackNotificationsCache.set(
		userId,
		list.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
	);
}

/**
 * Mark all notifications for a user as read
 */
export async function markAllNotificationsRead(
	supabase: SupabaseClient<Database> | null,
	userId: string
): Promise<void> {
	if (supabase) {
		try {
			await supabase
				.from('notifications')
				.update({ is_read: true })
				.eq('user_id', userId)
				.eq('is_read', false);
		} catch (err) {
			console.warn('[Communication] DB markAllNotificationsRead fallback:', err);
		}
	}

	const list = fallbackNotificationsCache.get(userId) || [];
	fallbackNotificationsCache.set(
		userId,
		list.map((n) => ({ ...n, is_read: true }))
	);
}
