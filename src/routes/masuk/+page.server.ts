import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loginSchema, sanitizeRedirectPath } from '#lib/server/auth.js';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) {
		const redirectUrl = sanitizeRedirectPath(url.searchParams.get('redirect'), '/profil');
		throw redirect(303, redirectUrl);
	}
	const registered = url.searchParams.get('registered') === 'true';
	const email = url.searchParams.get('email') || '';
	return { registered, email };
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const password = formData.get('password');

		const parsed = loginSchema.safeParse({ email, password });
		if (!parsed.success) {
			const errors = parsed.error.flatten().fieldErrors;
			return fail(400, {
				error: errors.email?.[0] || errors.password?.[0] || 'Data masukan tidak valid',
				email: typeof email === 'string' ? email : ''
			});
		}

		try {
			const { error: signInError } = await locals.supabase.auth.signInWithPassword({
				email: parsed.data.email,
				password: parsed.data.password
			});

			if (signInError) {
				let errorMessage = signInError.message;
				if (signInError.message === 'Invalid login credentials') {
					errorMessage =
						'Email atau kata sandi salah. Pastikan Anda sudah berhasil mendaftar di halaman /daftar.';
				} else if (signInError.message === 'Email not confirmed') {
					errorMessage =
						'Email belum dikonfirmasi. Silakan matikan "Confirm email" di Supabase Dashboard (Authentication > Providers > Email).';
				} else if (signInError.message === 'fetch failed') {
					errorMessage = 'Koneksi ke server otentikasi gagal. Silakan coba sesaat lagi.';
				}

				return fail(400, {
					error: errorMessage,
					email: parsed.data.email
				});
			}
		} catch (err) {
			// If redirect is thrown, rethrow it
			if (err && typeof err === 'object' && 'status' in err && 'location' in err) {
				throw err;
			}

			const rawMsg = err instanceof Error ? err.message : String(err);
			return fail(500, {
				error: `Gagal masuk: ${rawMsg}`,
				email: parsed.data.email
			});
		}

		const redirectUrl = sanitizeRedirectPath(url.searchParams.get('redirect'), '/profil');
		throw redirect(303, redirectUrl);
	}
};
