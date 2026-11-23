-- ==============================================================================
-- TITIPIN: CLEAN SLATE & RESET SCRIPT (BULLETPROOF)
-- Jalankan di: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. LEPAS SEMUA FOREIGN KEY DI SCHEMA PUBLIC YANG MENUNJUK KE auth.users
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tc.table_schema, tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND ccu.table_schema = 'auth'
          AND ccu.table_name = 'users'
          AND tc.table_schema = 'public'
    ) LOOP
        EXECUTE 'ALTER TABLE ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) || ' DROP CONSTRAINT IF EXISTS ' || quote_ident(r.constraint_name) || ' CASCADE;';
    END LOOP;
END $$;

-- 2. HAPUS SEMUA TABEL LAMA YANG BUKAN MILIK TITIPIN
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.transaction_items CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.items CASCADE;
DROP TABLE IF EXISTS public.todos CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.countries CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 3. BERSIHKAN DATA TABEL TITIPIN
TRUNCATE TABLE public.addresses CASCADE;
TRUNCATE TABLE public.provider_profiles CASCADE;
TRUNCATE TABLE public.user_roles CASCADE;
TRUNCATE TABLE public.profiles CASCADE;

-- 4. HAPUS USER DARI auth.users (SEKARANG DIJAMIN BERHASIL KARENA KUNCIAN SUDAH LEPAS)
DELETE FROM auth.users;

-- 5. RECONSTRUCT TABEL TITIPIN DENGAN ON DELETE CASCADE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'provider', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pastikan foreign key profiles terpasang dengan ON DELETE CASCADE
ALTER TABLE public.profiles 
    DROP CONSTRAINT IF EXISTS profiles_id_fkey,
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('customer', 'provider', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT user_roles_user_id_role_unique UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles 
    DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey,
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.provider_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT,
    bio TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    rating_avg NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    rating_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_profiles 
    DROP CONSTRAINT IF EXISTS provider_profiles_id_fkey,
    DROP CONSTRAINT IF EXISTS provider_profiles_user_id_fkey,
    ADD CONSTRAINT provider_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE,
    ADD CONSTRAINT provider_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT NOT NULL DEFAULT 'shopping-bag',
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    recipient_phone TEXT NOT NULL,
    street_address TEXT NOT NULL,
    notes TEXT,
    city TEXT NOT NULL DEFAULT 'Jakarta Selatan',
    postal_code TEXT,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.addresses 
    DROP CONSTRAINT IF EXISTS addresses_user_id_fkey,
    ADD CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 6. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- 7. REFRESH TRIGGER REGISTRASI USER DENGAN ERROR HANDLING
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

-- 8. SEED ULANG 6 KATEGORI UTAMA TITIPIN
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
