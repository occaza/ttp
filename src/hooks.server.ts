import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit/hooks';
import { redirect, error } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '#lib/config.js';
import type { Database, Profile, UserRole } from '#lib/types/database.types.js';

export const handle: Handle = async ({ event, resolve }) => {
	const supabaseUrl = PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = PUBLIC_SUPABASE_ANON_KEY;

	event.locals.supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return event.cookies.getAll();
			},
			setAll(cookiesToSet) {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		},
		global: {
			fetch: event.fetch
		}
	});

	// Safe session getter using getUser() per Supabase security guidelines
	event.locals.safeGetSession = async () => {
		const {
			data: { user },
			error: userError
		} = await event.locals.supabase.auth.getUser();

		if (userError || !user) {
			return { session: null, user: null };
		}

		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		return { session, user };
	};

	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	// Profile & Role bootstrap
	let profile: Profile | null = null;
	let role: UserRole | null = null;

	if (user) {
		const { data, error: profileError } = await event.locals.supabase
			.from('profiles')
			.select('*')
			.eq('id', user.id)
			.maybeSingle();

		if (!profileError && data) {
			profile = data;
			role = profile.role || 'customer';
		} else {
			// Fallback role from metadata if profile row isn't ready
			const rawRole = (user.app_metadata?.role as UserRole) || 'customer';
			role = rawRole;
			profile = {
				id: user.id,
				full_name:
					(user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Pengguna',
				phone: (user.user_metadata?.phone as string) || null,
				avatar_url: null,
				role,
				created_at: user.created_at,
				updated_at: user.created_at
			};
		}
	}

	event.locals.profile = profile;
	event.locals.role = role;

	// Route-level authorization guards
	const pathname = event.url.pathname;

	// Admin route guard
	if (pathname.startsWith('/admin')) {
		if (!user) {
			throw redirect(303, `/masuk?redirect=${encodeURIComponent(pathname)}`);
		}
		if (role !== 'admin') {
			throw error(403, {
				message: 'Akses ditolak: Hanya admin yang memiliki izin untuk membuka halaman ini.'
			});
		}
	}

	// Provider dashboard guard
	if (pathname.startsWith('/mitra/dashboard')) {
		if (!user) {
			throw redirect(303, `/masuk?redirect=${encodeURIComponent(pathname)}`);
		}
		if (role !== 'provider' && role !== 'admin') {
			throw error(403, {
				message: 'Akses ditolak: Halaman ini khusus untuk Mitra Penyedia Jasa.'
			});
		}
	}

	// Profile guard
	if (pathname.startsWith('/profil')) {
		if (!user) {
			throw redirect(303, `/masuk?redirect=${encodeURIComponent(pathname)}`);
		}
	}

	return resolve(event, {
		filterSerializedResponseHeaders(name: string) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
