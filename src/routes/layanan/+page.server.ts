import type { PageServerLoad } from './$types';
import { searchServices } from '#lib/server/provider.js';

export const load: PageServerLoad = async ({ url, locals }) => {
	const q = url.searchParams.get('q') || '';
	const kategori = url.searchParams.get('kategori') || 'all';
	const area = url.searchParams.get('area') || 'all';
	const sort = (url.searchParams.get('sort') || 'newest') as 'cheapest' | 'rating' | 'newest';

	const [{ data: categories }, services] = await Promise.all([
		locals.supabase
			.from('service_categories')
			.select('*')
			.eq('is_active', true)
			.order('sort_order', { ascending: true }),
		searchServices(locals.supabase, {
			query: q,
			categorySlug: kategori,
			area,
			sortBy: sort
		})
	]);

	return {
		categories: categories || [],
		services,
		filters: {
			q,
			kategori,
			area,
			sort
		}
	};
};
