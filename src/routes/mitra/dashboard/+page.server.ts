import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	requireRole,
	providerServiceSchema,
	providerProfileUpdateSchema
} from '#lib/server/auth.js';
import { getOrCreateProviderProfile, getProviderServices } from '#lib/server/provider.js';
import { getProviderOrders, transitionOrderStatus } from '#lib/server/order.js';
import { getPaymentByOrderId } from '#lib/server/payment.js';
import type { OrderStatus } from '#lib/types/database.types.js';

export const load: PageServerLoad = async ({ locals }) => {
	const auth = requireRole(locals, ['provider', 'admin']);

	const providerProfile = await getOrCreateProviderProfile(
		locals.supabase,
		auth.user.id,
		auth.profile?.full_name
	);

	const { data: categories } = await locals.supabase
		.from('service_categories')
		.select('*')
		.eq('is_active', true)
		.order('sort_order', { ascending: true });

	const services = await getProviderServices(locals.supabase, auth.user.id);
	const rawOrders = await getProviderOrders(locals.supabase, auth.user.id);
	const orders = await Promise.all(
		rawOrders.map(async (ord) => {
			const payment = await getPaymentByOrderId(locals.supabase, ord.id);
			return {
				...ord,
				paymentStatus: payment?.status || 'unpaid',
				paymentMethod: payment?.method || null,
				paymentReference: payment?.payment_reference || null
			};
		})
	);

	const totalServices = services.length;
	const activeServices = services.filter((s) => s.is_active).length;
	const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
	const activeOrdersCount = orders.filter((o) =>
		['accepted', 'shopping', 'purchased', 'delivering'].includes(o.status)
	).length;
	const avgBaseFee =
		activeServices > 0
			? Math.round(
					services.filter((s) => s.is_active).reduce((acc, s) => acc + Number(s.base_fee), 0) /
						activeServices
				)
			: 8000;

	return {
		user: auth.user,
		profile: auth.profile,
		role: auth.role,
		providerProfile,
		categories: categories || [],
		services,
		orders,
		stats: {
			totalServices,
			activeServices,
			avgBaseFee,
			pendingOrdersCount,
			activeOrdersCount
		}
	};
};

