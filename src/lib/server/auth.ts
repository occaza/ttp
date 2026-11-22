import { error, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import type { UserRole, Profile } from '#lib/types/database.types.js';

export const loginSchema = z.object({
	email: z.string().trim().email({ message: 'Alamat email tidak valid' }),
	password: z.string().min(6, { message: 'Kata sandi minimal 6 karakter' })
});

export const registerSchema = z.object({
	full_name: z
		.string()
		.trim()
		.min(2, { message: 'Nama lengkap minimal 2 karakter' })
		.max(100, { message: 'Nama lengkap maksimal 100 karakter' }),
	email: z.string().trim().email({ message: 'Alamat email tidak valid' }),
	phone: z
		.string()
		.trim()
		.regex(/^(\+62|62|0)[0-9]{8,13}$/, {
			message: 'Nomor telepon harus valid (contoh: 08123456789)'
		})
		.optional()
		.or(z.literal('')),
	password: z.string().min(6, { message: 'Kata sandi minimal 6 karakter' }),
	role: z.enum(['customer', 'provider'], {
		message: 'Pilih peran yang valid (Pelanggan atau Penyedia Jasa)'
	})
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

export function requireAuth(
	locals: App.Locals,
	redirectTo = '/masuk'
): {
	user: NonNullable<App.Locals['user']>;
	profile: Profile | null;
	role: UserRole;
} {
	if (!locals.user) {
		throw redirect(303, redirectTo);
	}

	return {
		user: locals.user,
		profile: locals.profile,
		role: locals.role || 'customer'
	};
}

export function requireRole(
	locals: App.Locals,
	allowedRoles: UserRole[],
	redirectTo = '/masuk'
): {
	user: NonNullable<App.Locals['user']>;
	profile: Profile | null;
	role: UserRole;
} {
	const auth = requireAuth(locals, redirectTo);

	if (!allowedRoles.includes(auth.role)) {
		throw error(403, {
			message: 'Akses ditolak: Anda tidak memiliki izin untuk halaman ini.'
		});
	}

	return auth;
}

export function hasRole(role: UserRole | null | undefined, allowed: UserRole[]): boolean {
	if (!role) return false;
	return allowed.includes(role);
}
