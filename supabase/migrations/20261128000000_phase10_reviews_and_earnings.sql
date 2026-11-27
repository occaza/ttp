-- ==============================================================================
-- Titipin - Phase 10: Customer Reviews & Provider Earnings/Payout Records
-- ==============================================================================

-- 1. Create reviews table (1 review per completed order)
create table if not exists public.reviews (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null unique references public.orders(id) on delete cascade,
    customer_id uuid not null references public.profiles(id) on delete cascade,
    provider_id uuid not null references public.provider_profiles(id) on delete cascade,
    rating integer not null check (rating >= 1 and rating <= 5),
    comment text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. Create provider_payouts table (explicit payout records only; never implied)
create table if not exists public.provider_payouts (
    id uuid primary key default gen_random_uuid(),
    provider_id uuid not null references public.provider_profiles(id) on delete cascade,
    amount numeric(12, 2) not null check (amount > 0),
    reference text,
    status text not null default 'recorded' check (status in ('recorded', 'paid')),
    note text,
    recorded_by uuid references public.profiles(id) on delete set null,
    paid_at timestamptz,
    created_at timestamptz not null default now()
);

-- 3. Indexes
create index if not exists idx_reviews_provider on public.reviews(provider_id, created_at desc);
create index if not exists idx_reviews_customer on public.reviews(customer_id);
create index if not exists idx_provider_payouts_provider on public.provider_payouts(provider_id, created_at desc);

-- 4. Enable RLS
alter table public.reviews enable row level security;
alter table public.provider_payouts enable row level security;

-- 5. RLS Policies for reviews
drop policy if exists "Anyone can view reviews" on public.reviews;
create policy "Anyone can view reviews"
    on public.reviews
    for select
    to anon, authenticated
    using (true);

drop policy if exists "Customers can review own completed orders" on public.reviews;
create policy "Customers can review own completed orders"
    on public.reviews
    for insert
    to authenticated
    with check (
        customer_id = auth.uid()
        and exists (
            select 1 from public.orders o
            where o.id = reviews.order_id
              and o.customer_id = auth.uid()
              and o.provider_id = reviews.provider_id
              and o.status = 'completed'
        )
    );

-- 6. RLS Policies for provider_payouts
drop policy if exists "Providers and admins can view payouts" on public.provider_payouts;
create policy "Providers and admins can view payouts"
    on public.provider_payouts
    for select
    to authenticated
    using (
        provider_id = auth.uid()
        or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
        )
    );

drop policy if exists "Only admins can record payouts" on public.provider_payouts;
create policy "Only admins can record payouts"
    on public.provider_payouts
    for insert
    to authenticated
    with check (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
        )
    );

-- 7. Trigger to keep provider_profiles.rating_avg and rating_count in sync
create or replace function public.sync_provider_rating_summary()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    target_provider_id uuid;
    avg_score numeric(3, 2);
    total_count integer;
begin
    target_provider_id := coalesce(new.provider_id, old.provider_id);

    select
        coalesce(round(avg(rating)::numeric, 2), 5.00),
        count(*)::integer
    into avg_score, total_count
    from public.reviews
    where provider_id = target_provider_id;

    update public.provider_profiles
    set
        rating_avg = avg_score,
        rating_count = total_count,
        updated_at = now()
    where id = target_provider_id;

    return coalesce(new, old);
end;
$$;

revoke execute on function public.sync_provider_rating_summary() from public, anon, authenticated;

drop trigger if exists trg_sync_provider_rating_summary on public.reviews;
create trigger trg_sync_provider_rating_summary
    after insert or update or delete on public.reviews
    for each row execute function public.sync_provider_rating_summary();
