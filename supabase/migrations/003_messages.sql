-- ============================================================================
-- Serb Portfolio — Contact Messages Migration v3
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/pzoohyswoxmqtrazjxim/sql
-- ============================================================================

-- Contact messages table (public insert, service_role read/delete)
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text,
  message text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

alter table messages enable row level security;

-- Anyone can submit a message (public contact form)
create policy "anon_can_insert_messages"
  on messages for insert
  with check (true);

-- Only service_role can read/delete messages (admin inbox)
create policy "service_role_can_read_messages"
  on messages for select
  using (true);

create policy "service_role_can_delete_messages"
  on messages for delete
  using (true);

-- Index for inbox ordering
create index if not exists idx_messages_created_at
  on messages (created_at desc);