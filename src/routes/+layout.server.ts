import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '#lib/config.js';
import { getUnreadNotificationCount } from '#lib/server/communication.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const unreadNotificationCount = locals.user
		? await getUnreadNotificationCount(locals.supabase, locals.user.id)
		: 0;

	return {
		session: locals.session,
		user: locals.user,
		profile: locals.profile,
		role: locals.role,
		unreadNotificationCount,
		supabaseUrl: PUBLIC_SUPABASE_URL,
		supabaseAnonKey: PUBLIC_SUPABASE_ANON_KEY
	};
};
