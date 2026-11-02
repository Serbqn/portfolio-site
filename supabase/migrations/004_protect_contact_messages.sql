-- Deploy the verified /api/contact handler before applying this migration.
-- Public inserts would let bots bypass Turnstile via Supabase's REST API.
-- service_role bypasses RLS and continues to serve the contact API/admin inbox.
begin;

alter table public.messages enable row level security;

drop policy if exists "anon_can_insert_messages" on public.messages;
-- These legacy policies did not specify TO service_role, so they were public.
drop policy if exists "service_role_can_read_messages" on public.messages;
drop policy if exists "service_role_can_delete_messages" on public.messages;

revoke all on table public.messages from public, anon, authenticated;
grant select, insert, update, delete on table public.messages to service_role;

commit;
