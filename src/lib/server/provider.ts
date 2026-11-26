import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, ProviderProfile, ProviderService, ServiceCategory } from '#lib/types/database.types.js';

// Fallback in-memory cache to guarantee zero downtime if migration is not yet applied
const fallbackServicesCache = new Map<string, ProviderService[]>();

export interface EnrichedProviderService extends ProviderService {
	category?: ServiceCategory | null;
	provider?: (ProviderProfile & { phone?: string | null }) | null;
}

// Initial realistic default services for local Gatak discovery testing
export const localGatakDiscoverySeeds: EnrichedProviderService[] = [
	{
		id: 'seed-1',
		provider_id: 'provider-gatak-1',
		category_id: 'seed-cat-1',
		title: 'Jastip Soto Bebek & Kuliner Gawok',
		description: 'Bisa titip Soto Bebek Gawok, Tengkleng, atau kuliner malam area Gawok & Pasar. Siap bungkus dan antar hangat.',
		base_fee: 8000,
		coverage_area: 'Gatak, Gawok & Blimbing, Mayang',
		is_active: true,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		category: {
			id: 'seed-cat-1',
			name: 'Kuliner & Warung Hits',
			slug: 'food-beverage',
			description: 'Jastip kuliner lokal dan makanan enak',
			icon: 'utensils',
			is_active: true,
			sort_order: 1,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		},
		provider: {
			id: 'provider-gatak-1',
			user_id: 'user-gatak-1',
			business_name: 'Jastip Kilat Mas Agus',
			bio: 'Warga asli Gawok, paham seluk-beluk warung makan enak dan langganan warga.',
			coverage_area: 'Gatak, Gawok, Trangsan, Mayang',
			is_active: true,
			is_verified: true,
			rating_avg: 4.9,
			rating_count: 28,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			phone: '081234567890'
		}
	},
	{
		id: 'seed-2',
		provider_id: 'provider-gatak-2',
		category_id: 'seed-cat-2',
		title: 'Belanja Sayur Subuh Pasar Gawok',
		description: 'Jastip belanja sayur mayur segar, bumbu pawon, ayam potong, dan kebutuhan dapur langsung dari pasar subuh.',
		base_fee: 10000,
		coverage_area: 'Gatak, Gawok & Blimbing, Trangsan & Luwang',
		is_active: true,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		category: {
			id: 'seed-cat-2',
			name: 'Pasar Pagi & Sayur Segar',
			slug: 'traditional-market',
			description: 'Belanja pasar tradisional segar',
			icon: 'carrot',
			is_active: true,
			sort_order: 2,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		},
		provider: {
			id: 'provider-gatak-2',
			user_id: 'user-gatak-2',
			business_name: 'Mbak Sri Pasar Segar',
			bio: 'Belanja teliti dan pilih sayur daging kualitas terbaik langsung dari pedagang langganan.',
			coverage_area: 'Gatak, Gawok, Luwang, Trangsan',
			is_active: true,
			is_verified: true,
			rating_avg: 5.0,
			rating_count: 34,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			phone: '081398765432'
		}
	},
	{
		id: 'seed-3',
		provider_id: 'provider-gatak-3',
		category_id: 'seed-cat-3',
		title: 'Titip Beli Obat Apotek & Resep',
		description: 'Layanan cepat jastip obat bebas, vitamin, atau tebus obat apotek darurat area Gatak dan Kartasura.',
		base_fee: 7000,
		coverage_area: 'Gatak (Pusat), Kartasura & UMS, Baki',
		is_active: true,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		category: {
			id: 'seed-cat-3',
			name: 'Apotek & Kebutuhan Medis',
			slug: 'pharmacy',
			description: 'Apotek dan obat-obatan darurat',
			icon: 'pill',
			is_active: true,
			sort_order: 3,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		},
		provider: {
			id: 'provider-gatak-3',
			user_id: 'user-gatak-3',
			business_name: 'Kurir Medis Gatak',
			bio: 'Prioritas cepat tanggap untuk kebutuhan vitamin dan obat darurat 24 jam.',
			coverage_area: 'Gatak, Kartasura, Baki',
			is_active: true,
			is_verified: true,
			rating_avg: 4.8,
			rating_count: 19,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			phone: '085712349999'
		}
	},
	{
		id: 'seed-4',
		provider_id: 'provider-gatak-4',
		category_id: 'seed-cat-4',
		title: 'Antar Jemput Berkas & Barang Kampus UMS',
		description: 'Pengantaran dokumen kantor, tugas kuliah, kunci tertinggal, atau paket rute Gatak - Pabelan / Kampus UMS.',
		base_fee: 9000,
		coverage_area: 'Gatak (Pusat), Kartasura & UMS, Mayang & Sanggung',
		is_active: true,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		category: {
			id: 'seed-cat-4',
			name: 'Ambil & Antar Dokumen',
			slug: 'pickup-delivery',
			description: 'Pengantaran dokumen dan barang lokal',
			icon: 'truck',
			is_active: true,
			sort_order: 4,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		},
		provider: {
			id: 'provider-gatak-4',
			user_id: 'user-gatak-4',
			business_name: 'Express Mahasiswa Gatak-UMS',
			bio: 'Rute harian Gatak - Kartasura - Kampus UMS Pabelan. Cepat dan aman.',
			coverage_area: 'Gatak, Mayang, Kartasura, UMS',
			is_active: true,
			is_verified: true,
			rating_avg: 4.9,
			rating_count: 42,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
			phone: '081901234567'
		}
	}
];

