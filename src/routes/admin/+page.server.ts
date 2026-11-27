import type { Actions, PageServerLoad } from './$types';
import { requireRole, categorySchema } from '#lib/server/auth.js';
import { fail } from '@sveltejs/kit';
import type { OrderStatus, ServiceCategory, UserRole } from '#lib/types/database.types.js';
import { getPlatformSettings, updatePlatformSettings } from '#lib/server/settings.js';
import { getAllPayments, verifyPayment, rejectPayment } from '#lib/server/payment.js';
import { getAllOrdersForAdmin, transitionOrderStatus } from '#lib/server/order.js';
import {
	getAllPricingRules,
	getAuditLogs,
	getDisputesForAdmin,
	getProvidersForAdmin,
	moderateProvider,
	recordAuditLog,
	updateDisputeStatus,
	updatePricingRule
} from '#lib/server/admin.js';

export const load: PageServerLoad = async ({ locals }) => {
	// Server-side strict authorization: only admin/owner
	const auth = requireRole(locals, ['admin']);

	// 1. Fetch categories
	const { data: categories } = await locals.supabase
		.from('service_categories')
		.select('*')
		.order('sort_order', { ascending: true });

	const fallbackCategories: ServiceCategory[] = [
		{
			id: '1',
			name: 'Kuliner & Makanan',
			slug: 'food-beverage',
			description: 'Makanan siap saji, kafe, jajanan khas',
			icon: 'utensils',
			is_active: true,
			sort_order: 1,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		},
		{
			id: '2',
			name: 'Minimarket & Mart',
			slug: 'grocery-mart',
			description: 'Kebutuhan harian, snack, minuman',
			icon: 'store',
			is_active: true,
			sort_order: 2,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		},
		{
			id: '3',
			name: 'Pasar Tradisional',
			slug: 'traditional-market',
			description: 'Sayur, buah, daging, bumbu dapur',
			icon: 'carrot',
			is_active: true,
			sort_order: 3,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		},
		{
			id: '4',
			name: 'Apotek & Obat',
			slug: 'pharmacy',
			description: 'Obat bebas, vitamin, suplemen',
			icon: 'pill',
			is_active: true,
			sort_order: 4,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		},
		{
			id: '5',
			name: 'Ambil & Antar Dokumen/Barang',
			slug: 'pickup-delivery',
			description: 'Kunci, berkas kerja, paket mendesak',
			icon: 'truck',
			is_active: true,
			sort_order: 5,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		},
		{
			id: '6',
			name: 'Titip Kustom & Antrean',
			slug: 'custom-request',
			description: 'Florist, antrean tiket, permintaan spesifik',
			icon: 'sparkles',
			is_active: true,
			sort_order: 6,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		}
	];

	// 2. Fetch platform settings
	const settings = await getPlatformSettings(locals.supabase);

	// 2b. Fetch manual payments, orders, providers, pricing rules, disputes, and audit logs
	const [rawPayments, rawOrders, providers, pricingRules, disputes, auditLogs] = await Promise.all([
		getAllPayments(locals.supabase, 50),
		getAllOrdersForAdmin(locals.supabase, 50),
		getProvidersForAdmin(locals.supabase),
		getAllPricingRules(locals.supabase),
		getDisputesForAdmin(locals.supabase, 50),
		getAuditLogs(locals.supabase, 50)
	]);

	const orderById = new Map(rawOrders.map((o) => [o.id, o]));
	const paymentByOrderId = new Map(rawPayments.map((p) => [p.order_id, p]));

	const orders = rawOrders.map((ord) => {
		const pay = paymentByOrderId.get(ord.id);
		return {
			...ord,
			paymentStatus: pay?.status || 'unpaid',
			paymentReference: pay?.payment_reference || null
		};
	});

	const payments = rawPayments.map((p) => ({
		...p,
		order_number: orderById.get(p.order_id)?.order_number || null
	}));

	// 3. Fetch registered users list
	const { data: usersData } = await locals.supabase
		.from('profiles')
		.select('id, full_name, phone, role, created_at')
		.order('created_at', { ascending: false })
		.limit(30);

	const userList = usersData || [];
	const providerCount = userList.filter((u) => u.role === 'provider').length;
	const awaitingPaymentsCount = payments.filter((p) => p.status === 'awaiting_verification').length;
	const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
	const activeOrdersCount = orders.filter((o) =>
		['accepted', 'shopping', 'purchased', 'delivering'].includes(o.status)
	).length;
	const openDisputesCount = disputes.filter(
		(d) => d.status === 'open' || d.status === 'investigating'
	).length;
	const verifiedProvidersCount = providers.filter((p) => p.is_verified).length;

	return {
		user: auth.user,
		profile: auth.profile,
		role: auth.role,
		categories: categories && categories.length > 0 ? categories : fallbackCategories,
		settings,
		orders,
		payments,
		users: userList,
		providers,
		pricingRules,
		disputes,
		auditLogs,
		stats: {
			totalUsers: userList.length,
			totalProviders: providerCount,
			verifiedProviders: verifiedProvidersCount,
			awaitingPayments: awaitingPaymentsCount,
			pendingOrders: pendingOrdersCount,
			activeOrders: activeOrdersCount,
			openDisputes: openDisputesCount,
			totalCategories: (categories && categories.length > 0 ? categories : fallbackCategories)
				.length,
			activeCategories: (categories && categories.length > 0
				? categories
				: fallbackCategories
			).filter((c) => c.is_active).length
		}
	};
};

