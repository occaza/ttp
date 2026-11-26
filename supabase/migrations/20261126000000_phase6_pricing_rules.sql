-- ==============================================================================
-- Titipin - Phase 6: Pricing Engine & Pricing Rules Migration
-- ==============================================================================

-- 1. Create pricing_rules table
create table if not exists public.pricing_rules (
    id text primary key,
    name text not null,
    model text not null check (model in ('fixed', 'distance_based', 'shopping_delivery')),
    base_fee numeric(10, 2) not null default 8000,
    base_distance_km numeric(6, 2) not null default 3.0,
    per_km_fee numeric(10, 2) not null default 2000,
    platform_fee numeric(10, 2) not null default 1000,
    min_order_fee numeric(10, 2) not null default 5000,
    is_active boolean not null default true,
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. Indexes
create index if not exists idx_pricing_rules_model on public.pricing_rules(model);
create index if not exists idx_pricing_rules_active on public.pricing_rules(is_active);

-- 3. Enable RLS
alter table public.pricing_rules enable row level security;

-- 4. RLS Policies
drop policy if exists "Pricing rules are viewable by everyone" on public.pricing_rules;
create policy "Pricing rules are viewable by everyone"
    on public.pricing_rules
    for select
    using (is_active = true or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Admins can manage pricing rules" on public.pricing_rules;
create policy "Admins can manage pricing rules"
    on public.pricing_rules
    for all
    to authenticated
    using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
    with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

-- 5. Seed default pricing rules for Gatak & Sukoharjo operations
insert into public.pricing_rules (id, name, model, base_fee, base_distance_km, per_km_fee, platform_fee, min_order_fee, is_active, metadata)
values
    (
        'gatak-flat',
        'Tarif Flat Jastip Gatak',
        'fixed',
        8000.00,
        5.00,
        0.00,
        1000.00,
        8000.00,
        true,
        '{"coverage": "Kecamatan Gatak & Sekitarnya", "description": "Tarif flat belanja satu toko/lokasi untuk area Gatak dan Gawok"}'::jsonb
    ),
    (
        'gatak-distance',
        'Tarif Berbasis Jarak Gatak - Solo Raya',
        'distance_based',
        7000.00,
        2.50,
        2000.00,
        1000.00,
        7000.00,
        true,
        '{"coverage": "Antar-Kecamatan (Gatak, Kartasura, Baki, Sawit)", "description": "Tarif dasar untuk 2.5 km pertama ditambah Rp 2.000 per kilometer berikutnya"}'::jsonb
    ),
    (
        'gatak-shopping-delivery',
        'Belanja Pasar / Multi-Item + Pengantaran',
        'shopping_delivery',
        8000.00,
        3.00,
        2000.00,
        1000.00,
        10000.00,
        true,
        '{"service_fee": 8000.00, "delivery_base": 5000.00, "description": "Jastip belanja pasar subuh atau swalayan dengan banyak daftar item"}'::jsonb
    )
on conflict (id) do update set
    name = excluded.name,
    model = excluded.model,
    base_fee = excluded.base_fee,
    base_distance_km = excluded.base_distance_km,
    per_km_fee = excluded.per_km_fee,
    platform_fee = excluded.platform_fee,
    min_order_fee = excluded.min_order_fee,
    is_active = excluded.is_active,
    metadata = excluded.metadata,
    updated_at = now();
