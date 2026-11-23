import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import type { Actions, PageServerLoad } from './$types';

const forgotPasswordSchema = z.object({
	email: z.string().trim().email('Format email tidak valid')
});

export const load: PageServerLoad = ({ locals }) => {
	return {
		isAuthenticated: !!locals.user
	};
};

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const formData = await request.formData();
		const email = formData.get('email');

		const parsed = forgotPasswordSchema.safeParse({ email });
		if (!parsed.success) {
			const errors = parsed.error.flatten().fieldErrors;
			return fail(400, {
				error: errors.email?.[0] || 'Email tidak valid',
				email: typeof email === 'string' ? email : ''
			});
		}

		try {
			const redirectTo = `${url.origin}/profil`;
			const { error } = await locals.supabase.auth.resetPasswordForEmail(parsed.data.email, {
				redirectTo
			});

			if (error) {
				return fail(400, {
					error: error.message || 'Gagal mengirim instruksi pemulihan kata sandi.',
					email: parsed.data.email
				});
			}

			return {
				success: true,
				email: parsed.data.email
			};
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			return fail(500, {
				error: `Terjadi kendala sistem: ${msg}`,
				email: parsed.data.email
			});
		}
	}
};
