import type { PageServerLoad } from './$types';
import type { ServiceCategory } from '#lib/types/database.types.js';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: categories } = await locals.supabase
		.from('service_categories')
		.select('*')
		.eq('is_active', true)
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
			name: 'Mall & Belanja Khusus',
			slug: 'mall-shopping',
			description: 'Pakaian, buku, pernak-pernik, hadiah',
			icon: 'shopping-bag',
			is_active: true,
			sort_order: 5,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		},
		{
			id: '6',
			name: 'Titip Ambil / Antar Barang',
			slug: 'pickup-delivery',
			description: 'Dokumen penting, paket tertinggal, dll',
			icon: 'truck',
			is_active: true,
			sort_order: 6,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		}
	];

	return {
		categories: categories && categories.length > 0 ? categories : fallbackCategories
	};
};
