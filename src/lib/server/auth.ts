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

export const profileUpdateSchema = z.object({
	full_name: z
		.string()
		.trim()
		.min(2, { message: 'Nama lengkap minimal 2 karakter' })
		.max(100, { message: 'Nama lengkap maksimal 100 karakter' }),
	phone: z
		.string()
		.trim()
		.regex(/^(\+62|62|0)[0-9]{8,13}$/, {
			message: 'Nomor telepon harus valid (contoh: 08123456789)'
		})
		.optional()
		.or(z.literal('')),
	avatar_url: z.string().trim().optional().or(z.literal(''))
});

export const addressSchema = z.object({
	id: z.string().uuid().optional(),
	label: z
		.string()
		.trim()
		.min(1, { message: 'Label alamat harus diisi (contoh: Rumah, Kantor)' })
		.max(50, { message: 'Label alamat maksimal 50 karakter' }),
	recipient_name: z
		.string()
		.trim()
		.min(2, { message: 'Nama penerima minimal 2 karakter' })
		.max(100, { message: 'Nama penerima maksimal 100 karakter' }),
	recipient_phone: z
		.string()
		.trim()
		.regex(/^(\+62|62|0)[0-9]{8,13}$/, {
			message: 'Nomor telepon penerima harus valid (contoh: 08123456789)'
		}),
	street_address: z
		.string()
		.trim()
		.min(5, { message: 'Alamat lengkap jalan/blok minimal 5 karakter' })
		.max(255, { message: 'Alamat lengkap maksimal 255 karakter' }),
	notes: z
		.string()
		.trim()
		.max(150, { message: 'Catatan patokan maksimal 150 karakter' })
		.optional()
		.or(z.literal('')),
	city: z
		.string()
		.trim()
		.min(2, { message: 'Kota/Kabupaten harus diisi' })
		.max(100, { message: 'Kota maksimal 100 karakter' })
		.default('Jakarta Selatan'),
	postal_code: z.string().trim().max(10).optional().or(z.literal('')),
	is_primary: z.boolean().default(false)
});

export const categorySchema = z.object({
	id: z.string().uuid().optional(),
	name: z
		.string()
		.trim()
		.min(2, { message: 'Nama kategori minimal 2 karakter' })
		.max(100, { message: 'Nama kategori maksimal 100 karakter' }),
	slug: z
		.string()
		.trim()
		.min(2, { message: 'Slug kategori minimal 2 karakter' })
		.regex(/^[a-z0-9-]+$/, {
			message: 'Slug hanya boleh berisi huruf kecil, angka, dan tanda minus'
		}),
	description: z
		.string()
		.trim()
		.max(255, { message: 'Deskripsi maksimal 255 karakter' })
		.optional()
		.or(z.literal('')),
	icon: z
		.string()
		.trim()
		.min(2, { message: 'Nama ikon minimal 2 karakter' })
		.default('shopping-bag'),
	is_active: z.boolean().default(true),
	sort_order: z.number().int().default(0)
});

export const providerServiceSchema = z.object({
	id: z.string().uuid().optional(),
	category_id: z.string().uuid({ message: 'Pilih kategori layanan yang valid' }),
	title: z
		.string()
		.trim()
		.min(3, { message: 'Judul layanan minimal 3 karakter (contoh: Jastip Soto Gawok)' })
		.max(100, { message: 'Judul layanan maksimal 100 karakter' }),
	description: z
		.string()
		.trim()
		.max(300, { message: 'Deskripsi maksimal 300 karakter' })
		.optional()
		.or(z.literal('')),
	base_fee: z.coerce
		.number()
		.min(1000, { message: 'Tarif dasar jastip minimal Rp 1.000' })
		.max(1000000, { message: 'Tarif dasar maksimal Rp 1.000.000' }),
	coverage_area: z
		.string()
		.trim()
		.min(3, { message: 'Cakupan area minimal 3 karakter (contoh: Gatak, Gawok)' })
		.max(200, { message: 'Cakupan area maksimal 200 karakter' })
		.default('Gatak dan sekitarnya'),
	is_active: z.boolean().default(true)
});

export const providerProfileUpdateSchema = z.object({
	business_name: z
		.string()
		.trim()
		.min(2, { message: 'Nama layanan/usaha minimal 2 karakter' })
		.max(100, { message: 'Nama layanan maksimal 100 karakter' }),
	bio: z
		.string()
		.trim()
		.max(250, { message: 'Bio maksimal 250 karakter' })
		.optional()
		.or(z.literal('')),
	coverage_area: z
		.string()
		.trim()
		.max(200, { message: 'Cakupan area maksimal 200 karakter' })
		.default('Gatak dan sekitarnya'),
	is_active: z.boolean().default(true)
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type AddressInput = z.infer<typeof addressSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type ProviderServiceInput = z.infer<typeof providerServiceSchema>;
export type ProviderProfileUpdateInput = z.infer<typeof providerProfileUpdateSchema>;

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
