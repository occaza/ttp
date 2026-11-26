import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getServiceDetail } from '#lib/server/provider.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { id } = params;

	const service = await getServiceDetail(locals.supabase, id);

	if (!service) {
		throw error(404, {
			message: `Layanan jastip dengan ID "${id}" tidak ditemukan.`
		});
	}

	return {
		service,
		user: locals.user
	};
};
