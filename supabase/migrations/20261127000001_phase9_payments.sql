-- ==============================================================================
-- Titipin - Phase 9: Manual Payment MVP & Audit Trail
-- ==============================================================================

-- 1. Create payments table (strictly decoupled from orders.status)
create table if not exists public.payments (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null unique references public.orders(id) on delete cascade,
    payment_reference text not null unique,
    customer_id uuid not null references public.profiles(id) on delete cascade,
    method text not null check (method in ('cash_on_delivery', 'bank_transfer', 'qris_manual')),
    status text not null default 'unpaid' check (status in ('unpaid', 'awaiting_verification', 'verified', 'rejected', 'refunded')),
    expected_amount numeric(12, 2) not null default 0 check (expected_amount >= 0),
    paid_amount numeric(12, 2) check (paid_amount is null or paid_amount >= 0),
    external_reference text,
    payer_name text,
    proof_file_path text,
    proof_file_name text,
    proof_mime_type text,
    proof_file_size integer check (proof_file_size is null or (proof_file_size > 0 and proof_file_size <= 5242880)),
    verified_by uuid references public.profiles(id) on delete set null,
    verified_at timestamptz,
    rejection_reason text,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. Create immutable payment_events audit trail table
create table if not exists public.payment_events (
    id uuid primary key default gen_random_uuid(),
    payment_id uuid not null references public.payments(id) on delete cascade,
    order_id uuid not null references public.orders(id) on delete cascade,
    event_type text not null check (event_type in ('created', 'method_selected', 'proof_submitted', 'verified', 'rejected', 'refunded', 'note_added')),
    from_status text,
    to_status text not null,
    actor_id uuid references public.profiles(id) on delete set null,
    actor_role text not null check (actor_role in ('customer', 'provider', 'admin', 'system')),
    amount numeric(12, 2),
    external_reference text,
    note text,
    created_at timestamptz not null default now()
);

-- 3. Extend notifications type constraint to allow payment_update
do $$
declare r record;
begin
    for r in (
        select conname from pg_constraint
        where conrelid = 'public.notifications'::regclass
          and contype = 'c'
          and pg_get_constraintdef(oid) like '%type%'
    ) loop
        execute format('alter table public.notifications drop constraint %I', r.conname);
    end loop;
end $$;

alter table public.notifications
    add constraint notifications_type_check
    check (type in ('order_update', 'chat_message', 'evidence_uploaded', 'payment_update', 'system'));

-- 4. Indexes
create index if not exists idx_payments_order on public.payments(order_id);
create index if not exists idx_payments_status on public.payments(status, updated_at desc);
create index if not exists idx_payments_reference on public.payments(payment_reference);
create index if not exists idx_payment_events_payment on public.payment_events(payment_id, created_at asc);

-- 5. Enable RLS
alter table public.payments enable row level security;
alter table public.payment_events enable row level security;

-- 6. RLS Policies for payments
drop policy if exists "Participants and admins can view payments" on public.payments;
create policy "Participants and admins can view payments"
    on public.payments
    for select
    to authenticated
    using (
        customer_id = auth.uid()
        or exists (
            select 1 from public.orders o
            where o.id = payments.order_id
              and o.provider_id = auth.uid()
        )
        or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
        )
    );

drop policy if exists "Customers can initiate unverified payment for own order" on public.payments;
create policy "Customers can initiate unverified payment for own order"
    on public.payments
    for insert
    to authenticated
    with check (
        (
            customer_id = auth.uid()
            and status in ('unpaid', 'awaiting_verification')
            and verified_by is null
            and verified_at is null
            and exists (
                select 1 from public.orders o
                where o.id = payments.order_id and o.customer_id = auth.uid()
            )
        )
        or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
        )
        or exists (
            select 1 from public.orders o
            where o.id = payments.order_id and o.provider_id = auth.uid()
        )
    );

drop policy if exists "Customers submit proof only; privileged roles verify" on public.payments;
create policy "Customers submit proof only; privileged roles verify"
    on public.payments
    for update
    to authenticated
    using (
        customer_id = auth.uid()
        or exists (
            select 1 from public.orders o
            where o.id = payments.order_id and o.provider_id = auth.uid()
        )
        or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
        )
    )
    with check (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
        )
        or exists (
            select 1 from public.orders o
            where o.id = payments.order_id and o.provider_id = auth.uid()
        )
        or (
            customer_id = auth.uid()
            and status in ('unpaid', 'awaiting_verification')
            and verified_by is null
            and verified_at is null
        )
    );

-- 7. RLS Policies for payment_events (append-only audit log)
drop policy if exists "Participants and admins can view payment events" on public.payment_events;
create policy "Participants and admins can view payment events"
    on public.payment_events
    for select
    to authenticated
    using (
        exists (
            select 1 from public.orders o
            where o.id = payment_events.order_id
              and (
                  o.customer_id = auth.uid()
                  or o.provider_id = auth.uid()
                  or exists (
                      select 1 from public.profiles p
                      where p.id = auth.uid() and p.role = 'admin'
                  )
              )
        )
    );

drop policy if exists "Participants and admins can append payment events" on public.payment_events;
create policy "Participants and admins can append payment events"
    on public.payment_events
    for insert
    to authenticated
    with check (
        exists (
            select 1 from public.orders o
            where o.id = payment_events.order_id
              and (
                  (
                      o.customer_id = auth.uid()
                      and payment_events.to_status in ('unpaid', 'awaiting_verification')
                  )
                  or o.provider_id = auth.uid()
                  or exists (
                      select 1 from public.profiles p
                      where p.id = auth.uid() and p.role = 'admin'
                  )
              )
        )
    );
