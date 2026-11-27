import { redirect, type RequestHandler } from '@sveltejs/kit';
import { sanitizeRedirectPath } from '#lib/server/auth.js';

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const next = sanitizeRedirectPath(url.searchParams.get('next'), '/profil');

	if (code) {
		const { error } = await locals.supabase.auth.exchangeCodeForSession(code);
		if (!error) {
			throw redirect(303, next);
		}
	}

	throw redirect(303, '/masuk?error=auth_callback_failed');
};
