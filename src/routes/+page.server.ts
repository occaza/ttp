import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [{ data: categories }, { data: services }] = await Promise.all([
		locals.supabase
			.from('service_categories')
			.select('*')
			.eq('is_active', true)
			.order('sort_order', { ascending: true }),
		locals.supabase
			.from('provider_services')
			.select('category_id, title')
			.eq('is_active', true)
			.order('created_at', { ascending: false })
			.limit(30)
	]);

	const serviceExamplesByCategory: Record<string, string[]> = {};
	for (const svc of services || []) {
		if (!serviceExamplesByCategory[svc.category_id]) {
			serviceExamplesByCategory[svc.category_id] = [];
		}
		if (serviceExamplesByCategory[svc.category_id].length < 3) {
			serviceExamplesByCategory[svc.category_id].push(svc.title);
		}
	}

	return {
		categories: categories ?? [],
		serviceExamplesByCategory
	};
};
