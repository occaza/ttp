import type { PageServerLoad } from './$types';
import { requireRole } from '#lib/server/auth.js';

export const load: PageServerLoad = async ({ locals }) => {
	// Server-side strict authorization: provider or admin
	const auth = requireRole(locals, ['provider', 'admin']);

	const { data: providerProfile } = await locals.supabase
		.from('provider_profiles')
		.select('*')
		.eq('user_id', auth.user.id)
		.maybeSingle();

	return {
		user: auth.user,
		profile: auth.profile,
		role: auth.role,
		providerProfile
	};
};
