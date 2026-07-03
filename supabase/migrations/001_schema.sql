-- ============================================================================
-- Serb Portfolio — Supabase Schema Migration v1
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/pzoohyswoxmqtrazjxim/sql
-- ============================================================================

-- 1. Site content table (singleton — one row only)
create table if not exists site (
  id int primary key default 1 check (id = 1), -- enforce singleton
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Enable RLS but allow service_role full access; anon reads only
alter table site enable row level security;

create policy "anon_can_read_site"
  on site for select
  using (true);

create policy "service_role_can_manage_site"
  on site for all
  using (true)
  with check (true);

-- Seed the site row with current content from content/site.json
-- (We'll insert via the API later; here's a placeholder)
insert into site (id, content) values (1, '{}'::jsonb)
on conflict (id) do nothing;

-- --------------------------------------------------------------------------
-- 2. Projects table
create table if not exists projects (
  slug text primary key,
  meta jsonb not null default '{}'::jsonb,
  content_md text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table projects enable row level security;

create policy "anon_can_read_projects"
  on projects for select
  using (true);

create policy "service_role_can_manage_projects"
  on projects for all
  using (true)
  with check (true);

-- Index for featured sorting
create index if not exists idx_projects_featured
  on projects (((meta ->> 'featured')::boolean))
  where (meta ->> 'featured')::boolean = true;

-- --------------------------------------------------------------------------
-- 3. Helper: updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_site_updated_at
  before update on site
  for each row execute function update_updated_at();

create trigger trg_projects_updated_at
  before update on projects
  for each row execute function update_updated_at();