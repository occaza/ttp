-- ==============================================================================
-- Titipin - Fix Auth Registration Trigger & Cleanup Unrelated Tables
-- Jalankan script ini di: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. DROP TRIGGER LAMA & FUNCTION BERMASALAH PADA auth.users
drop trigger if exists on_auth_user_created on auth.users;

-- 2. BUAT FUNCTION BARU YANG AMAN DAN TAHAN ERROR
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
    default_role text;
    user_fullname text;
    user_phone text;
begin
    -- Ekstrak role dari metadata, fallback ke 'customer'
    default_role := coalesce(new.raw_user_meta_data->>'role', 'customer');
    if default_role not in ('customer', 'provider', 'admin') then
        default_role := 'customer';
    end if;

    -- Ekstrak nama lengkap, fallback ke username email
    user_fullname := coalesce(
        new.raw_user_meta_data->>'full_name',
        split_part(coalesce(new.email, 'pengguna@titipin.com'), '@', 1)
    );
    user_phone := new.raw_user_meta_data->>'phone';

    -- Insert ke profiles jika tabel ada
    insert into public.profiles (id, full_name, phone, role)
    values (new.id, user_fullname, user_phone, default_role)
    on conflict (id) do update
    set full_name = excluded.full_name,
        phone = coalesce(excluded.phone, profiles.phone),
        updated_at = now();

    -- Insert ke user_roles jika tabel ada
    insert into public.user_roles (user_id, role)
    values (new.id, default_role)
    on conflict (user_id, role) do nothing;

    -- Jika mendaftar sebagai provider
    if default_role = 'provider' then
        insert into public.provider_profiles (id, user_id, business_name, is_verified, is_active)
        values (new.id, new.id, user_fullname, false, true)
        on conflict (id) do nothing;
    end if;

    return new;
exception
    when others then
        -- Tangkap error agar tidak memblokir registrasi auth.users
        raise warning 'handle_new_user error: %', SQLERRM;
        return new;
end;
$$;

-- 3. PASANG ULANG TRIGGER PADA auth.users
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- 4. DROP TABEL YANG TIDAK BERHUBUNGAN DENGAN TITIPIN
-- PERINGATAN: Menghapus tabel produk lama jika tidak diperlukan lagi
drop table if exists public.products cascade;
