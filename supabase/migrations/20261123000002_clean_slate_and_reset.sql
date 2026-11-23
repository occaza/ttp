-- ==============================================================================
-- TITIPIN: CLEAN SLATE & RESET SCRIPT
-- Jalankan di: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. HAPUS SEMUA TABEL LAMA YANG TIDAK BERHUBUNGAN DENGAN TITIPIN
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.items CASCADE;
DROP TABLE IF EXISTS public.todos CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.countries CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.posts CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 2. BERSIHKAN DATA DI TABEL TITIPIN (AGAR TIDAK MENGUNCI USER DI AUTH)
DELETE FROM public.addresses;
DELETE FROM public.provider_profiles;
DELETE FROM public.user_roles;
DELETE FROM public.profiles;

-- 3. HAPUS USER YANG TERSANGKUT DI AUTH.USERS
-- Menghapus semua user di auth schema
DELETE FROM auth.users;

-- 4. PASTIKAN SCHEMA TITIPIN BERSIH & SIAP (PHASE 2 & 3)

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'provider', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('customer', 'provider', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT user_roles_user_id_role_unique UNIQUE (user_id, role)
);

-- Provider Profiles
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

-- Service Categories
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

-- Addresses
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

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

-- 5. REFRESH TRIGGER REGISTRASI USER YANG AMAN
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

-- 6. SEED KATEGORI LAYANAN TITIPIN (PHASE 3)
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
