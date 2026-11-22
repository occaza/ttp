import { createClient } from '@supabase/supabase-js';
import { env as publicEnv } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import type { Database } from '#lib/types/database.types.js';

export function createAdminClient() {
	const url = publicEnv.PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
	const serviceRoleKey = privateEnv.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';

	return createClient<Database>(url, serviceRoleKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false
		}
	});
}
