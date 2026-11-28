import type { SupabaseClient } from '@supabase/supabase-js';
import type {
	Database,
	ProviderProfile,
	ProviderService,
	ServiceCategory
} from '#lib/types/database.types.js';

// Fallback in-memory cache to guarantee zero downtime if migration is not yet applied
const fallbackServicesCache = new Map<string, ProviderService[]>();

export interface EnrichedProviderService extends ProviderService {
	category?: ServiceCategory | null;
	provider?: (ProviderProfile & { phone?: string | null }) | null;
}

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
			business_name: fullName ? `Titipin (${fullName.split(' ')[0]})` : 'Titipin Langsung',
			bio: 'Dijalankan dan dibelikan langsung oleh pengelola Titipin di Gatak.',
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
		business_name: fullName ? `Titipin (${fullName.split(' ')[0]})` : 'Titipin Langsung',
		bio: 'Dijalankan dan dibelikan langsung oleh pengelola Titipin di Gatak.',
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

	return [];
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
		let query = supabase.from('provider_services').select('*').eq('is_active', true);

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
		const areaTerm = filters.area.toLowerCase().replace(/[()&]/g, ' ');
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

	return null;
}
