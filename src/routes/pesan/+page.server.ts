import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '#lib/types/database.types.js';
import { requireAuth } from '#lib/server/auth.js';
import { getServiceDetail } from '#lib/server/provider.js';
import { calculateOrderPricing } from '#lib/server/pricing.js';
import { createOrder, isUuid, orderItemInputSchema } from '#lib/server/order.js';
import { z } from 'zod';

async function resolveDefaultOwnerProviderId(
	supabase: SupabaseClient<Database> | null
): Promise<string> {
	if (supabase) {
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

		if (anyProvider?.id) {
			return anyProvider.id;
		}
	}
	return 'owner-titipin';
}

export const load: PageServerLoad = async ({ url, locals }) => {
	const auth = requireAuth(locals);
	const serviceId = url.searchParams.get('service_id');
	const defaultOrigin = url.searchParams.get('origin') || '';

	// Fetch customer addresses
	const { data: addresses } = await locals.supabase
		.from('addresses')
		.select('*')
		.eq('user_id', auth.user.id)
		.order('is_primary', { ascending: false })
		.order('created_at', { ascending: false });

	let selectedService = null;
	if (serviceId) {
		selectedService = await getServiceDetail(locals.supabase, serviceId);
	}

	const defaultProviderId = await resolveDefaultOwnerProviderId(locals.supabase);

	return {
		user: auth.user,
		profile: auth.profile,
		addresses: addresses || [],
		selectedService,
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

		const rawProviderId = getStr('provider_id');
		const providerId = isUuid(rawProviderId)
			? rawProviderId
			: await resolveDefaultOwnerProviderId(locals.supabase);

		const rawServiceId = getStr('service_id');
		const serviceId = isUuid(rawServiceId) ? rawServiceId : null;

		const rawCategoryId = getStr('category_id');
		const categoryId = isUuid(rawCategoryId) ? rawCategoryId : null;

		const originName = getStr('origin_name');
		const originAddress = getStr('origin_address');
		const destinationAddressId = getStr('destination_address_id') || null;
		const destinationAddressText = getStr('destination_address_text');
		const recipientName = getStr('recipient_name') || auth.profile?.full_name || '';
		const recipientPhone = getStr('recipient_phone') || auth.profile?.phone || '';
		const customerNotes = getStr('customer_notes');
		const itemsJson = getStr('items_json') || '[]';

		let parsedItems: unknown;
		try {
			parsedItems = JSON.parse(itemsJson) as unknown;
		} catch {
			return fail(400, { error: 'Format daftar belanja tidak valid.' });
		}

		if (!Array.isArray(parsedItems) || parsedItems.length === 0) {
			return fail(400, { error: 'Harap cantumkan minimal 1 barang belanjaan.' });
		}

		// Validate items with Zod
		const itemsValidation = z.array(orderItemInputSchema).safeParse(parsedItems);
		if (!itemsValidation.success) {
			const err =
				Object.values(itemsValidation.error.flatten().fieldErrors)[0]?.[0] ||
				'Daftar item tidak valid';
			return fail(400, { error: err });
		}

		const validatedItems = itemsValidation.data;
		const estimatedItemCost = validatedItems.reduce(
			(acc, it) => acc + it.estimated_price * it.quantity,
			0
		);

		// Run Server-Authoritative Pricing Engine
		let pricingSnapshot;
		try {
			pricingSnapshot = await calculateOrderPricing(locals.supabase, {
				origin: originName || 'Gatak (Pusat)',
				destination: destinationAddressText || 'Gatak',
				estimatedItemCost,
				ruleId: 'gatak-flat'
			});
		} catch (pricingErr) {
			console.error('[PricingEngine Error]:', pricingErr);
			return fail(500, { error: 'Gagal menghitung tarif resmi pesanan.' });
		}

		// Create Order
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
			const msg = err instanceof Error ? err.message : 'Gagal membuat pesanan jastip.';
			return fail(400, { error: msg });
		}

		throw redirect(303, `/pesanan/${order.order_number}`);
	}
};
