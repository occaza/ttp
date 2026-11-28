import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPublishedContentBySlug } from '#lib/server/cms.js';

export const load: PageServerLoad = async ({ locals, params }) => {
	const post = await getPublishedContentBySlug(locals.supabase, 'post', params.slug);
	if (!post) {
		throw error(404, 'Artikel tidak ditemukan.');
	}
	return { post };
};
