import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '#lib/config.js';
import type { Database } from '#lib/types/database.types.js';

export function createAdminClient() {
	const url = PUBLIC_SUPABASE_URL;
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';

	return createClient<Database>(url, serviceRoleKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false
		}
	});
}
