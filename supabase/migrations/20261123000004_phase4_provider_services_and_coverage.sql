-- ==============================================================================
-- Titipin - Phase 4: Provider Services and Coverage Migration
-- ==============================================================================

-- 1. Ensure coverage_area column exists on provider_profiles
alter table public.provider_profiles
    add column if not exists coverage_area text default 'Gatak dan sekitarnya';

-- 2. Allow public to view provider profiles for discovery
drop policy if exists "Provider profiles are viewable by everyone" on public.provider_profiles;
create policy "Provider profiles are viewable by everyone"
    on public.provider_profiles
    for select
    using (true);

-- 3. Create provider_services table
create table if not exists public.provider_services (
    id uuid primary key default gen_random_uuid(),
    provider_id uuid not null references public.provider_profiles(id) on delete cascade,
    category_id uuid not null references public.service_categories(id) on delete cascade,
    title text not null,
    description text,
    base_fee numeric(10, 2) not null default 8000,
    coverage_area text not null default 'Gatak, Gawok, Trangsan, Mayang',
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 4. Indexes for fast lookups
create index if not exists idx_provider_services_provider on public.provider_services(provider_id);
create index if not exists idx_provider_services_category on public.provider_services(category_id);
create index if not exists idx_provider_services_active on public.provider_services(is_active);

-- 5. Enable Row Level Security (RLS)
alter table public.provider_services enable row level security;

-- 6. RLS Policies for provider_services
drop policy if exists "Active provider services are viewable by everyone" on public.provider_services;
create policy "Active provider services are viewable by everyone"
    on public.provider_services
    for select
    using (
        is_active = true 
        or auth.uid() = provider_id 
        or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    );

drop policy if exists "Providers can insert own services" on public.provider_services;
create policy "Providers can insert own services"
    on public.provider_services
    for insert
    to authenticated
    with check (
        auth.uid() = provider_id 
        or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    );

drop policy if exists "Providers can update own services" on public.provider_services;
create policy "Providers can update own services"
    on public.provider_services
    for update
    to authenticated
    using (
        auth.uid() = provider_id 
        or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    );

drop policy if exists "Providers can delete own services" on public.provider_services;
create policy "Providers can delete own services"
    on public.provider_services
    for delete
    to authenticated
    using (
        auth.uid() = provider_id 
        or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    );
