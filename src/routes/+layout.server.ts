import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '#lib/config.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	return {
		session: locals.session,
		user: locals.user,
		profile: locals.profile,
		role: locals.role,
		supabaseUrl: PUBLIC_SUPABASE_URL,
		supabaseAnonKey: PUBLIC_SUPABASE_ANON_KEY
	};
};
