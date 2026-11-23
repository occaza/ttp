-- ==============================================================================
-- Titipin - Phase 3: Profiles, Addresses, and Categories Migration
-- ==============================================================================

-- 1. Create service_categories table
create table if not exists public.service_categories (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    slug text not null unique,
    description text,
    icon text not null default 'shopping-bag',
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. Create addresses table for customer saved addresses
create table if not exists public.addresses (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    label text not null,
    recipient_name text not null,
    recipient_phone text not null,
    street_address text not null,
    notes text,
    city text not null default 'Jakarta Selatan',
    postal_code text,
    latitude numeric(10, 7),
    longitude numeric(10, 7),
    is_primary boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Index for user addresses
create index if not exists idx_addresses_user_id on public.addresses(user_id);
create index if not exists idx_service_categories_slug on public.service_categories(slug);

-- 3. Trigger for managing is_primary addresses
create or replace function public.handle_address_primary()
returns trigger as $$
begin
    if new.is_primary = true then
        update public.addresses
        set is_primary = false, updated_at = now()
        where user_id = new.user_id and id != new.id and is_primary = true;
    end if;
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists tr_address_primary on public.addresses;
create trigger tr_address_primary
    before insert or update on public.addresses
    for each row execute function public.handle_address_primary();

-- 4. Enable Row Level Security (RLS)
alter table public.service_categories enable row level security;
alter table public.addresses enable row level security;

-- 5. RLS Policies for service_categories
create policy "Categories are viewable by everyone"
    on public.service_categories
    for select
    using (is_active = true or exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
    ));

create policy "Admins can insert categories"
    on public.service_categories
    for insert
    to authenticated
    with check (exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
    ));

create policy "Admins can update categories"
    on public.service_categories
    for update
    to authenticated
    using (exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
    ));

create policy "Admins can delete categories"
    on public.service_categories
    for delete
    to authenticated
    using (exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
    ));

-- 6. RLS Policies for addresses
create policy "Users can view own addresses"
    on public.addresses
    for select
    to authenticated
    using (auth.uid() = user_id or exists (
        select 1 from public.profiles where id = auth.uid() and role = 'admin'
    ));

create policy "Users can insert own addresses"
    on public.addresses
    for insert
    to authenticated
    with check (auth.uid() = user_id);

create policy "Users can update own addresses"
    on public.addresses
    for update
    to authenticated
    using (auth.uid() = user_id);

create policy "Users can delete own addresses"
    on public.addresses
    for delete
    to authenticated
    using (auth.uid() = user_id);

-- 7. Seed Initial Core Categories
insert into public.service_categories (name, slug, description, icon, is_active, sort_order)
values
    ('Jastip Makanan & Minuman', 'food-beverage', 'Titip beli kuliner resto, kafe, jajanan pasar, dan minuman favorit lokal.', 'utensils', true, 1),
    ('Belanja Minimarket & Mart', 'grocery-mart', 'Kebutuhan harian minimarket, bahan dapur cepat, dan stok kebutuhan rumah.', 'store', true, 2),
    ('Pasar Tradisional Segar', 'traditional-market', 'Sayuran, buah segar, daging, dan bumbu dapur dari pasar tradisional terdekat.', 'carrot', true, 3),
    ('Apotek & Obat Resep', 'pharmacy', 'Titip beli vitamin, suplemen, obat bebas, dan kebutuhan kesehatan darurat.', 'pill', true, 4),
    ('Mall & Toko Khusus', 'mall-shopping', 'Belanja pakaian, buku, elektronik ringan, dan oleh-oleh dari pusat perbelanjaan.', 'shopping-bag', true, 5),
    ('Titip Ambil & Antar Barang', 'pickup-delivery', 'Jasa penjemputan dokumen penting, barang tertinggal, atau paket dalam kota.', 'truck', true, 6)
on conflict (slug) do update set
    name = excluded.name,
    description = excluded.description,
    icon = excluded.icon,
    sort_order = excluded.sort_order;
