import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAuth } from '#lib/server/auth.js';
import { getOrderDetails, transitionOrderStatus } from '#lib/server/order.js';
import {
	getOrderMessages,
	getOrderAttachments,
	sendOrderMessage,
	uploadOrderEvidence,
	createNotification
} from '#lib/server/communication.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const auth = requireAuth(locals);
	const { id } = params;

	const order = await getOrderDetails(locals.supabase, id);

	if (!order) {
		throw error(404, { message: `Pesanan dengan ID "${id}" tidak ditemukan.` });
	}

	// Boundary check
	const isCustomer = order.customer_id === auth.user.id;
	const isProvider = order.provider_id === auth.user.id;
	const isAdmin = auth.role === 'admin';

	if (!isCustomer && !isProvider && !isAdmin) {
		throw error(403, { message: 'Anda tidak memiliki hak akses untuk melihat pesanan ini.' });
	}

	const [messages, attachments] = await Promise.all([
		getOrderMessages(locals.supabase, id),
		getOrderAttachments(locals.supabase, id)
	]);

	return {
		user: auth.user,
		profile: auth.profile,
		role: auth.role,
		order,
		messages,
		attachments,
		isCustomer,
		isProvider,
		isAdmin
	};
};

export const actions: Actions = {
	cancelOrder: async ({ request, locals, params }) => {
		const auth = requireAuth(locals);
		const { id } = params;
		const formData = await request.formData();
		const rawReason = formData.get('cancellation_reason');
		const cancellationReason =
			typeof rawReason === 'string' && rawReason ? rawReason : 'Dibatalkan oleh pemesan.';

		try {
			await transitionOrderStatus(locals.supabase, auth.user.id, auth.role, {
				order_id: id,
				to_status: 'cancelled',
				cancellation_reason: cancellationReason,
				note: cancellationReason
			});
			return { cancelSuccess: 'Pesanan berhasil dibatalkan.' };
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Gagal membatalkan pesanan.';
			return fail(400, { error: msg });
		}
	},

	sendMessage: async ({ request, locals, params }) => {
		const auth = requireAuth(locals);
		const { id } = params;
		const order = await getOrderDetails(locals.supabase, id);

		if (!order) {
			return fail(404, { chatError: 'Pesanan tidak ditemukan.' });
		}

		const isParticipant =
			order.customer_id === auth.user.id ||
			order.provider_id === auth.user.id ||
			auth.role === 'admin';
		if (!isParticipant) {
			return fail(403, { chatError: 'Akses ditolak.' });
		}

		const formData = await request.formData();
		const rawMsg = formData.get('message');
		const messageText = typeof rawMsg === 'string' ? rawMsg : '';

		try {
			await sendOrderMessage(locals.supabase, {
				orderId: id,
				senderId: auth.user.id,
				senderRole: auth.role,
				message: messageText,
				isSystem: false
			});

			const notifyUserId =
				auth.user.id === order.customer_id ? order.provider_id : order.customer_id;
			await createNotification(locals.supabase, {
				userId: notifyUserId,
				orderId: id,
				title: `Pesan Baru (${order.order_number})`,
				body: messageText.slice(0, 100),
				type: 'chat_message'
			});

			return { chatSuccess: true };
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Gagal mengirim pesan.';
			return fail(400, { chatError: msg });
		}
	},

	uploadEvidence: async ({ request, locals, params }) => {
		const auth = requireAuth(locals);
		const { id } = params;
		const order = await getOrderDetails(locals.supabase, id);

		if (!order) {
			return fail(404, { evidenceError: 'Pesanan tidak ditemukan.' });
		}

		const isParticipant =
			order.customer_id === auth.user.id ||
			order.provider_id === auth.user.id ||
			auth.role === 'admin';
		if (!isParticipant) {
			return fail(403, { evidenceError: 'Akses ditolak.' });
		}

		const formData = await request.formData();
		const file = formData.get('file');
		const rawType = formData.get('attachment_type');
		const rawNote = formData.get('note');

		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { evidenceError: 'Pilih file gambar atau PDF terlebih dahulu.' });
		}

		const attachmentType =
			rawType === 'receipt' || rawType === 'delivery_proof' || rawType === 'chat_image'
				? rawType
				: 'receipt';
		const note = typeof rawNote === 'string' && rawNote.trim() ? rawNote.trim() : undefined;

		try {
			const buffer = await file.arrayBuffer();
			await uploadOrderEvidence(locals.supabase, {
				orderId: id,
				uploaderId: auth.user.id,
				attachmentType,
				fileName: file.name,
				mimeType: file.type || 'application/octet-stream',
				fileSize: file.size,
				fileBuffer: buffer,
				note
			});

			const typeLabel =
				attachmentType === 'receipt'
					? 'Foto Struk Kasir Asli'
					: attachmentType === 'delivery_proof'
						? 'Bukti Pengantaran'
						: 'Lampiran Gambar';

			await sendOrderMessage(locals.supabase, {
				orderId: id,
				senderId: null,
				senderRole: 'system',
				message: `${typeLabel} diunggah: ${file.name}${note ? ` (${note})` : ''}`,
				isSystem: true
			});

			const notifyUserId =
				auth.user.id === order.customer_id ? order.provider_id : order.customer_id;
			await createNotification(locals.supabase, {
				userId: notifyUserId,
				orderId: id,
				title: `${typeLabel} Diunggah`,
				body: `Pesanan ${order.order_number}: ${file.name}`,
				type: 'evidence_uploaded'
			});

			return { evidenceSuccess: `${typeLabel} berhasil diunggah.` };
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Gagal mengunggah bukti.';
			return fail(400, { evidenceError: msg });
		}
	}
};
