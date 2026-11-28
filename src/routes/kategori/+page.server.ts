import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [{ data: categories, error }, { data: services }] = await Promise.all([
		locals.supabase
			.from('service_categories')
			.select('*')
			.eq('is_active', true)
			.order('sort_order', { ascending: true }),
		locals.supabase
			.from('provider_services')
			.select('id, category_id, title, base_fee, coverage_area')
			.eq('is_active', true)
			.order('created_at', { ascending: false })
	]);

	const servicesByCategory: Record<
		string,
		Array<{ id: string; title: string; base_fee: number; coverage_area: string }>
	> = {};

	for (const svc of services || []) {
		if (!servicesByCategory[svc.category_id]) {
			servicesByCategory[svc.category_id] = [];
		}
		servicesByCategory[svc.category_id].push({
			id: svc.id,
			title: svc.title,
			base_fee: svc.base_fee,
			coverage_area: svc.coverage_area
		});
	}

	return {
		categories: !error && categories ? categories : [],
		servicesByCategory,
		totalActiveServices: services?.length ?? 0
	};
};
