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
# Fill in the required env vars (see below)
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
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare dashboard → Turnstile → widget → Sitekey (public, used at build time) |
| `TURNSTILE_SECRET_KEY` | Same widget → Secret key (server-only, never expose) |

Optional: `NEXT_PUBLIC_SITE_URL` (used for sitemap/robots/metadata; defaults to `https://www.serb.work`).

### Contact spam protection

The form uses [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/get-started/) and validates every token on the server before saving a message or scheduling a Telegram notification. Missing keys or an unavailable verification service disable form submissions; visitors can still use the direct email link.

To activate on Vercel:

1. In Cloudflare → Turnstile, create a **Managed** widget. Add `serb.work` and `www.serb.work` as allowed hostnames. The website can stay on Vercel; moving DNS to Cloudflare is not required.
2. Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` in Vercel's environment variables, then deploy this code. The public sitekey is embedded at build time, so changing it requires a new deployment. Keep the secret in server environment settings, never in client code or Git.
3. After deploying the verified contact endpoint, run `supabase/migrations/004_protect_contact_messages.sql` in Supabase's SQL editor. This disables direct anonymous/authenticated access to `messages`, closing the REST API path around CAPTCHA. The server and admin continue to use the service-role client. Existing messages are preserved.
4. Verify a real contact submission reaches the inbox. Check that a direct POST without `turnstileToken` is rejected. Protection is fully enabled only after both the deployment and SQL migration are complete.

The server accepts the `contact` action and hostnames `serb.work,www.serb.work` by default. To use another domain or a Vercel preview, set `TURNSTILE_ALLOWED_HOSTNAMES` to an explicit comma-separated hostname list and add the same hosts to the Cloudflare widget. Never use wildcards. For local widget previews, use Cloudflare's [dummy sitekeys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/); do not deploy dummy keys to production. End-to-end local submissions require a real widget configured for your development hostname and the matching server allowlist.

Run `npm run test:contact` for offline security regression tests. They mock Cloudflare, Supabase, and Telegram; no real messages are sent. Live widget configuration and the database migration must also be verified in the deployed environment.

## Database setup

1. Create a Supabase project.
2. Run the migrations in order against the SQL editor:

   - `supabase/migrations/001_schema.sql` — `site`, `projects`, `messages` tables + RLS
   - `supabase/migrations/002_storage_policies.sql` — **unused** (uploads go to Vercel Blob, not Supabase Storage)
   - `supabase/migrations/003_messages.sql` — contact form `messages` table + RLS
   - `supabase/migrations/004_protect_contact_messages.sql` — restrict messages to the verified server endpoint/admin

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
3. Add the required env vars above, including both Turnstile keys.
4. Deploy.

## Reference

This project's design tokens live in `design-systems/serb-portfolio/DESIGN.md` and follow the 9-section Open Design schema (color · typography · spacing · layout · components · motion · voice · brand · anti-patterns).
