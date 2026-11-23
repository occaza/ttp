import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '#lib/types/database.types.js';

export interface PlatformSettings {
	allow_provider_registration: boolean;
	platform_name: string;
	support_phone: string;
	operational_status: 'active' | 'maintenance' | 'paused';
}

// In-memory fallback cache to ensure instant reactivity and zero downtime
let cachedSettings: PlatformSettings = {
	allow_provider_registration: false, // Default disabled per owner request
	platform_name: 'Titipin',
	support_phone: '081234567890',
	operational_status: 'active'
};

export async function getPlatformSettings(
	supabase?: SupabaseClient<Database>
): Promise<PlatformSettings> {
	if (!supabase) return { ...cachedSettings };

	try {
		const { data, error } = await supabase.from('platform_settings').select('*');

		if (!error && data && Array.isArray(data) && data.length > 0) {
			const settingsMap: Record<string, Json> = {};
			for (const row of data) {
				if (row.key) {
					settingsMap[row.key] = row.value;
				}
			}

			if (typeof settingsMap.allow_provider_registration === 'boolean') {
				cachedSettings.allow_provider_registration = settingsMap.allow_provider_registration;
			}
			if (typeof settingsMap.platform_name === 'string') {
				cachedSettings.platform_name = settingsMap.platform_name;
			}
			if (typeof settingsMap.support_phone === 'string') {
				cachedSettings.support_phone = settingsMap.support_phone;
			}
			if (
				settingsMap.operational_status === 'active' ||
				settingsMap.operational_status === 'maintenance' ||
				settingsMap.operational_status === 'paused'
			) {
				cachedSettings.operational_status = settingsMap.operational_status;
			}
		}
	} catch {
		// Table doesn't exist yet or query failed; safely use cached fallback
	}

	return { ...cachedSettings };
}

export async function updatePlatformSettings(
	supabase: SupabaseClient<Database> | undefined,
	newSettings: Partial<PlatformSettings>
): Promise<PlatformSettings> {
	cachedSettings = {
		...cachedSettings,
		...newSettings
	};

	if (supabase) {
		try {
			for (const [key, value] of Object.entries(newSettings)) {
				if (value !== undefined) {
					await supabase.from('platform_settings').upsert({
						key,
						value: value as Json,
						updated_at: new Date().toISOString()
					});
				}
			}
		} catch {
			// If table not present yet, cachedSettings still preserves state for current session
		}
	}

	return { ...cachedSettings };
}
