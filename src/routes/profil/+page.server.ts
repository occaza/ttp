import type { PageServerLoad } from './$types';
import { requireAuth } from '#lib/server/auth.js';

export const load: PageServerLoad = ({ locals }) => {
	const auth = requireAuth(locals);

	return {
		user: auth.user,
		profile: auth.profile,
		role: auth.role
	};
};
