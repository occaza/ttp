-- ==============================================================================
-- TITIPIN: AUTOMATIC CLEANUP & KEEP ONLY 5 TITIPIN TABLES
-- Jalankan di: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. HAPUS OTOMATIS SEMUA TABEL DI SCHEMA PUBLIC KECUALI 5 TABEL UTAMA TITIPIN
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename NOT IN (
              'profiles', 
              'user_roles', 
              'provider_profiles', 
              'service_categories', 
              'addresses'
          )
    ) LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE;';
    END LOOP;
END $$;

-- 2. BERSIHKAN DATA DI TABEL TITIPIN (AGAR TIDAK ADA USER YANG TERKUNCI)
TRUNCATE TABLE public.addresses CASCADE;
TRUNCATE TABLE public.provider_profiles CASCADE;
TRUNCATE TABLE public.user_roles CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- 3. HAPUS USER YANG TERSANGKUT DI AUTH.USERS
DELETE FROM auth.users;

-- 4. PASTIKAN FOREIGN KEY TITIPIN MENGGUNAKAN ON DELETE CASCADE
ALTER TABLE public.profiles 
    DROP CONSTRAINT IF EXISTS profiles_id_fkey,
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_roles 
    DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey,
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.provider_profiles 
    DROP CONSTRAINT IF EXISTS provider_profiles_id_fkey,
    DROP CONSTRAINT IF EXISTS provider_profiles_user_id_fkey,
    ADD CONSTRAINT provider_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
    ADD CONSTRAINT provider_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.addresses 
    DROP CONSTRAINT IF EXISTS addresses_user_id_fkey,
    ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. REFRESH TRIGGER REGISTRASI USER DENGAN PENANGANAN ERROR
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    default_role text;
    user_fullname text;
    user_phone text;
BEGIN
    default_role := coalesce(new.raw_user_meta_data->>'role', 'customer');
    IF default_role NOT IN ('customer', 'provider', 'admin') THEN
        default_role := 'customer';
    END IF;

    user_fullname := coalesce(
        new.raw_user_meta_data->>'full_name',
        split_part(coalesce(new.email, 'pengguna@titipin.com'), '@', 1)
    );
    user_phone := new.raw_user_meta_data->>'phone';

    INSERT INTO public.profiles (id, full_name, phone, role)
    VALUES (new.id, user_fullname, user_phone, default_role)
    ON CONFLICT (id) DO UPDATE
    SET full_name = excluded.full_name,
        phone = coalesce(excluded.phone, profiles.phone),
        updated_at = now();

    INSERT INTO public.user_roles (user_id, role)
    VALUES (new.id, default_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    IF default_role = 'provider' THEN
        INSERT INTO public.provider_profiles (id, user_id, business_name, is_verified, is_active)
        VALUES (new.id, new.id, user_fullname, false, true)
        ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN new;
EXCEPTION
    WHEN others THEN
        RAISE WARNING 'handle_new_user error: %', SQLERRM;
        RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. SEED ULANG 6 KATEGORI UTAMA TITIPIN KE service_categories
INSERT INTO public.service_categories (name, slug, description, icon, is_active, sort_order)
VALUES 
    ('Kuliner & Makanan', 'food-beverage', 'Makanan siap saji, kafe, jajanan khas', 'utensils', true, 1),
    ('Minimarket & Mart', 'grocery-mart', 'Kebutuhan harian, snack, minuman', 'store', true, 2),
    ('Pasar Tradisional', 'traditional-market', 'Sayur, buah, daging, bumbu dapur', 'carrot', true, 3),
    ('Apotek & Obat', 'pharmacy', 'Obat bebas, vitamin, suplemen', 'pill', true, 4),
    ('Ambil & Antar Dokumen/Barang', 'pickup-delivery', 'Kunci, berkas kerja, paket mendesak', 'truck', true, 5),
    ('Titip Kustom & Antrean', 'custom-request', 'Florist, antrean tiket, permintaan spesifik', 'sparkles', true, 6)
ON CONFLICT (slug) DO UPDATE
SET name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;
