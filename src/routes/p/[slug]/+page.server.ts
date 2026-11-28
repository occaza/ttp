import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPublishedContentBySlug } from '#lib/server/cms.js';

export const load: PageServerLoad = async ({ locals, params }) => {
	const page = await getPublishedContentBySlug(locals.supabase, 'page', params.slug);
	if (!page) {
		throw error(404, 'Halaman tidak ditemukan.');
	}
	return { page };
};
