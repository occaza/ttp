import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAuth } from '#lib/server/auth.js';
import { getOrderDetails, transitionOrderStatus } from '#lib/server/order.js';

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

	return {
		user: auth.user,
		profile: auth.profile,
		role: auth.role,
		order,
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
	}
};
