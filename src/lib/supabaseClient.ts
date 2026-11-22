import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '#lib/types/database.types.js';

export function createClient(url = 'https://placeholder.supabase.co', key = 'placeholder-key') {
	return createBrowserClient<Database>(url, key);
}
