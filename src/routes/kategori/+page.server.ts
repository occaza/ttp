import type { PageServerLoad } from './$types';
import type { ServiceCategory } from '#lib/types/database.types.js';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: categories, error } = await locals.supabase
		.from('service_categories')
		.select('*')
		.eq('is_active', true)
		.order('sort_order', { ascending: true });

	// Safe fallback categories if table not yet populated
	const fallbackCategories: ServiceCategory[] = [
		{
			id: '1',
			name: 'Jastip Makanan & Minuman',
			slug: 'food-beverage',
			description: 'Titip beli kuliner resto, kafe, jajanan pasar, dan minuman favorit lokal.',
			icon: 'utensils',
			is_active: true,
			sort_order: 1,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		},
		{
			id: '2',
			name: 'Belanja Minimarket & Mart',
			slug: 'grocery-mart',
			description: 'Kebutuhan harian minimarket, bahan dapur cepat, dan stok kebutuhan rumah.',
			icon: 'store',
			is_active: true,
			sort_order: 2,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		},
		{
			id: '3',
			name: 'Pasar Tradisional Segar',
			slug: 'traditional-market',
			description: 'Sayuran, buah segar, daging, dan bumbu dapur dari pasar tradisional terdekat.',
			icon: 'carrot',
			is_active: true,
			sort_order: 3,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		},
		{
			id: '4',
			name: 'Apotek & Obat Resep',
			slug: 'pharmacy',
			description: 'Titip beli vitamin, suplemen, obat bebas, dan kebutuhan kesehatan darurat.',
			icon: 'pill',
			is_active: true,
			sort_order: 4,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		},
		{
			id: '5',
			name: 'Mall & Toko Khusus',
			slug: 'mall-shopping',
			description:
				'Belanja pakaian, buku, elektronik ringan, dan oleh-oleh dari pusat perbelanjaan.',
			icon: 'shopping-bag',
			is_active: true,
			sort_order: 5,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		},
		{
			id: '6',
			name: 'Titip Ambil & Antar Barang',
			slug: 'pickup-delivery',
			description: 'Jasa penjemputan dokumen penting, barang tertinggal, atau paket dalam kota.',
			icon: 'truck',
			is_active: true,
			sort_order: 6,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		}
	];

	return {
		categories: !error && categories && categories.length > 0 ? categories : fallbackCategories
	};
};
