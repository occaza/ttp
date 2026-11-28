-- Remake core service categories into Dititipin, Dianterin, and Dibantuin
-- Deactivate legacy categories without breaking historical foreign keys
UPDATE public.service_categories
SET is_active = false, updated_at = NOW()
WHERE slug IN (
	'food-beverage',
	'grocery-mart',
	'traditional-market',
	'pharmacy',
	'mall-shopping',
	'pickup-delivery',
	'custom-request'
);

-- Upsert the 3 core service categories
INSERT INTO public.service_categories (name, slug, description, icon, is_active, sort_order)
VALUES
	(
		'Dititipin',
		'dititipin',
		'Jasa titip beli makanan, minuman, belanjaan, atau barang dari tempat pilihan seperti Gacoan Makamhaji, Roti Sajiyem, dan lainnya.',
		'shopping-bag',
		true,
		1
	),
	(
		'Dianterin',
		'dianterin',
		'Jasa antar dokumen, paket, barang tertinggal, atau pengantaran ke suatu tempat dengan aman dan tepat waktu.',
		'truck',
		true,
		2
	),
	(
		'Dibantuin',
		'dibantuin',
		'Jasa bantuan harian seperti survey lokasi, bersih-bersih, antre, dan bantuan praktis lainnya.',
		'hand-helping',
		true,
		3
	)
ON CONFLICT (slug) DO UPDATE SET
	name = EXCLUDED.name,
	description = EXCLUDED.description,
	icon = EXCLUDED.icon,
	is_active = true,
	sort_order = EXCLUDED.sort_order,
	updated_at = NOW();

-- Deactivate old sample services if present
UPDATE public.provider_services
SET is_active = false, updated_at = NOW()
WHERE id IN (
	'04c6976e-7460-4423-a7d1-02bdb113a0df',
	'3bc9bb48-f6a0-4e32-a7a3-94dc2cba0c16',
	'abf333e9-2772-4a60-87e4-521650eb044e'
);

-- Seed initial services for Dititipin, Dianterin, and Dibantuin under the first active provider
DO $$
DECLARE
	v_provider_id uuid;
	v_dititipin_id uuid;
	v_dianterin_id uuid;
	v_dibantuin_id uuid;
BEGIN
	SELECT id INTO v_provider_id
	FROM public.provider_profiles
	WHERE is_active = true
	ORDER BY created_at ASC
	LIMIT 1;

	IF v_provider_id IS NULL THEN
		RETURN;
	END IF;

	SELECT id INTO v_dititipin_id FROM public.service_categories WHERE slug = 'dititipin' LIMIT 1;
	SELECT id INTO v_dianterin_id FROM public.service_categories WHERE slug = 'dianterin' LIMIT 1;
	SELECT id INTO v_dibantuin_id FROM public.service_categories WHERE slug = 'dibantuin' LIMIT 1;

	IF v_dititipin_id IS NOT NULL THEN
		INSERT INTO public.provider_services (provider_id, category_id, title, description, base_fee, coverage_area, is_active)
		SELECT v_provider_id, v_dititipin_id, 'Dititipin Gacoan Makamhaji', 'Titip beli Mie Gacoan Makamhaji tanpa perlu antre lama di lokasi.', 10000, 'Gatak, Kartasura, Makamhaji & Sekitarnya', true
		WHERE NOT EXISTS (
			SELECT 1 FROM public.provider_services WHERE title = 'Dititipin Gacoan Makamhaji' AND category_id = v_dititipin_id
		);

		INSERT INTO public.provider_services (provider_id, category_id, title, description, base_fee, coverage_area, is_active)
		SELECT v_provider_id, v_dititipin_id, 'Dititipin Roti Sajiyem', 'Titip beli aneka roti hangat dan jajanan dari Roti Sajiyem.', 8000, 'Gatak, Gawok, Kartasura & Sekitarnya', true
		WHERE NOT EXISTS (
			SELECT 1 FROM public.provider_services WHERE title = 'Dititipin Roti Sajiyem' AND category_id = v_dititipin_id
		);
	END IF;

	IF v_dianterin_id IS NOT NULL THEN
		INSERT INTO public.provider_services (provider_id, category_id, title, description, base_fee, coverage_area, is_active)
		SELECT v_provider_id, v_dianterin_id, 'Dianterin Dokumen & Berkas', 'Pengantaran dokumen penting, kunci tertinggal, atau paket lokal dalam kota.', 9000, 'Gatak, Kartasura, Solo Raya', true
		WHERE NOT EXISTS (
			SELECT 1 FROM public.provider_services WHERE title = 'Dianterin Dokumen & Berkas' AND category_id = v_dianterin_id
		);

		INSERT INTO public.provider_services (provider_id, category_id, title, description, base_fee, coverage_area, is_active)
		SELECT v_provider_id, v_dianterin_id, 'Dianterin ke Suatu Tempat', 'Jasa antar langsung ke titik tujuan pilihan Anda dengan rute fleksibel.', 12000, 'Gatak, Kartasura, Baki & Sekitarnya', true
		WHERE NOT EXISTS (
			SELECT 1 FROM public.provider_services WHERE title = 'Dianterin ke Suatu Tempat' AND category_id = v_dianterin_id
		);
	END IF;

	IF v_dibantuin_id IS NOT NULL THEN
		INSERT INTO public.provider_services (provider_id, category_id, title, description, base_fee, coverage_area, is_active)
		SELECT v_provider_id, v_dibantuin_id, 'Dibantuin Survey Lokasi', 'Bantuan pengecekan atau survey tempat, kos, toko, maupun kondisi lokasi dengan foto laporan.', 15000, 'Gatak, Kartasura, Baki & Sekitarnya', true
		WHERE NOT EXISTS (
			SELECT 1 FROM public.provider_services WHERE title = 'Dibantuin Survey Lokasi' AND category_id = v_dibantuin_id
		);

		INSERT INTO public.provider_services (provider_id, category_id, title, description, base_fee, coverage_area, is_active)
		SELECT v_provider_id, v_dibantuin_id, 'Dibantuin Bersih-bersih', 'Bantuan beres-beres dan bersih-bersih rumah, kamar kos, atau area kerja.', 25000, 'Gatak, Gawok, Kartasura', true
		WHERE NOT EXISTS (
			SELECT 1 FROM public.provider_services WHERE title = 'Dibantuin Bersih-bersih' AND category_id = v_dibantuin_id
		);
	END IF;
END $$;
