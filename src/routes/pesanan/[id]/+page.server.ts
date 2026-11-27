import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAuth } from '#lib/server/auth.js';
import { getOrderDetails, isUuid, transitionOrderStatus } from '#lib/server/order.js';
import {
	getOrderMessages,
	getOrderAttachments,
	sendOrderMessage,
	uploadOrderEvidence,
	createNotification
} from '#lib/server/communication.js';
import {
	getPaymentByOrderId,
	submitCustomerPayment,
	verifyPayment,
	rejectPayment,
	refundPayment
} from '#lib/server/payment.js';
import type { OrderStatus, PaymentMethod } from '#lib/types/database.types.js';

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

	// Canonicalize UUID URLs to the short order_number alias (e.g. /pesanan/TP-8K4M2P)
	if (isUuid(id) && order.order_number) {
		throw redirect(302, `/pesanan/${order.order_number}`);
	}

	const [messages, attachments, payment] = await Promise.all([
		getOrderMessages(locals.supabase, order.id),
		getOrderAttachments(locals.supabase, order.id),
		getPaymentByOrderId(locals.supabase, order.id)
	]);

	return {
		user: auth.user,
		profile: auth.profile,
		role: auth.role,
		order,
		messages,
		attachments,
		payment,
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
			const order = await getOrderDetails(locals.supabase, id);
			if (!order) {
				return fail(404, { error: 'Pesanan tidak ditemukan.' });
			}
			await transitionOrderStatus(locals.supabase, auth.user.id, auth.role, {
				order_id: order.id,
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
				orderId: order.id,
				senderId: auth.user.id,
				senderRole: auth.role,
				message: messageText,
				isSystem: false
			});

			const notifyUserId =
				auth.user.id === order.customer_id ? order.provider_id : order.customer_id;
			await createNotification(locals.supabase, {
				userId: notifyUserId,
				orderId: order.id,
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
				orderId: order.id,
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
				orderId: order.id,
				senderId: null,
				senderRole: 'system',
				message: `${typeLabel} diunggah: ${file.name}${note ? ` (${note})` : ''}`,
				isSystem: true
			});

			const notifyUserId =
				auth.user.id === order.customer_id ? order.provider_id : order.customer_id;
			await createNotification(locals.supabase, {
				userId: notifyUserId,
				orderId: order.id,
				title: `${typeLabel} Diunggah`,
				body: `Pesanan ${order.order_number}: ${file.name}`,
				type: 'evidence_uploaded'
			});

			return { evidenceSuccess: `${typeLabel} berhasil diunggah.` };
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Gagal mengunggah bukti.';
			return fail(400, { evidenceError: msg });
		}
	},

	submitPayment: async ({ request, locals, params }) => {
		const auth = requireAuth(locals);
		const { id } = params;
		const formData = await request.formData();

		const rawMethod = formData.get('method');
		const rawPayer = formData.get('payer_name');
		const rawExtRef = formData.get('external_reference');
		const rawNotes = formData.get('notes');
		const proofFile = formData.get('proof_file');

		const methodStr = typeof rawMethod === 'string' ? rawMethod : '';
		const method: PaymentMethod =
			methodStr === 'bank_transfer' || methodStr === 'qris_manual' ? methodStr : 'cash_on_delivery';
		const payerName = typeof rawPayer === 'string' && rawPayer.trim() ? rawPayer.trim() : undefined;
		const externalReference =
			typeof rawExtRef === 'string' && rawExtRef.trim() ? rawExtRef.trim() : undefined;
		const notes = typeof rawNotes === 'string' && rawNotes.trim() ? rawNotes.trim() : undefined;

		try {
			let fileName: string | undefined;
			let mimeType: string | undefined;
			let fileSize: number | undefined;
			let fileBuffer: ArrayBuffer | undefined;

			if (proofFile instanceof File && proofFile.size > 0) {
				fileName = proofFile.name;
				mimeType = proofFile.type || 'application/octet-stream';
				fileSize = proofFile.size;
				fileBuffer = await proofFile.arrayBuffer();
			}

			const result = await submitCustomerPayment(locals.supabase, auth.user.id, auth.role, {
				orderId: id,
				method,
				payerName,
				externalReference,
				notes,
				fileName,
				mimeType,
				fileSize,
				fileBuffer
			});

			return {
				paymentSuccess:
					result.status === 'awaiting_verification'
						? 'Bukti pembayaran berhasil dikirim dan sedang menunggu verifikasi resmi.'
						: 'Metode pembayaran berhasil disimpan.'
			};
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Gagal mengirim data pembayaran.';
			return fail(400, { paymentError: msg });
		}
	},

	verifyPayment: async ({ request, locals, params }) => {
		const auth = requireAuth(locals);
		const { id } = params;
		const formData = await request.formData();

		const rawAmount = formData.get('paid_amount');
		const rawExtRef = formData.get('external_reference');
		const rawNote = formData.get('note');

		const paidAmount = typeof rawAmount === 'string' && rawAmount ? Number(rawAmount) : NaN;
		if (!Number.isFinite(paidAmount) || paidAmount < 0) {
			return fail(400, { paymentError: 'Nominal pembayaran yang diverifikasi tidak valid.' });
		}

		const externalReference =
			typeof rawExtRef === 'string' && rawExtRef.trim() ? rawExtRef.trim() : undefined;
		const note = typeof rawNote === 'string' && rawNote.trim() ? rawNote.trim() : undefined;

		try {
			await verifyPayment(locals.supabase, auth.user.id, auth.role, {
				order_id: id,
				paid_amount: paidAmount,
				external_reference: externalReference,
				note
			});
			return { paymentSuccess: 'Pembayaran berhasil diverifikasi lunas.' };
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Gagal memverifikasi pembayaran.';
			return fail(403, { paymentError: msg });
		}
	},

	rejectPayment: async ({ request, locals, params }) => {
		const auth = requireAuth(locals);
		const { id } = params;
		const formData = await request.formData();

		const rawReason = formData.get('rejection_reason');
		const rejectionReason = typeof rawReason === 'string' ? rawReason.trim() : '';

		try {
			await rejectPayment(locals.supabase, auth.user.id, auth.role, {
				order_id: id,
				rejection_reason: rejectionReason
			});
			return { paymentSuccess: 'Bukti pembayaran ditolak dan pemesan telah diberitahu.' };
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Gagal menolak bukti pembayaran.';
			return fail(400, { paymentError: msg });
		}
	},

	refundPayment: async ({ request, locals, params }) => {
		const auth = requireAuth(locals);
		const { id } = params;
		const formData = await request.formData();

		const rawNote = formData.get('note');
		const note = typeof rawNote === 'string' ? rawNote.trim() : '';

		try {
			await refundPayment(locals.supabase, auth.user.id, auth.role, {
				order_id: id,
				note
			});
			return { paymentSuccess: 'Status pembayaran berhasil dicatat sebagai dana dikembalikan.' };
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Gagal mencatat pengembalian dana.';
			return fail(400, { paymentError: msg });
		}
	},

	updateOrderStatus: async ({ request, locals, params }) => {
		const auth = requireAuth(locals);
		if (auth.role !== 'admin' && auth.role !== 'provider') {
			return fail(403, { error: 'Hanya Admin atau Kurir yang dapat mengubah status pesanan.' });
		}

		const { id } = params;
		const order = await getOrderDetails(locals.supabase, id);
		if (!order) {
			return fail(404, { error: 'Pesanan tidak ditemukan.' });
		}

		const formData = await request.formData();
		const rawToStatus = formData.get('to_status');
		const rawActualCost = formData.get('actual_item_cost');
		const toStatus = (typeof rawToStatus === 'string' ? rawToStatus : '') as OrderStatus;
		const actualItemCost =
			typeof rawActualCost === 'string' && rawActualCost ? Number(rawActualCost) : undefined;

		if (!toStatus) {
			return fail(400, { error: 'Status tujuan wajib diisi.' });
		}

		try {
			await transitionOrderStatus(locals.supabase, auth.user.id, auth.role, {
				order_id: order.id,
				to_status: toStatus,
				actual_item_cost: actualItemCost
			});
			return { statusSuccess: 'Status pesanan berhasil diperbarui.' };
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Gagal memperbarui status pesanan.';
			return fail(400, { error: msg });
		}
	}
};
