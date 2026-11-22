import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { loginSchema } from '#lib/server/auth.js';

export const load: PageServerLoad = ({ locals, url }) => {
	if (locals.user) {
		const redirectUrl = url.searchParams.get('redirect') || '/profil';
		throw redirect(303, redirectUrl);
	}
	return {};
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

		const { error: signInError } = await locals.supabase.auth.signInWithPassword({
			email: parsed.data.email,
			password: parsed.data.password
		});

		if (signInError) {
			return fail(400, {
				error:
					signInError.message === 'Invalid login credentials'
						? 'Email atau kata sandi salah. Silakan coba lagi.'
						: signInError.message,
				email: parsed.data.email
			});
		}

		const redirectUrl = url.searchParams.get('redirect') || '/profil';
		throw redirect(303, redirectUrl);
	}
};
