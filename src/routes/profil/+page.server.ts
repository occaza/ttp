import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { requireAuth, profileUpdateSchema, addressSchema } from '#lib/server/auth.js';
import { getCustomerOrders } from '#lib/server/order.js';
import { getUserNotifications } from '#lib/server/communication.js';

export const load: PageServerLoad = async ({ locals }) => {
	const auth = requireAuth(locals);

	const [addressesResult, orders, notifications] = await Promise.all([
		locals.supabase
			.from('addresses')
			.select('*')
			.eq('user_id', auth.user.id)
			.order('is_primary', { ascending: false })
			.order('created_at', { ascending: false }),
		getCustomerOrders(locals.supabase, auth.user.id),
		getUserNotifications(locals.supabase, auth.user.id)
	]);

	const activeOrdersCount = orders.filter((o) =>
		['pending', 'accepted', 'shopping', 'purchased', 'delivering'].includes(o.status)
	).length;
	const completedOrdersCount = orders.filter((o) => o.status === 'completed').length;
	const unreadNotificationsCount = notifications.filter((n) => !n.is_read).length;

	return {
		user: auth.user,
		profile: auth.profile,
		role: auth.role,
		addresses: addressesResult.data || [],
		orders,
		recentNotifications: notifications.slice(0, 4),
		stats: {
			totalOrders: orders.length,
			activeOrdersCount,
			completedOrdersCount,
			unreadNotificationsCount
		}
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		const auth = requireAuth(locals);
		const formData = await request.formData();
		const full_name = formData.get('full_name');
		const phone = formData.get('phone');

		const parsed = profileUpdateSchema.safeParse({ full_name, phone });
		if (!parsed.success) {
			const errorMsg =
				Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] || 'Data profil tidak valid';
			return fail(400, { profileError: errorMsg });
		}

		const { error: updateError } = await locals.supabase
			.from('profiles')
			.update({
				full_name: parsed.data.full_name,
				phone: parsed.data.phone || null,
				updated_at: new Date().toISOString()
			})
			.eq('id', auth.user.id);

		if (updateError) {
			return fail(500, { profileError: updateError.message });
		}

		return { profileSuccess: 'Profil berhasil diperbarui.' };
	},

	saveAddress: async ({ request, locals }) => {
		const auth = requireAuth(locals);
		const formData = await request.formData();

		const rawId = formData.get('id');
		const id = typeof rawId === 'string' && rawId.length > 0 ? rawId : undefined;
		const label = formData.get('label');
		const recipient_name = formData.get('recipient_name');
		const rawPhone = formData.get('recipient_phone');
		const recipient_phone =
			typeof rawPhone === 'string' ? rawPhone.trim().replace(/[\s-]/g, '') : '';
		const street_address = formData.get('street_address');
		const notes = formData.get('notes') || '';
		const city = formData.get('city') || 'Gatak, Sukoharjo';
		const postal_code = formData.get('postal_code') || '';
		const is_primary = formData.get('is_primary') === 'on' || formData.get('is_primary') === 'true';

		const parsed = addressSchema.safeParse({
			id: id || undefined,
			label,
			recipient_name,
			recipient_phone,
			street_address,
			notes,
			city,
			postal_code,
			is_primary
		});

		if (!parsed.success) {
			const errorMsg =
				Object.values(parsed.error.flatten().fieldErrors)[0]?.[0] || 'Data alamat tidak valid';
			return fail(400, { addressError: errorMsg });
		}

		try {
			if (parsed.data.id) {
				// Update existing address
				const { error: updateError } = await locals.supabase
					.from('addresses')
					.update({
						label: parsed.data.label,
						recipient_name: parsed.data.recipient_name,
						recipient_phone: parsed.data.recipient_phone,
						street_address: parsed.data.street_address,
						notes: parsed.data.notes || null,
						city: parsed.data.city,
						postal_code: parsed.data.postal_code || null,
						is_primary: parsed.data.is_primary,
						updated_at: new Date().toISOString()
					})
					.eq('id', parsed.data.id)
					.eq('user_id', auth.user.id);

				if (updateError) {
					return fail(500, { addressError: updateError.message });
				}
				return { addressSuccess: 'Alamat berhasil diperbarui.' };
			} else {
				// Insert new address
				const { error: insertError } = await locals.supabase.from('addresses').insert({
					user_id: auth.user.id,
					label: parsed.data.label,
					recipient_name: parsed.data.recipient_name,
					recipient_phone: parsed.data.recipient_phone,
					street_address: parsed.data.street_address,
					notes: parsed.data.notes || null,
					city: parsed.data.city,
					postal_code: parsed.data.postal_code || null,
					is_primary: parsed.data.is_primary
				});

				if (insertError) {
					return fail(500, { addressError: insertError.message });
				}
				return { addressSuccess: 'Alamat baru berhasil ditambahkan.' };
			}
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			return fail(500, { addressError: `Gagal menyimpan: ${msg}` });
		}
	},

	setPrimaryAddress: async ({ request, locals }) => {
		const auth = requireAuth(locals);
		const formData = await request.formData();
		const rawId = formData.get('id');
		const addressId = typeof rawId === 'string' && rawId.length > 0 ? rawId : null;

		if (!addressId) {
			return fail(400, { addressError: 'ID alamat tidak ditemukan.' });
		}

		// First set target to true
		const { error: updateError } = await locals.supabase
			.from('addresses')
			.update({ is_primary: true, updated_at: new Date().toISOString() })
			.eq('id', addressId)
			.eq('user_id', auth.user.id);

		if (updateError) {
			return fail(500, { addressError: updateError.message });
		}

		// Unset others for this user
		await locals.supabase
			.from('addresses')
			.update({ is_primary: false })
			.eq('user_id', auth.user.id)
			.neq('id', addressId);

		return { addressSuccess: 'Alamat utama berhasil diubah.' };
	},

	deleteAddress: async ({ request, locals }) => {
		const auth = requireAuth(locals);
		const formData = await request.formData();
		const rawId = formData.get('id');
		const addressId = typeof rawId === 'string' && rawId.length > 0 ? rawId : null;

		if (!addressId) {
			return fail(400, { addressError: 'ID alamat tidak ditemukan.' });
		}

		const { error: deleteError } = await locals.supabase
			.from('addresses')
			.delete()
			.eq('id', addressId)
			.eq('user_id', auth.user.id);

		if (deleteError) {
			return fail(500, { addressError: deleteError.message });
		}

		return { addressSuccess: 'Alamat berhasil dihapus.' };
	}
};
