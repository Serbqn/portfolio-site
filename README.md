# Serb Portfolio

A UI/UX designer portfolio built with Next.js + Tailwind, designed in Open Design. Content is stored in **Supabase** (Postgres + Auth) and images in **Vercel Blob**, with a password-protected CMS admin at `/admin`.

## Stack

- Next.js 15 (App Router) + TypeScript (strict)
- Tailwind CSS (custom `surface` dark palette + emerald `accent`)
- Supabase — Postgres content store (`site`, `projects`, `messages`) + Supabase Auth (email/password for `/admin`)
- Vercel Blob — image uploads from the admin
- `react-markdown` — case-study markdown rendering
- `motion` (Framer Motion) — scroll reveals
- Inter + JetBrains Mono (via `next/font`)
- Deploy: Vercel

## Getting started

```bash
pnpm install
cp .env.local.example .env.local
# Fill in the 4 required env vars (see below)
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Required env vars

| Variable | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API (anon/public key) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API (service role — server-only, never expose) |
| `BLOB_READ_WRITE_TOKEN` | Vercel dashboard → Storage → Blob → your store |

Optional: `NEXT_PUBLIC_SITE_URL` (used for sitemap/robots/metadata; defaults to `https://serb.design`).

## Database setup

1. Create a Supabase project.
2. Run the migrations in order against the SQL editor:

   - `supabase/migrations/001_schema.sql` — `site`, `projects`, `messages` tables + RLS
   - `supabase/migrations/002_storage_policies.sql` — **unused** (uploads go to Vercel Blob, not Supabase Storage)
   - `supabase/migrations/003_messages.sql` — contact form `messages` table + RLS

3. Seed content from the local `content/` folder:

   ```bash
   npx tsx --env-file=.env.local supabase/seed.ts
   ```

4. Create an admin user in Supabase Auth (Dashboard → Authentication → Users → Add user). Sign in at `/admin` with that email/password.

## Project structure

- `content/` — legacy file-based content (site copy, projects). Seeded into Supabase; kept as the source for re-seeding.
- `design-systems/serb-portfolio/DESIGN.md` — brand tokens. Source of truth.
- `src/app/` — Next.js App Router pages.
- `src/app/admin/` — CMS admin (login, dashboard, project/site editors) + API routes.
- `src/lib/` — Supabase clients, content helpers (cached), auth.
- `src/components/` — UI components.
- `supabase/` — schema migrations + seed script.

## Editing content

**With admin** (recommended): visit `/admin`, sign in with your Supabase Auth user, and edit site copy or projects. Images upload to Vercel Blob; changes are cached with `revalidateTag` and reflected immediately.

**Without admin** (commit-driven): edit the JSON / markdown files in `content/`, re-run the seed script, and push. Vercel rebuilds automatically.

## Deploy

1. Push to GitHub.
2. Import in Vercel, framework preset = Next.js.
3. Add env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `BLOB_READ_WRITE_TOKEN`.
4. Deploy.

## Reference

This project's design tokens live in `design-systems/serb-portfolio/DESIGN.md` and follow the 9-section Open Design schema (color · typography · spacing · layout · components · motion · voice · brand · anti-patterns).
