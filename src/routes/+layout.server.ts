import { env } from '$env/dynamic/public';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => {
	return {
		session: locals.session,
		user: locals.user,
		profile: locals.profile,
		role: locals.role,
		supabaseUrl: env.PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
		supabaseAnonKey: env.PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
	};
};