export async function getOrCreateProviderProfile(
	supabase: SupabaseClient<Database>,
	userId: string,
	fullName?: string | null
): Promise<ProviderProfile> {
	try {
		const { data: existing, error: fetchError } = await supabase
			.from('provider_profiles')
			.select('*')
			.eq('id', userId)
			.maybeSingle();

		if (!fetchError && existing) {
			return existing;
		}

		// Create default profile for the provider
		const newProfile: Database['public']['Tables']['provider_profiles']['Insert'] = {
			id: userId,
			user_id: userId,
			business_name: fullName ? `Jastip ${fullName.split(' ')[0]}` : 'Mitra Jastip Gatak',
			bio: 'Siap melayani jasa titip belanja & pengantaran cepat area Gatak dan sekitarnya.',
			coverage_area: 'Gatak, Gawok, Trangsan, Mayang, Kartasura',
			is_active: true,
			is_verified: true,
			rating_avg: 5.0,
			rating_count: 0
		};

		const { data: inserted, error: insertError } = await supabase
			.from('provider_profiles')
			.insert(newProfile)
			.select()
			.single();

		if (!insertError && inserted) {
			return inserted;
		}
	} catch (err) {
		console.warn('[Provider] Error fetching/creating provider profile:', err);
	}

	// Safe fallback return
	return {
		id: userId,
		user_id: userId,
		business_name: fullName ? `Jastip ${fullName.split(' ')[0]}` : 'Mitra Jastip Gatak',
		bio: 'Siap melayani jasa titip belanja & pengantaran lokal.',
		coverage_area: 'Gatak, Gawok, Trangsan, Mayang',
		is_active: true,
		is_verified: true,
		rating_avg: 5.0,
		rating_count: 0,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString()
	};
}

export async function getProviderServices(
	supabase: SupabaseClient<Database>,
	providerId: string
): Promise<ProviderService[]> {
	try {
		const { data, error } = await supabase
			.from('provider_services')
			.select('*')
			.eq('provider_id', providerId)
			.order('created_at', { ascending: false });

		if (!error && data) {
			fallbackServicesCache.set(providerId, data);
			return data;
		}
	} catch (err) {
		console.warn('[ProviderServices] Database query fallback:', err);
	}

	return fallbackServicesCache.get(providerId) || [];
}

export async function getCategoryActiveServices(
	supabase: SupabaseClient<Database>,
	categoryId: string
): Promise<EnrichedProviderService[]> {
	try {
		const { data, error } = await supabase
			.from('provider_services')
			.select('*')
			.eq('category_id', categoryId)
			.eq('is_active', true)
			.order('created_at', { ascending: false });

		if (!error && data && data.length > 0) {
			// Fetch provider profiles
			const providerIds = [...new Set(data.map((s) => s.provider_id))];
			const { data: providers } = await supabase
				.from('provider_profiles')
				.select('*')
				.in('id', providerIds);

			const providerMap = new Map((providers || []).map((p) => [p.id, p]));
			return data.map((s) => ({
				...s,
				provider: providerMap.get(s.provider_id) || null
			}));
		}
	} catch (err) {
		console.warn('[CategoryServices] Database query fallback:', err);
	}

	// Return relevant local seeds as fallback
	return localGatakDiscoverySeeds.filter((s) => s.category_id === categoryId);
}

