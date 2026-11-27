-- ==============================================================================
-- Titipin - Phase 11: Admin Dashboard, Disputes/Reports & Audit Logs
-- ==============================================================================

-- 1. Create disputes table (report/dispute foundation)
create table if not exists public.disputes (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references public.orders(id) on delete cascade,
    reporter_id uuid not null references public.profiles(id) on delete cascade,
    reporter_role text not null check (reporter_role in ('customer', 'provider', 'admin')),
    reason text not null,
    description text not null,
    status text not null default 'open' check (status in ('open', 'investigating', 'resolved', 'dismissed')),
    resolution_note text,
    resolved_by uuid references public.profiles(id) on delete set null,
    resolved_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 2. Create audit_logs table (append-only admin & moderation audit trail)
create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    actor_id uuid references public.profiles(id) on delete set null,
    actor_role text not null,
    action text not null,
    target_type text not null,
    target_id text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

-- 3. Indexes
create index if not exists idx_disputes_order on public.disputes(order_id);
create index if not exists idx_disputes_status_created on public.disputes(status, created_at desc);
create index if not exists idx_disputes_reporter on public.disputes(reporter_id);
create index if not exists idx_audit_logs_created on public.audit_logs(created_at desc);
create index if not exists idx_audit_logs_actor on public.audit_logs(actor_id);
create index if not exists idx_audit_logs_target on public.audit_logs(target_type, target_id);

-- 4. Enable RLS
alter table public.disputes enable row level security;
alter table public.audit_logs enable row level security;

-- 5. RLS Policies for disputes
drop policy if exists "Order participants and admins can view disputes" on public.disputes;
create policy "Order participants and admins can view disputes"
    on public.disputes
    for select
    to authenticated
    using (
        reporter_id = auth.uid()
        or exists (
            select 1 from public.orders o
            where o.id = disputes.order_id
              and (o.customer_id = auth.uid() or o.provider_id = auth.uid())
        )
        or exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
        )
    );

drop policy if exists "Order participants can file disputes" on public.disputes;
create policy "Order participants can file disputes"
    on public.disputes
    for insert
    to authenticated
    with check (
        reporter_id = auth.uid()
        and (
            exists (
                select 1 from public.orders o
                where o.id = disputes.order_id
                  and (o.customer_id = auth.uid() or o.provider_id = auth.uid())
            )
            or exists (
                select 1 from public.profiles p
                where p.id = auth.uid() and p.role = 'admin'
            )
        )
    );

drop policy if exists "Only admins can update disputes" on public.disputes;
create policy "Only admins can update disputes"
    on public.disputes
    for update
    to authenticated
    using (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
        )
    )
    with check (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
        )
    );

-- 6. RLS Policies for audit_logs
drop policy if exists "Only admins can view audit logs" on public.audit_logs;
create policy "Only admins can view audit logs"
    on public.audit_logs
    for select
    to authenticated
    using (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
        )
    );

drop policy if exists "Only admins can insert audit logs" on public.audit_logs;
create policy "Only admins can insert audit logs"
    on public.audit_logs
    for insert
    to authenticated
    with check (
        exists (
            select 1 from public.profiles p
            where p.id = auth.uid() and p.role = 'admin'
        )
    );
