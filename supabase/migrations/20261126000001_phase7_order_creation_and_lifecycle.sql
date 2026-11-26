-- ==============================================================================
-- Titipin - Phase 7: Order Creation, Lifecycle & Status History Migration
-- ==============================================================================

-- 1. Create orders table
create table if not exists public.orders (
    id uuid primary key default gen_random_uuid(),
    order_number text not null unique,
    customer_id uuid not null references public.profiles(id) on delete cascade,
    provider_id uuid not null references public.provider_profiles(id) on delete cascade,
    service_id uuid references public.provider_services(id) on delete set null,
    category_id uuid references public.service_categories(id) on delete set null,
    status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'shopping', 'purchased', 'delivering', 'completed', 'cancelled')),
    origin_name text not null,
    origin_address text,
    destination_address_id uuid references public.addresses(id) on delete set null,
    destination_address_text text not null,
    recipient_name text not null,
    recipient_phone text not null,
    pricing_snapshot jsonb not null,
    estimated_item_cost numeric(10, 2) not null default 0,
    actual_item_cost numeric(10, 2),
    jastip_fee numeric(10, 2) not null default 0,
    total_estimated numeric(10, 2) not null default 0,
    actual_total numeric(10, 2),
    customer_notes text,
    cancellation_reason text,
    cancelled_by uuid references public.profiles(id) on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. Create order_items table
create table if not exists public.order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references public.orders(id) on delete cascade,
    name text not null,
    quantity integer not null default 1 check (quantity > 0),
    unit text not null default 'pcs',
    notes text,
    estimated_price numeric(10, 2) default 0,
    actual_price numeric(10, 2),
    created_at timestamptz not null default now()
);

-- 3. Create order_status_history table
create table if not exists public.order_status_history (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references public.orders(id) on delete cascade,
    from_status text,
    to_status text not null,
    actor_id uuid not null references public.profiles(id) on delete cascade,
    actor_role text not null check (actor_role in ('customer', 'provider', 'admin', 'system')),
    note text,
    created_at timestamptz not null default now()
);

-- 4. Indexes for fast queries
create index if not exists idx_orders_customer on public.orders(customer_id);
create index if not exists idx_orders_provider on public.orders(provider_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created on public.orders(created_at desc);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_order_history_order on public.order_status_history(order_id, created_at asc);

-- 5. Enable Row Level Security (RLS)
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;

-- 6. RLS Policies for orders
drop policy if exists "Users can view own orders" on public.orders;
create policy "Users can view own orders"
    on public.orders
    for select
    to authenticated
    using (
        auth.uid() = customer_id
        or auth.uid() = provider_id
        or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    );

drop policy if exists "Customers can insert orders" on public.orders;
create policy "Customers can insert orders"
    on public.orders
    for insert
    to authenticated
    with check (
        auth.uid() = customer_id
    );

drop policy if exists "Participants can update orders" on public.orders;
create policy "Participants can update orders"
    on public.orders
    for update
    to authenticated
    using (
        auth.uid() = customer_id
        or auth.uid() = provider_id
        or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
    with check (
        auth.uid() = customer_id
        or auth.uid() = provider_id
        or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    );

-- 7. RLS Policies for order_items
drop policy if exists "Users can view items of accessible orders" on public.order_items;
create policy "Users can view items of accessible orders"
    on public.order_items
    for select
    to authenticated
    using (
        exists (
            select 1 from public.orders o
            where o.id = order_items.order_id
            and (o.customer_id = auth.uid() or o.provider_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
        )
    );

drop policy if exists "Customers can insert order items" on public.order_items;
create policy "Customers can insert order items"
    on public.order_items
    for insert
    to authenticated
    with check (
        exists (
            select 1 from public.orders o
            where o.id = order_items.order_id
            and o.customer_id = auth.uid()
        )
    );

-- 8. RLS Policies for order_status_history
drop policy if exists "Users can view status history of accessible orders" on public.order_status_history;
create policy "Users can view status history of accessible orders"
    on public.order_status_history
    for select
    to authenticated
    using (
        exists (
            select 1 from public.orders o
            where o.id = order_status_history.order_id
            and (o.customer_id = auth.uid() or o.provider_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
        )
    );

drop policy if exists "Participants can insert status history" on public.order_status_history;
create policy "Participants can insert status history"
    on public.order_status_history
    for insert
    to authenticated
    with check (
        auth.uid() = actor_id
        and exists (
            select 1 from public.orders o
            where o.id = order_status_history.order_id
            and (o.customer_id = auth.uid() or o.provider_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
        )
    );
