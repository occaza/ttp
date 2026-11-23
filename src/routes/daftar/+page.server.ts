import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { registerSchema } from '#lib/server/auth.js';

export const load: PageServerLoad = ({ locals }) => {
	if (locals.user) {
		throw redirect(303, '/profil');
	}
	return {};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const formData = await request.formData();
		const full_name = formData.get('full_name');
		const email = formData.get('email');
		const phone = formData.get('phone');
		const password = formData.get('password');
		const role = formData.get('role');

		const parsed = registerSchema.safeParse({
			full_name,
			email,
			phone,
			password,
			role
		});

		if (!parsed.success) {
			const errors = parsed.error.flatten().fieldErrors;
			const firstError = Object.values(errors)[0]?.[0] || 'Data masukan tidak valid';
			return fail(400, {
				error: firstError,
				full_name: typeof full_name === 'string' ? full_name : '',
				email: typeof email === 'string' ? email : '',
				phone: typeof phone === 'string' ? phone : '',
				role: typeof role === 'string' ? role : 'customer'
			});
		}

		// Register user with Supabase Auth
		try {
			const { data: authData, error: signUpError } = await locals.supabase.auth.signUp({
				email: parsed.data.email,
				password: parsed.data.password,
				options: {
					data: {
						full_name: parsed.data.full_name,
						phone: parsed.data.phone || null,
						role: parsed.data.role
					}
				}
			});

			if (signUpError) {
				console.error('[Supabase Auth Error]', signUpError);
				let errorMessage = signUpError.message;
				if (signUpError.message === 'User already registered') {
					errorMessage = 'Email ini sudah terdaftar. Silakan masuk menggunakan akun Anda.';
				} else if (
					signUpError.message.includes('confirmation email') ||
					signUpError.message.includes('Error sending confirmation')
				) {
					errorMessage =
						'Supabase gagal mengirim email konfirmasi (kuota email bawaan Supabase habis). Solusi: Di dashboard Supabase, buka Authentication > Providers > Email, lalu matikan toggle "Confirm email".';
				} else if (
					signUpError.message.includes('Database error') ||
					signUpError.message.includes('saving new user')
				) {
					errorMessage =
						'Terjadi kendala pada database server Supabase. Pastikan trigger registrasi di SQL Editor sudah diperbarui.';
				} else if (signUpError.message === 'fetch failed') {
					errorMessage = 'Koneksi ke server otentikasi gagal. Silakan coba kembali sesaat lagi.';
				}

				return fail(400, {
					error: errorMessage,
					full_name: parsed.data.full_name,
					email: parsed.data.email,
					phone: parsed.data.phone || '',
					role: parsed.data.role
				});
			}

			if (authData.user) {
				// If session is established (auto-confirm enabled)
				if (authData.session) {
					// Bootstrap profile row in database if session exists
					await locals.supabase.from('profiles').upsert({
						id: authData.user.id,
						full_name: parsed.data.full_name,
						phone: parsed.data.phone || null,
						avatar_url: null,
						role: parsed.data.role
					});

					// If registered as provider, initialize provider profile
					if (parsed.data.role === 'provider') {
						await locals.supabase.from('provider_profiles').upsert({
							id: authData.user.id,
							user_id: authData.user.id,
							business_name: parsed.data.full_name,
							bio: null,
							is_verified: false,
							is_active: true,
							rating_avg: 5.0,
							rating_count: 0
						});
					}

					// Also record in user_roles mapping
					await locals.supabase.from('user_roles').insert({
						user_id: authData.user.id,
						role: parsed.data.role
					});

					throw redirect(303, '/profil');
				} else {
					// Email confirmation required or no session yet
					throw redirect(
						303,
						`/masuk?registered=true&email=${encodeURIComponent(parsed.data.email)}`
					);
				}
			}
		} catch (err) {
			// If redirect is thrown, rethrow it so SvelteKit navigates
			if (err && typeof err === 'object' && 'status' in err && 'location' in err) {
				throw err;
			}

			const rawMsg = err instanceof Error ? err.message : String(err);
			return fail(500, {
				error:
					rawMsg === 'fetch failed'
						? 'Koneksi ke server Supabase gagal. Silakan periksa jaringan internet atau server Supabase.'
						: `Gagal mendaftar: ${rawMsg}`,
				full_name: parsed.data.full_name,
				email: parsed.data.email,
				phone: parsed.data.phone || '',
				role: parsed.data.role
			});
		}

		throw redirect(303, '/profil');
	}
};
