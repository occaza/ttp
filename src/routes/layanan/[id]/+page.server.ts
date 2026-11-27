import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getServiceDetail } from '#lib/server/provider.js';
import { getProviderRatingSummary } from '#lib/server/review_earnings.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const { id } = params;

	const service = await getServiceDetail(locals.supabase, id);

	if (!service) {
		throw error(404, {
			message: `Layanan jastip dengan ID "${id}" tidak ditemukan.`
		});
	}

	const ratingSummary = await getProviderRatingSummary(locals.supabase, service.provider_id);

	return {
		service,
		ratingSummary,
		user: locals.user
	};
};
