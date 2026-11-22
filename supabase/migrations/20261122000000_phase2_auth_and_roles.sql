-- ==============================================================================
-- Titipin - Phase 2: Auth and Roles Migration
-- ==============================================================================

-- 1. Create profiles table
create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    phone text,
    avatar_url text,
    role text not null default 'customer' check (role in ('customer', 'provider', 'admin')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. Create user_roles table for role audit & management
create table if not exists public.user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    role text not null check (role in ('customer', 'provider', 'admin')),
    created_at timestamptz not null default now(),
    constraint user_roles_user_id_role_unique unique (user_id, role)
);

-- 3. Create provider_profiles table foundation
create table if not exists public.provider_profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    business_name text,
    bio text,
    is_verified boolean not null default false,
    is_active boolean not null default true,
    rating_avg numeric(3, 2) not null default 5.00,
    rating_count integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 4. Enable Row Level Security (RLS) on all exposed tables
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.provider_profiles enable row level security;

-- 5. RLS Policies for profiles
create policy "Profiles are viewable by authenticated users"
    on public.profiles
    for select
    to authenticated
    using (true);

create policy "Users can insert their own profile"
    on public.profiles
    for insert
    to authenticated
    with check ((select auth.uid()) = id);

create policy "Users can update their own profile"
    on public.profiles
    for update
    to authenticated
    using ((select auth.uid()) = id)
    with check ((select auth.uid()) = id);

-- 6. RLS Policies for user_roles
create policy "Users can view their own roles"
    on public.user_roles
    for select
    to authenticated
    using ((select auth.uid()) = user_id);

create policy "Users can insert their own role records"
    on public.user_roles
    for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

-- 7. RLS Policies for provider_profiles
create policy "Provider profiles are viewable by all authenticated users"
    on public.provider_profiles
    for select
    to authenticated
    using (true);

create policy "Providers can insert their own profile"
    on public.provider_profiles
    for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

create policy "Providers can update their own profile"
    on public.provider_profiles
    for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

-- 8. Automatic profile bootstrap trigger on new user signup
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
    default_role := coalesce(new.raw_user_meta_data->>'role', 'customer');
    if default_role not in ('customer', 'provider', 'admin') then
        default_role := 'customer';
    end if;

    user_fullname := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
    user_phone := new.raw_user_meta_data->>'phone';

    insert into public.profiles (id, full_name, phone, role)
    values (new.id, user_fullname, user_phone, default_role)
    on conflict (id) do nothing;

    insert into public.user_roles (user_id, role)
    values (new.id, default_role)
    on conflict (user_id, role) do nothing;

    if default_role = 'provider' then
        insert into public.provider_profiles (id, user_id, business_name, is_verified, is_active)
        values (new.id, new.id, user_fullname, false, true)
        on conflict (id) do nothing;
    end if;

    return new;
end;
$$;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
