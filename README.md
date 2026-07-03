# Serb Portfolio

A UI/UX designer portfolio built with Next.js + Tailwind, designed in Open Design.

## Stack
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- Inter + JetBrains Mono (via `next/font`)
- File-based content (`content/site.json`, `content/projects.json`, `content/projects/*/meta.json`)
- Admin route at `/admin` (JWT cookie, single-user)
- Deploy: Vercel

## Getting started

```bash
pnpm install
cp .env.local.example .env.local
# Edit .env.local: set ADMIN_PASSWORD and ADMIN_TOKEN_SECRET
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

- `content/` — all editable content (site copy, projects). Editable via `/admin`.
- `design-systems/serb-portfolio/DESIGN.md` — brand tokens. Source of truth.
- `src/app/` — Next.js App Router pages.
- `src/lib/` — content + auth helpers.
- `src/components/` — UI components.
- `open-design/` — sibling repo with the design system reference library.

## Editing content

**Without admin** (commit-driven): edit the JSON / markdown files in `content/` and push. Vercel rebuilds automatically.

**With admin** (local only): run `pnpm dev`, visit `/admin`, log in with `ADMIN_PASSWORD`. Edits write to `content/`. Commit + push to deploy.

## Deploy

1. Push to GitHub
2. Import in Vercel, framework preset = Next.js
3. Add env vars: `ADMIN_PASSWORD`, `ADMIN_TOKEN_SECRET`
4. Deploy

## Reference

This project's design tokens live in `design-systems/serb-portfolio/DESIGN.md` and follow the 9-section Open Design schema (color · typography · spacing · layout · components · motion · voice · brand · anti-patterns).
