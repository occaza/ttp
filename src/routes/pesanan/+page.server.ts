import type { PageServerLoad } from './$types';
import { requireAuth } from '#lib/server/auth.js';
import { getCustomerOrders } from '#lib/server/order.js';

export const load: PageServerLoad = async ({ locals }) => {
	const auth = requireAuth(locals);
	const orders = await getCustomerOrders(locals.supabase, auth.user.id);

	return {
		user: auth.user,
		profile: auth.profile,
		orders
	};
};