export const actions: Actions = {
	saveCategory: async ({ request, locals }) => {
		const auth = requireRole(locals, ['admin']);

		const formData = await request.formData();
		const id = formData.get('id') as string | null;
		const name = formData.get('name') as string;
		const slug = formData.get('slug') as string;
		const description = formData.get('description') as string;
		const icon = (formData.get('icon') as string) || 'shopping-bag';
		const sort_order = Number(formData.get('sort_order') || 0);
		const is_active = formData.get('is_active') === 'on' || formData.get('is_active') === 'true';

		const parseResult = categorySchema.safeParse({
			id: id || undefined,
			name,
			slug,
			description,
			icon,
			sort_order,
			is_active
		});

		if (!parseResult.success) {
			const firstError = parseResult.error.issues[0]?.message || 'Input kategori tidak valid';
			return fail(400, { error: firstError });
		}

		const dataToSave = parseResult.data;

		if (dataToSave.id) {
			const { error: updateError } = await locals.supabase
				.from('service_categories')
				.update({
					name: dataToSave.name,
					slug: dataToSave.slug,
					description: dataToSave.description,
					icon: dataToSave.icon,
					sort_order: dataToSave.sort_order,
					is_active: dataToSave.is_active,
					updated_at: new Date().toISOString()
				})
				.eq('id', dataToSave.id);

			if (updateError) {
				return fail(500, { error: `Gagal memperbarui kategori: ${updateError.message}` });
			}
			await recordAuditLog(locals.supabase, auth.user.id, auth.role, {
				action: 'category.updated',
				target_type: 'service_category',
				target_id: dataToSave.id,
				metadata: { name: dataToSave.name, slug: dataToSave.slug }
			});
			return { success: true, message: 'Kategori berhasil diperbarui.' };
		} else {
			const { data: inserted, error: insertError } = await locals.supabase
				.from('service_categories')
				.insert({
					name: dataToSave.name,
					slug: dataToSave.slug,
					description: dataToSave.description,
					icon: dataToSave.icon,
					sort_order: dataToSave.sort_order,
					is_active: dataToSave.is_active
				})
				.select('id')
				.single();

			if (insertError) {
				return fail(500, { error: `Gagal menambahkan kategori: ${insertError.message}` });
			}
			await recordAuditLog(locals.supabase, auth.user.id, auth.role, {
				action: 'category.created',
				target_type: 'service_category',
				target_id: inserted?.id || dataToSave.slug,
				metadata: { name: dataToSave.name, slug: dataToSave.slug }
			});
			return { success: true, message: 'Kategori berhasil ditambahkan.' };
		}
	},

	toggleCategoryActive: async ({ request, locals }) => {
		const auth = requireRole(locals, ['admin']);

		const formData = await request.formData();
		const id = formData.get('id') as string;
		const currentStatus = formData.get('current_status') === 'true';

		if (!id) {
			return fail(400, { error: 'ID Kategori tidak valid' });
		}

		const { error: updateError } = await locals.supabase
			.from('service_categories')
			.update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
			.eq('id', id);

		if (updateError) {
			return fail(500, { error: `Gagal mengubah status kategori: ${updateError.message}` });
		}

		await recordAuditLog(locals.supabase, auth.user.id, auth.role, {
			action: 'category.toggled',
			target_type: 'service_category',
			target_id: id,
			metadata: { is_active: !currentStatus }
		});

		return { success: true, message: 'Status kategori berhasil diperbarui.' };
	},

	deleteCategory: async ({ request, locals }) => {
		const auth = requireRole(locals, ['admin']);

		const formData = await request.formData();
		const id = formData.get('id') as string;

		if (!id) {
			return fail(400, { error: 'ID Kategori tidak valid' });
		}

		const { error: deleteError } = await locals.supabase
			.from('service_categories')
			.delete()
			.eq('id', id);

		if (deleteError) {
			return fail(500, { error: `Gagal menghapus kategori: ${deleteError.message}` });
		}

		await recordAuditLog(locals.supabase, auth.user.id, auth.role, {
			action: 'category.deleted',
			target_type: 'service_category',
			target_id: id
		});

		return { success: true, message: 'Kategori berhasil dihapus.' };
	},

	toggleMitraRegistration: async ({ request, locals }) => {
		const auth = requireRole(locals, ['admin']);

		const formData = await request.formData();
		const currentStatus = formData.get('current_status') === 'true';
		const nextStatus = !currentStatus;

		await updatePlatformSettings(locals.supabase, {
			allow_provider_registration: nextStatus
		});

		await recordAuditLog(locals.supabase, auth.user.id, auth.role, {
			action: 'settings.mitra_registration_toggled',
			target_type: 'platform_settings',
			metadata: { allow_provider_registration: nextStatus }
		});

		return {
			success: true,
			message: nextStatus
				? 'Pendaftaran mitra berhasil DIAKTIFKAN.'
				: 'Pendaftaran mitra berhasil DINONAKTIFKAN (fokus operasional internal).'
		};
	},

	updateSettings: async ({ request, locals }) => {
		const auth = requireRole(locals, ['admin']);

		const formData = await request.formData();
		const allow_provider_registration =
			formData.get('allow_provider_registration') === 'on' ||
			formData.get('allow_provider_registration') === 'true';
		const platform_name = (formData.get('platform_name') as string) || 'Titipin';
		const support_phone = (formData.get('support_phone') as string) || '081234567890';
		const rawStatus = (formData.get('operational_status') as string) || 'active';
		const operational_status: 'active' | 'maintenance' | 'paused' =
			rawStatus === 'maintenance' || rawStatus === 'paused' ? rawStatus : 'active';

		await updatePlatformSettings(locals.supabase, {
			allow_provider_registration,
			platform_name,
			support_phone,
			operational_status
		});

		await recordAuditLog(locals.supabase, auth.user.id, auth.role, {
			action: 'settings.updated',
			target_type: 'platform_settings',
			metadata: { allow_provider_registration, platform_name, operational_status }
		});

		return { success: true, message: 'Pengaturan platform berhasil disimpan.' };
	},

	updateUserRole: async ({ request, locals }) => {
		const auth = requireRole(locals, ['admin']);

		const formData = await request.formData();
		const userId = formData.get('user_id') as string;
		const newRole = formData.get('role') as UserRole;

		if (!userId || !['customer', 'provider', 'admin'].includes(newRole)) {
			return fail(400, { error: 'Data perubahan peran tidak valid.' });
		}

		const { error: updateError } = await locals.supabase
			.from('profiles')
			.update({ role: newRole, updated_at: new Date().toISOString() })
			.eq('id', userId);

		if (updateError) {
			return fail(500, { error: `Gagal mengubah peran: ${updateError.message}` });
		}

		// Sync user_roles table
		await locals.supabase
			.from('user_roles')
			.upsert({ user_id: userId, role: newRole }, { onConflict: 'user_id,role' });

		await recordAuditLog(locals.supabase, auth.user.id, auth.role, {
			action: 'user.role_updated',
			target_type: 'profile',
			target_id: userId,
			metadata: { new_role: newRole }
		});

		return { success: true, message: `Peran pengguna berhasil diubah menjadi ${newRole}.` };
	},

	verifyOrderPayment: async ({ request, locals }) => {
		const auth = requireRole(locals, ['admin']);
		const formData = await request.formData();

		const rawOrderId = formData.get('order_id');
		const rawAmount = formData.get('paid_amount');
		const rawExtRef = formData.get('external_reference');
		const rawNote = formData.get('note');

		const orderId = typeof rawOrderId === 'string' ? rawOrderId : '';
		const paidAmount = typeof rawAmount === 'string' && rawAmount ? Number(rawAmount) : NaN;
		const externalReference =
			typeof rawExtRef === 'string' && rawExtRef.trim() ? rawExtRef.trim() : undefined;
		const note = typeof rawNote === 'string' && rawNote.trim() ? rawNote.trim() : undefined;

		if (!orderId || !Number.isFinite(paidAmount) || paidAmount < 0) {
			return fail(400, { error: 'ID pesanan dan nominal pembayaran wajib valid.' });
		}

		try {
			await verifyPayment(locals.supabase, auth.user.id, auth.role, {
				order_id: orderId,
				paid_amount: paidAmount,
				external_reference: externalReference,
				note
			});
			await recordAuditLog(locals.supabase, auth.user.id, auth.role, {
				action: 'payment.verified',
				target_type: 'order',
				target_id: orderId,
				metadata: { paid_amount: paidAmount, external_reference: externalReference || null }
			});
			return { success: true, message: 'Pembayaran pesanan berhasil diverifikasi lunas.' };
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Gagal memverifikasi pembayaran.';
			return fail(400, { error: msg });
		}
	},

	rejectOrderPayment: async ({ request, locals }) => {
		const auth = requireRole(locals, ['admin']);
		const formData = await request.formData();

		const rawOrderId = formData.get('order_id');
		const rawReason = formData.get('rejection_reason');

		const orderId = typeof rawOrderId === 'string' ? rawOrderId : '';
		const rejectionReason = typeof rawReason === 'string' ? rawReason.trim() : '';

		if (!orderId) {
			return fail(400, { error: 'ID pesanan wajib diisi.' });
		}

		try {
			await rejectPayment(locals.supabase, auth.user.id, auth.role, {
				order_id: orderId,
				rejection_reason: rejectionReason
			});
			await recordAuditLog(locals.supabase, auth.user.id, auth.role, {
				action: 'payment.rejected',
				target_type: 'order',
				target_id: orderId,
				metadata: { rejection_reason: rejectionReason || null }
			});
			return { success: true, message: 'Bukti pembayaran ditolak dan pemesan diberitahu.' };
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Gagal menolak bukti pembayaran.';
			return fail(400, { error: msg });
		}
	},

	updateOrderStatus: async ({ request, locals }) => {
		const auth = requireRole(locals, ['admin']);
		const formData = await request.formData();

		const rawOrderId = formData.get('order_id');
		const rawToStatus = formData.get('to_status');
		const rawNote = formData.get('note');
		const rawActualCost = formData.get('actual_item_cost');

		const orderId = typeof rawOrderId === 'string' ? rawOrderId : '';
		const toStatus = (typeof rawToStatus === 'string' ? rawToStatus : '') as OrderStatus;
		const note = typeof rawNote === 'string' && rawNote.trim() ? rawNote.trim() : undefined;
		const actualItemCost =
			typeof rawActualCost === 'string' && rawActualCost ? Number(rawActualCost) : undefined;

		if (!orderId || !toStatus) {
			return fail(400, { error: 'ID pesanan dan status tujuan wajib diisi.' });
		}

		try {
			await transitionOrderStatus(locals.supabase, auth.user.id, auth.role, {
				order_id: orderId,
				to_status: toStatus,
				note,
				actual_item_cost: actualItemCost
			});
			await recordAuditLog(locals.supabase, auth.user.id, auth.role, {
				action: 'order.status_updated',
				target_type: 'order',
				target_id: orderId,
				metadata: { to_status: toStatus, actual_item_cost: actualItemCost ?? null }
			});
			return { success: true, message: `Status pesanan berhasil diperbarui menjadi ${toStatus}.` };
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Gagal memperbarui status pesanan.';
			return fail(400, { error: msg });
		}
	},

	moderateProvider: async ({ request, locals }) => {
		const auth = requireRole(locals, ['admin']);
		const formData = await request.formData();

		const providerId = (formData.get('provider_id') as string) || '';
		const rawVerified = formData.get('is_verified');
		const rawActive = formData.get('is_active');

		const input: { provider_id: string; is_verified?: boolean; is_active?: boolean } = {
			provider_id: providerId
		};
		if (rawVerified !== null) input.is_verified = rawVerified === 'true';
		if (rawActive !== null) input.is_active = rawActive === 'true';

		try {
			await moderateProvider(locals.supabase, auth.user.id, auth.role, input);
			return { success: true, message: 'Status moderasi mitra berhasil diperbarui.' };
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Gagal memperbarui status mitra.';
			return fail(400, { error: msg });
		}
	},

	updatePricingRule: async ({ request, locals }) => {
		const auth = requireRole(locals, ['admin']);
		const formData = await request.formData();

		try {
			await updatePricingRule(locals.supabase, auth.user.id, auth.role, {
				id: formData.get('id'),
				name: formData.get('name'),
				base_fee: Number(formData.get('base_fee')),
				base_distance_km: Number(formData.get('base_distance_km')),
				per_km_fee: Number(formData.get('per_km_fee')),
				platform_fee: Number(formData.get('platform_fee')),
				min_order_fee: Number(formData.get('min_order_fee')),
				is_active: formData.get('is_active') === 'on' || formData.get('is_active') === 'true'
			});
			return { success: true, message: 'Aturan tarif berhasil diperbarui.' };
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Gagal memperbarui aturan tarif.';
			return fail(400, { error: msg });
		}
	},

	updateDisputeStatus: async ({ request, locals }) => {
		const auth = requireRole(locals, ['admin']);
		const formData = await request.formData();

		try {
			await updateDisputeStatus(locals.supabase, auth.user.id, auth.role, {
				dispute_id: formData.get('dispute_id'),
				status: formData.get('status'),
				resolution_note: (formData.get('resolution_note') as string) || undefined
			});
			return { success: true, message: 'Status laporan/sengketa berhasil diperbarui.' };
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : 'Gagal memperbarui status laporan.';
			return fail(400, { error: msg });
		}
	}
};