export const actions: Actions = {
	saveService: async ({ request, locals }) => {
		const auth = requireRole(locals, ['provider', 'admin']);
		const formData = await request.formData();

		const rawId = formData.get('id');
		const id = typeof rawId === 'string' && rawId.length > 0 ? rawId : undefined;
		const category_id = formData.get('category_id');
		const title = formData.get('title');
		const description = formData.get('description') || '';
		const base_fee = formData.get('base_fee');
		const coverage_area = formData.get('coverage_area') || 'Gatak dan sekitarnya';
		const is_active = formData.get('is_active') === 'on' || formData.get('is_active') === 'true';

		const parsed = providerServiceSchema.safeParse({
			id,
			category_id,
			title,
			description,
			base_fee,
			coverage_area,
			is_active
		});

		if (!parsed.success) {
			const errorMsg =
				Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] || 'Data layanan tidak valid';
			return fail(400, { serviceError: errorMsg });
		}

		try {
			if (parsed.data.id) {
				const { error: updateError } = await locals.supabase
					.from('provider_services')
					.update({
						category_id: parsed.data.category_id,
						title: parsed.data.title,
						description: parsed.data.description || null,
						base_fee: parsed.data.base_fee,
						coverage_area: parsed.data.coverage_area,
						is_active: parsed.data.is_active,
						updated_at: new Date().toISOString()
					})
					.eq('id', parsed.data.id)
					.eq('provider_id', auth.user.id);

				if (updateError) {
					return fail(500, { serviceError: updateError.message });
				}
				return { serviceSuccess: 'Layanan jastip berhasil diperbarui.' };
			} else {
				const { error: insertError } = await locals.supabase.from('provider_services').insert({
					provider_id: auth.user.id,
					category_id: parsed.data.category_id,
					title: parsed.data.title,
					description: parsed.data.description || null,
					base_fee: parsed.data.base_fee,
					coverage_area: parsed.data.coverage_area,
					is_active: parsed.data.is_active
				});

				if (insertError) {
					return fail(500, { serviceError: insertError.message });
				}
				return { serviceSuccess: 'Layanan jastip baru berhasil ditambahkan.' };
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			return fail(500, { serviceError: `Gagal menyimpan layanan: ${msg}` });
		}
	},

	toggleServiceActive: async ({ request, locals }) => {
		const auth = requireRole(locals, ['provider', 'admin']);
		const formData = await request.formData();
		const id = formData.get('id');

		if (typeof id !== 'string' || !id) {
			return fail(400, { serviceError: 'ID layanan tidak valid.' });
		}

		try {
			const { data: current } = await locals.supabase
				.from('provider_services')
				.select('is_active')
				.eq('id', id)
				.eq('provider_id', auth.user.id)
				.single();

			if (!current) {
				return fail(404, { serviceError: 'Layanan tidak ditemukan.' });
			}

			const { error: toggleError } = await locals.supabase
				.from('provider_services')
				.update({ is_active: !current.is_active, updated_at: new Date().toISOString() })
				.eq('id', id)
				.eq('provider_id', auth.user.id);

			if (toggleError) {
				return fail(500, { serviceError: toggleError.message });
			}

			return { serviceSuccess: 'Status layanan berhasil diubah.' };
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			return fail(500, { serviceError: `Gagal mengubah status: ${msg}` });
		}
	},

	deleteService: async ({ request, locals }) => {
		const auth = requireRole(locals, ['provider', 'admin']);
		const formData = await request.formData();
		const id = formData.get('id');

		if (typeof id !== 'string' || !id) {
			return fail(400, { serviceError: 'ID layanan tidak valid.' });
		}

		try {
			const { error: deleteError } = await locals.supabase
				.from('provider_services')
				.delete()
				.eq('id', id)
				.eq('provider_id', auth.user.id);

			if (deleteError) {
				return fail(500, { serviceError: deleteError.message });
			}

			return { serviceSuccess: 'Layanan berhasil dihapus.' };
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			return fail(500, { serviceError: `Gagal menghapus: ${msg}` });
		}
	},

	toggleAvailability: async ({ request, locals }) => {
		const auth = requireRole(locals, ['provider', 'admin']);
		const formData = await request.formData();
		const currentStatus = formData.get('current_status') === 'true';

		try {
			const { error: updateError } = await locals.supabase
				.from('provider_profiles')
				.update({
					is_active: !currentStatus,
					updated_at: new Date().toISOString()
				})
				.eq('id', auth.user.id);

			if (updateError) {
				return fail(500, { providerError: updateError.message });
			}

			return {
				providerSuccess: !currentStatus
					? 'Status Mitra Aktif: Anda siap menerima pesanan jastip.'
					: 'Status Mitra Nonaktif: Pesanan jastip ditutup sementara.'
			};
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			return fail(500, { providerError: `Gagal memperbarui status: ${msg}` });
		}
	},

	updateProfile: async ({ request, locals }) => {
		const auth = requireRole(locals, ['provider', 'admin']);
		const formData = await request.formData();

		const business_name = formData.get('business_name');
		const bio = formData.get('bio') || '';
		const coverage_area = formData.get('coverage_area') || 'Gatak dan sekitarnya';

		const parsed = providerProfileUpdateSchema.safeParse({
			business_name,
			bio,
			coverage_area
		});

		if (!parsed.success) {
			const errorMsg =
				Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] || 'Data profil tidak valid';
			return fail(400, { providerError: errorMsg });
		}

		try {
			const { error: updateError } = await locals.supabase
				.from('provider_profiles')
				.update({
					business_name: parsed.data.business_name,
					bio: parsed.data.bio || null,
					coverage_area: parsed.data.coverage_area,
					updated_at: new Date().toISOString()
				})
				.eq('id', auth.user.id);

			if (updateError) {
				return fail(500, { providerError: updateError.message });
			}

			return { providerSuccess: 'Profil mitra berhasil disimpan.' };
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			return fail(500, { providerError: `Gagal menyimpan profil: ${msg}` });
		}
	},

	updateOrderStatus: async ({ request, locals }) => {
		const auth = requireRole(locals, ['provider', 'admin']);
		const formData = await request.formData();
		const rawOrderId = formData.get('order_id');
		const rawToStatus = formData.get('to_status');
		const rawNote = formData.get('note');
		const rawActualCost = formData.get('actual_item_cost');

		const orderId = typeof rawOrderId === 'string' ? rawOrderId : '';
		const toStatus = (typeof rawToStatus === 'string' ? rawToStatus : '') as OrderStatus;
		const note = typeof rawNote === 'string' && rawNote ? rawNote : undefined;
		const actualItemCost =
			typeof rawActualCost === 'string' && rawActualCost ? Number(rawActualCost) : undefined;

		if (!orderId || !toStatus) {
			return fail(400, { orderError: 'ID pesanan dan status tujuan harus diisi.' });
		}

		try {
			await transitionOrderStatus(locals.supabase, auth.user.id, auth.role, {
				order_id: orderId,
				to_status: toStatus,
				note,
				actual_item_cost: actualItemCost
			});
			return { orderSuccess: `Status pesanan berhasil diubah menjadi ${toStatus}.` };
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Gagal memperbarui status pesanan.';
			return fail(400, { orderError: msg });
		}
	}
};
