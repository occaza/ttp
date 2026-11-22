import type { PageServerLoad } from './$types';
import { requireRole } from '#lib/server/auth.js';

export const load: PageServerLoad = ({ locals }) => {
	// Server-side strict authorization: only admin
	const auth = requireRole(locals, ['admin']);

	return {
		user: auth.user,
		profile: auth.profile,
		role: auth.role
	};
};
