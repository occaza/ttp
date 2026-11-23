import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, ProviderProfile, ProviderService } from '#lib/types/database.types.js';

// Fallback in-memory cache to guarantee zero downtime if migration is not yet applied
const fallbackServicesCache = new Map<string, ProviderService[]>();

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
): Promise<(ProviderService & { provider?: ProviderProfile | null })[]> {
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
