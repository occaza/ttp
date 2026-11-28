import type { PageServerLoad } from './$types';
import { getPublishedContents } from '#lib/server/cms.js';

export const load: PageServerLoad = async ({ locals }) => {
	const posts = await getPublishedContents(locals.supabase, 'post');
	return { posts };
};
