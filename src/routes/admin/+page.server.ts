import type { Actions, PageServerLoad } from './$types';
import { requireRole, categorySchema } from '#lib/server/auth.js';
import { fail } from '@sveltejs/kit';
import type { ServiceCategory } from '#lib/types/database.types.js';

export const load: PageServerLoad = async ({ locals }) => {
	// Server-side strict authorization: only admin
	const auth = requireRole(locals, ['admin']);

	const { data: categories } = await locals.supabase
		.from('service_categories')
		.select('*')
		.order('sort_order', { ascending: true });

	const fallbackCategories: ServiceCategory[] = [
		{
			id: '1',
			name: 'Kuliner & Makanan',
			slug: 'food-beverage',
			description: 'Makanan siap saji, kafe, jajanan khas',
			icon: 'utensils',
			is_active: true,
			sort_order: 1,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		},
		{
			id: '2',
			name: 'Minimarket & Mart',
			slug: 'grocery-mart',
			description: 'Kebutuhan harian, snack, minuman',
			icon: 'store',
			is_active: true,
			sort_order: 2,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		},
		{
			id: '3',
			name: 'Pasar Tradisional',
			slug: 'traditional-market',
			description: 'Sayur, buah, daging, bumbu dapur',
			icon: 'carrot',
			is_active: true,
			sort_order: 3,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		},
		{
			id: '4',
			name: 'Apotek & Obat',
			slug: 'pharmacy',
			description: 'Obat bebas, vitamin, suplemen',
			icon: 'pill',
			is_active: true,
			sort_order: 4,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		},
		{
			id: '5',
			name: 'Ambil & Antar Dokumen/Barang',
			slug: 'pickup-delivery',
			description: 'Kunci, berkas kerja, paket mendesak',
			icon: 'truck',
			is_active: true,
			sort_order: 5,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		},
		{
			id: '6',
			name: 'Titip Kustom & Antrean',
			slug: 'custom-request',
			description: 'Florist, antrean tiket, permintaan spesifik',
			icon: 'sparkles',
			is_active: true,
			sort_order: 6,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		}
	];

	return {
		user: auth.user,
		profile: auth.profile,
		role: auth.role,
		categories: categories && categories.length > 0 ? categories : fallbackCategories
	};
};

export const actions: Actions = {
	saveCategory: async ({ request, locals }) => {
		requireRole(locals, ['admin']);

		const formData = await request.formData();
		const id = formData.get('id') as string | null;
		const name = formData.get('name') as string;
		const slug = formData.get('slug') as string;
		const description = formData.get('description') as string;
		const icon = (formData.get('icon') as string) || 'shopping-bag';
		const sort_order = Number(formData.get('sort_order') || 0);
		const is_active = formData.get('is_active') === 'on' || formData.get('is_active') === 'true';

		const parseResult = categorySchema.safeParse({
			id: id || undefined,
			name,
			slug,
			description,
			icon,
			sort_order,
			is_active
		});

		if (!parseResult.success) {
			const firstError = parseResult.error.issues[0]?.message || 'Input kategori tidak valid';
			return fail(400, { error: firstError });
		}

		const dataToSave = parseResult.data;

		if (dataToSave.id) {
			const { error: updateError } = await locals.supabase
				.from('service_categories')
				.update({
					name: dataToSave.name,
					slug: dataToSave.slug,
					description: dataToSave.description,
					icon: dataToSave.icon,
					sort_order: dataToSave.sort_order,
					is_active: dataToSave.is_active,
					updated_at: new Date().toISOString()
				})
				.eq('id', dataToSave.id);

			if (updateError) {
				return fail(500, { error: `Gagal memperbarui kategori: ${updateError.message}` });
			}
			return { success: true, message: 'Kategori berhasil diperbarui' };
		} else {
			const { error: insertError } = await locals.supabase.from('service_categories').insert({
				name: dataToSave.name,
				slug: dataToSave.slug,
				description: dataToSave.description,
				icon: dataToSave.icon,
				sort_order: dataToSave.sort_order,
				is_active: dataToSave.is_active
			});

			if (insertError) {
				return fail(500, { error: `Gagal menambahkan kategori: ${insertError.message}` });
			}
			return { success: true, message: 'Kategori berhasil ditambahkan' };
		}
	},

	toggleCategoryActive: async ({ request, locals }) => {
		requireRole(locals, ['admin']);

		const formData = await request.formData();
		const id = formData.get('id') as string;
		const currentStatus = formData.get('current_status') === 'true';

		if (!id) {
			return fail(400, { error: 'ID Kategori tidak valid' });
		}

		const { error: updateError } = await locals.supabase
			.from('service_categories')
			.update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
			.eq('id', id);

		if (updateError) {
			return fail(500, { error: `Gagal mengubah status kategori: ${updateError.message}` });
		}

		return { success: true, message: 'Status kategori berhasil diperbarui' };
	},

	deleteCategory: async ({ request, locals }) => {
		requireRole(locals, ['admin']);

		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, { error: 'ID Kategori tidak valid' });
		}

		const { error: deleteError } = await locals.supabase
			.from('service_categories')
			.delete()
			.eq('id', id);

		if (deleteError) {
			return fail(500, { error: `Gagal menghapus kategori: ${deleteError.message}` });
		}

		return { success: true, message: 'Kategori berhasil dihapus' };
	}
};
