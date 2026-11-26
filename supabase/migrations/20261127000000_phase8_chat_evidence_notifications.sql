-- ==============================================================================
-- Titipin - Phase 8: Order Chat, Evidence Attachments & Notifications
-- ==============================================================================

-- 1. Create order_messages table (order-scoped chat + system timeline messages)
create table if not exists public.order_messages (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references public.orders(id) on delete cascade,
    sender_id uuid references public.profiles(id) on delete set null,
    sender_role text not null check (sender_role in ('customer', 'provider', 'admin', 'system')),
    message text not null,
    is_system boolean not null default false,
    created_at timestamptz not null default now()
);

-- 2. Create order_attachments table (receipts, delivery proofs, chat images)
create table if not exists public.order_attachments (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references public.orders(id) on delete cascade,
    uploader_id uuid not null references public.profiles(id) on delete cascade,
    attachment_type text not null check (attachment_type in ('receipt', 'delivery_proof', 'chat_image')),
    file_path text not null,
    file_name text not null,
    mime_type text not null,
    file_size integer not null check (file_size > 0 and file_size <= 5242880),
    note text,
    created_at timestamptz not null default now()
);

-- 3. Create notifications table
create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    order_id uuid references public.orders(id) on delete cascade,
    title text not null,
    body text not null,
    type text not null default 'order_update' check (type in ('order_update', 'chat_message', 'evidence_uploaded', 'system')),
    is_read boolean not null default false,
    created_at timestamptz not null default now()
);

-- 4. Indexes for fast queries
create index if not exists idx_order_messages_order on public.order_messages(order_id, created_at asc);
create index if not exists idx_order_attachments_order on public.order_attachments(order_id, created_at desc);
create index if not exists idx_notifications_user_unread on public.notifications(user_id, is_read, created_at desc);

-- 5. Enable Row Level Security (RLS)
alter table public.order_messages enable row level security;
alter table public.order_attachments enable row level security;
alter table public.notifications enable row level security;

-- 6. RLS Policies for order_messages
drop policy if exists "Participants can view order messages" on public.order_messages;
create policy "Participants can view order messages"
    on public.order_messages
    for select
    to authenticated
    using (
        exists (
            select 1 from public.orders o
            where o.id = order_messages.order_id
            and (
                o.customer_id = auth.uid()
                or o.provider_id = auth.uid()
                or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
            )
        )
    );

drop policy if exists "Participants can send order messages" on public.order_messages;
create policy "Participants can send order messages"
    on public.order_messages
    for insert
    to authenticated
    with check (
        (sender_id = auth.uid() or is_system = true)
        and exists (
            select 1 from public.orders o
            where o.id = order_messages.order_id
            and (
                o.customer_id = auth.uid()
                or o.provider_id = auth.uid()
                or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
            )
        )
    );

-- 7. RLS Policies for order_attachments
drop policy if exists "Participants can view order attachments" on public.order_attachments;
create policy "Participants can view order attachments"
    on public.order_attachments
    for select
    to authenticated
    using (
        exists (
            select 1 from public.orders o
            where o.id = order_attachments.order_id
            and (
                o.customer_id = auth.uid()
                or o.provider_id = auth.uid()
                or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
            )
        )
    );

drop policy if exists "Participants can upload order attachments" on public.order_attachments;
create policy "Participants can upload order attachments"
    on public.order_attachments
    for insert
    to authenticated
    with check (
        uploader_id = auth.uid()
        and exists (
            select 1 from public.orders o
            where o.id = order_attachments.order_id
            and (
                o.customer_id = auth.uid()
                or o.provider_id = auth.uid()
                or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
            )
        )
    );

-- 8. RLS Policies for notifications
drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
    on public.notifications
    for select
    to authenticated
    using (user_id = auth.uid());

drop policy if exists "Users can update own notifications" on public.notifications;
create policy "Users can update own notifications"
    on public.notifications
    for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

drop policy if exists "Authenticated users can create notifications" on public.notifications;
create policy "Authenticated users can create notifications"
    on public.notifications
    for insert
    to authenticated
    with check (true);

-- 9. Private Storage Bucket for order evidence (receipts & delivery proofs)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'order-evidence',
    'order-evidence',
    false,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
    public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

-- Storage RLS policies for order-evidence bucket
drop policy if exists "Authenticated users can upload order evidence" on storage.objects;
create policy "Authenticated users can upload order evidence"
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'order-evidence');

drop policy if exists "Authenticated users can view order evidence" on storage.objects;
create policy "Authenticated users can view order evidence"
    on storage.objects
    for select
    to authenticated
    using (bucket_id = 'order-evidence');
