import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '#lib/config.js';
import { getUnreadNotificationCount } from '#lib/server/communication.js';
import { getActivePromoPopup, getPublishedContents } from '#lib/server/cms.js';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const [unreadNotificationCount, activePromo, publishedPages] = await Promise.all([
		locals.user ? getUnreadNotificationCount(locals.supabase, locals.user.id) : Promise.resolve(0),
		getActivePromoPopup(locals.supabase),
		getPublishedContents(locals.supabase, 'page')
	]);

	return {
		session: locals.session,
		user: locals.user,
		profile: locals.profile,
		role: locals.role,
		unreadNotificationCount,
		activePromo,
		publishedPages: publishedPages.slice(0, 6).map((p) => ({ title: p.title, slug: p.slug })),
		supabaseUrl: PUBLIC_SUPABASE_URL,
		supabaseAnonKey: PUBLIC_SUPABASE_ANON_KEY
	};
};
