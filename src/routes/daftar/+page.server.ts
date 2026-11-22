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
			return fail(400, {
				error:
					signUpError.message === 'User already registered'
						? 'Email ini sudah terdaftar. Silakan masuk menggunakan akun Anda.'
						: signUpError.message,
				full_name: parsed.data.full_name,
				email: parsed.data.email,
				phone: parsed.data.phone || '',
				role: parsed.data.role
			});
		}

		if (authData.user) {
			// Bootstrap profile row in database
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
		}

		throw redirect(303, '/profil');
	}
};
