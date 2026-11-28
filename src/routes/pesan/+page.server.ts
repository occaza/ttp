import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '#lib/types/database.types.js';
import { requireAuth } from '#lib/server/auth.js';
import { getServiceDetail } from '#lib/server/provider.js';
import { calculateOrderPricing, getPricingRule } from '#lib/server/pricing.js';
import { createOrder, isUuid, orderItemInputSchema } from '#lib/server/order.js';
import { z } from 'zod';

async function resolveDefaultProviderId(
	supabase: SupabaseClient<Database> | null
): Promise<string | null> {
	if (!supabase) return null;

	const { data: activeProvider } = await supabase
		.from('provider_profiles')
		.select('id')
		.eq('is_active', true)
		.order('created_at', { ascending: true })
		.limit(1)
		.maybeSingle();

	if (activeProvider?.id) {
		return activeProvider.id;
	}

	const { data: anyProvider } = await supabase
		.from('provider_profiles')
		.select('id')
		.order('created_at', { ascending: true })
		.limit(1)
		.maybeSingle();

	return anyProvider?.id ?? null;
}

export const load: PageServerLoad = async ({ url, locals }) => {
	const auth = requireAuth(locals);
	const serviceId = url.searchParams.get('service_id');
	const categorySlug = url.searchParams.get('kategori');
	const defaultOrigin = url.searchParams.get('origin') || '';

	const [
		{ data: addresses },
		{ data: categories },
		{ data: services },
		pricingRule,
		selectedService,
		defaultProviderId
	] = await Promise.all([
		locals.supabase
			.from('addresses')
			.select('*')
			.eq('user_id', auth.user.id)
			.order('is_primary', { ascending: false })
			.order('created_at', { ascending: false }),
		locals.supabase
			.from('service_categories')
			.select('*')
			.eq('is_active', true)
			.order('sort_order', { ascending: true }),
		locals.supabase
			.from('provider_services')
			.select('id, provider_id, category_id, title, description, base_fee, coverage_area')
			.eq('is_active', true)
			.order('created_at', { ascending: false }),
		getPricingRule(locals.supabase, 'gatak-flat'),
		serviceId ? getServiceDetail(locals.supabase, serviceId) : Promise.resolve(null),
		resolveDefaultProviderId(locals.supabase)
	]);

	const matchedCategory =
		selectedService?.category_id ||
		(categorySlug ? categories?.find((c) => c.slug === categorySlug)?.id : null) ||
		'';

	return {
		user: auth.user,
		profile: auth.profile,
		addresses: addresses || [],
		categories: categories || [],
		services: services || [],
		pricingRule,
		selectedService,
		initialCategoryId: matchedCategory,
		defaultOrigin,
		defaultProviderId
	};
};

export const actions: Actions = {
	createOrder: async ({ request, locals }) => {
		const auth = requireAuth(locals);
		const formData = await request.formData();

		const getStr = (key: string) => {
			const v = formData.get(key);
			return typeof v === 'string' ? v : '';
		};

		const rawServiceId = getStr('service_id');
		const serviceId = isUuid(rawServiceId) ? rawServiceId : null;

		let serviceRecord: {
			id: string;
			provider_id: string;
			category_id: string;
			base_fee: number;
		} | null = null;
		if (serviceId) {
			const { data: svc } = await locals.supabase
				.from('provider_services')
				.select('id, provider_id, category_id, base_fee')
				.eq('id', serviceId)
				.eq('is_active', true)
				.maybeSingle();
			serviceRecord = svc ?? null;
		}

		const rawProviderId = getStr('provider_id');
		const providerId =
			serviceRecord?.provider_id ||
			(isUuid(rawProviderId) ? rawProviderId : await resolveDefaultProviderId(locals.supabase));

		if (!providerId) {
			return fail(400, {
				error: 'Belum ada mitra aktif yang tersedia untuk menerima pesanan saat ini.'
			});
		}

		const rawCategoryId = getStr('category_id');
		const categoryId = serviceRecord?.category_id || (isUuid(rawCategoryId) ? rawCategoryId : null);

		const originName = getStr('origin_name').trim();
		const originAddress = getStr('origin_address').trim();
		const destinationAddressId = getStr('destination_address_id') || null;
		const destinationAddressText = getStr('destination_address_text').trim();
		const recipientName = getStr('recipient_name').trim() || auth.profile?.full_name || '';
		const recipientPhone = getStr('recipient_phone').trim() || auth.profile?.phone || '';
		const customerNotes = getStr('customer_notes').trim();
		const itemsJson = getStr('items_json') || '[]';

		if (!originName) {
			return fail(400, { error: 'Nama tempat, toko, atau titik awal wajib diisi.' });
		}

		if (!destinationAddressText) {
			return fail(400, { error: 'Alamat tujuan wajib diisi.' });
		}

		let parsedItems: unknown;
		try {
			parsedItems = JSON.parse(itemsJson) as unknown;
		} catch {
			return fail(400, { error: 'Format daftar rincian tidak valid.' });
		}

		if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
			return fail(400, { error: 'Harap cantumkan minimal 1 rincian pesanan.' });
		}

		const itemsValidation = z.array(orderItemInputSchema).safeParse(parsedItems);
		if (!itemsValidation.success) {
			const err =
				Object.values(itemsValidation.error.flatten().fieldErrors)[0]?.[0] ||
				'Daftar rincian tidak valid';
			return fail(400, { error: err });
		}

		const validatedItems = itemsValidation.data;
		const estimatedItemCost = validatedItems.reduce(
			(acc, it) => acc + it.estimated_price * it.quantity,
			0
		);

		let pricingSnapshot;
		try {
			pricingSnapshot = await calculateOrderPricing(locals.supabase, {
				origin: originName,
				destination: destinationAddressText,
				estimatedItemCost,
				customBaseFee: serviceRecord ? Number(serviceRecord.base_fee) : undefined,
				ruleId: 'gatak-flat'
			});
		} catch (pricingErr) {
			console.error('[PricingEngine Error]:', pricingErr);
			return fail(500, { error: 'Gagal menghitung tarif resmi pesanan.' });
		}

		let order;
		try {
			order = await createOrder(locals.supabase, auth.user.id, {
				provider_id: providerId,
				service_id: serviceId || undefined,
				category_id: categoryId || undefined,
				origin_name: originName,
				origin_address: originAddress,
				destination_address_id: destinationAddressId || undefined,
				destination_address_text: destinationAddressText,
				recipient_name: recipientName,
				recipient_phone: recipientPhone,
				items: validatedItems,
				customer_notes: customerNotes,
				pricing_snapshot: pricingSnapshot
			});
		} catch (err: unknown) {
			console.error('[CreateOrder Error]:', err);
			const msg = err instanceof Error ? err.message : 'Gagal membuat pesanan.';
			return fail(400, { error: msg });
		}

		throw redirect(303, `/pesanan/${order.order_number}`);
	}
};
