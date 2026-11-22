import { createBrowserClient, isBrowser } from '@supabase/ssr';
import type { LayoutLoad } from './$types';
import type { Database } from '#lib/types/database.types.js';

export const load: LayoutLoad = ({ data, depends }) => {
	depends('supabase:auth');

	const supabase = isBrowser()
		? createBrowserClient<Database>(data.supabaseUrl, data.supabaseAnonKey)
		: null;

	return {
		supabase,
		session: data.session,
		user: data.user,
		profile: data.profile,
		role: data.role
	};
};
