import type { Actions, PageServerLoad } from './$types';
import { requireAuth } from '#lib/server/auth.js';
import {
	getUserNotifications,
	markNotificationRead,
	markAllNotificationsRead
} from '#lib/server/communication.js';

export const load: PageServerLoad = async ({ locals }) => {
	const auth = requireAuth(locals);
	const notifications = await getUserNotifications(locals.supabase, auth.user.id);

	return {
		user: auth.user,
		notifications
	};
};

export const actions: Actions = {
	markRead: async ({ request, locals }) => {
		const auth = requireAuth(locals);
		const formData = await request.formData();
		const rawId = formData.get('id');
		const id = typeof rawId === 'string' ? rawId : '';

		if (id) {
			await markNotificationRead(locals.supabase, auth.user.id, id);
		}
		return { success: true };
	},

	markAllRead: async ({ locals }) => {
		const auth = requireAuth(locals);
		await markAllNotificationsRead(locals.supabase, auth.user.id);
		return { success: true };
	}
};
