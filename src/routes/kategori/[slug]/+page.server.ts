import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getCategoryActiveServices } from '#lib/server/provider.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { slug } = params;

	const { data: category } = await locals.supabase
		.from('service_categories')
		.select('*')
		.eq('slug', slug)
		.maybeSingle();

	if (!category) {
		throw error(404, {
			message: `Kategori "${slug}" tidak ditemukan dalam layanan Titipin.`
		});
	}

	const providerServices = await getCategoryActiveServices(locals.supabase, category.id);

	return {
		category,
		providerServices
	};
};