export interface ServiceFilterOptions {
	query?: string;
	categorySlug?: string;
	area?: string;
	sortBy?: 'cheapest' | 'rating' | 'newest';
}

export async function searchServices(
	supabase: SupabaseClient<Database>,
	filters: ServiceFilterOptions = {}
): Promise<EnrichedProviderService[]> {
	let results: EnrichedProviderService[] = [];

	try {
		let query = supabase
			.from('provider_services')
			.select('*')
			.eq('is_active', true);

		if (filters.sortBy === 'cheapest') {
			query = query.order('base_fee', { ascending: true });
		} else {
			query = query.order('created_at', { ascending: false });
		}

		const { data: services, error: serviceError } = await query;

		if (!serviceError && services && services.length > 0) {
			const categoryIds = [...new Set(services.map((s) => s.category_id))];
			const providerIds = [...new Set(services.map((s) => s.provider_id))];

			const [{ data: categories }, { data: providers }, { data: profiles }] = await Promise.all([
				supabase.from('service_categories').select('*').in('id', categoryIds),
				supabase.from('provider_profiles').select('*').in('id', providerIds),
				supabase.from('profiles').select('id, phone').in('id', providerIds)
			]);

			const catMap = new Map((categories || []).map((c) => [c.id, c]));
			const phoneMap = new Map((profiles || []).map((p) => [p.id, p.phone]));
			const provMap = new Map(
				(providers || []).map((p) => [p.id, { ...p, phone: phoneMap.get(p.id) || null }])
			);

			results = services.map((s) => ({
				...s,
				category: catMap.get(s.category_id) || null,
				provider: provMap.get(s.provider_id) || null
			}));
		}
	} catch (err) {
		console.warn('[SearchServices] Supabase query fallback:', err);
	}

	// If no services in database yet, blend with realistic Gatak local seeds
	if (results.length === 0) {
		results = [...localGatakDiscoverySeeds];
	}

	// Client / Server In-Memory Filtering
	if (filters.query?.trim()) {
		const q = filters.query.toLowerCase().trim();
		results = results.filter(
			(s) =>
				s.title.toLowerCase().includes(q) ||
				s.description?.toLowerCase().includes(q) ||
				s.coverage_area.toLowerCase().includes(q) ||
				s.category?.name.toLowerCase().includes(q) ||
				s.provider?.business_name?.toLowerCase().includes(q)
		);
	}

	if (filters.categorySlug && filters.categorySlug !== 'all') {
		results = results.filter((s) => s.category?.slug === filters.categorySlug);
	}

	if (filters.area && filters.area !== 'all' && filters.area !== 'Semua Area') {
		const areaTerm = filters.area.toLowerCase().replace(/[\(\)&]/g, ' ');
		const tokens = areaTerm.split(/\s+/).filter((t) => t.length > 2);
		results = results.filter((s) =>
			tokens.some((token) => s.coverage_area.toLowerCase().includes(token))
		);
	}

	// Sorting
	if (filters.sortBy === 'cheapest') {
		results.sort((a, b) => Number(a.base_fee) - Number(b.base_fee));
	} else if (filters.sortBy === 'rating') {
		results.sort(
			(a, b) => Number(b.provider?.rating_avg || 5) - Number(a.provider?.rating_avg || 5)
		);
	}

	return results;
}

export async function getServiceDetail(
	supabase: SupabaseClient<Database>,
	serviceId: string
): Promise<EnrichedProviderService | null> {
	// First check database
	try {
		const { data: service, error } = await supabase
			.from('provider_services')
			.select('*')
			.eq('id', serviceId)
			.maybeSingle();

		if (!error && service) {
			const [{ data: category }, { data: provider }, { data: profile }] = await Promise.all([
				supabase.from('service_categories').select('*').eq('id', service.category_id).maybeSingle(),
				supabase.from('provider_profiles').select('*').eq('id', service.provider_id).maybeSingle(),
				supabase.from('profiles').select('phone').eq('id', service.provider_id).maybeSingle()
			]);

			return {
				...service,
				category: category || null,
				provider: provider ? { ...provider, phone: profile?.phone || null } : null
			};
		}
	} catch (err) {
		console.warn('[ServiceDetail] DB fetch fallback:', err);
	}

	// Fallback check against discovery seeds
	const seedMatch = localGatakDiscoverySeeds.find((s) => s.id === serviceId);
	return seedMatch || null;
}
