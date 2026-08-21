# Serb Portfolio — DESIGN.md

> Brand tokens for the personal portfolio of **Serbay "Serb" Sivrikaya**, Design Engineer.
> Identity: **"Ember"** — warm charcoal canvas, tangerine accent, oversized kinetic type,
> spatial project canvas. Dark-mode-native, but nothing like the old Supabase-emerald look.
> Source of truth for renders. Mirror changes into `tailwind.config.ts` and `src/app/globals.css`.

---

## 1. Color

**Palette intent**: warm dark. The canvas is a charcoal pulled toward ember-brown
(`#141110`), never neutral gray and never blue-black. Depth comes from a warm border
hierarchy (`#241F1C` → `#2E2823` → `#3A332D` → `#4A4038`), not shadows. Text is warm
cream (`#F5EFE6`) over a muted clay scale. One hot accent: tangerine `#FF6B35` for
interaction, amber `#FFB86A` reserved for brand marks and highlights.

| Token | Hex | Use |
| --- | --- | --- |
| `surface.950` | `#0e0c0b` | Deepest surface — lightbox backdrop, primary button bg |
| `surface.900` | `#141110` | Page background |
| `surface.800` | `#1c1815` | Raised card bg, section band |
| `surface.700` | `#2e2823` | Card border, divider |
| `surface.600` | `#3a332d` | Strong border, button border |
| `surface.500` | `#4a4038` | Hover border |
| `surface.400` | `#6e655a` | Eyebrow, meta text |
| `surface.300` | `#94897c` | Body secondary text |
| `surface.200` | `#c4b8ab` | Muted text, links resting |
| `surface.100` | `#d9cec0` | Secondary link hover |
| `surface.50` | `#ede5da` | Subtle surface on dark |
| `surface.0` | `#f5efe6` | Primary text, button text |
| `accent.400` | `#ffb86a` | Amber — logo mark, highlights, bar fills |
| `accent.500` | `#ff6b35` | Tangerine — links, CTAs, focus ring |
| `accent.600` | `rgba(255, 107, 53, 0.35)` | Accent border, glow rings |

**Contrast**: `#f5efe6` on `#141110` ≈ 16.5:1 (AAA). `#ff6b35` on `#141110` ≈ 6.6:1 (AA).
`#ffb86a` on `#0e0c0b` ≈ 10:1 (AAA). Never place amber text on tangerine fills.

---

## 2. Typography

| Role | Family | Weight | Size (desktop) | Line height |
| --- | --- | --- | --- | --- |
| Display 1 | Geist | 500 | clamp(3rem, 6.5vw, 5.5rem) | 0.98 |
| Display 2 | Geist | 500 | clamp(2.25rem, 4.5vw, 3.75rem) | 1.05 |
| Display 3 | Geist | 500 | clamp(1.75rem, 3vw, 2.5rem) | 1.15 |
| Body L | Geist | 400 | 1.125rem | 1.56 |
| Body | Geist | 400 | 1rem | 1.50 |
| Body S | Geist | 400 | 0.875rem | 1.43 |
| Eyebrow | JetBrains Mono | 400 | 0.75rem (uppercase, +1.2px) | 1.33 |
| Code | JetBrains Mono | 400 | 0.875rem | 1.55 |

**Pairing**: Geist for everything user-facing; JetBrains Mono for eyebrows, meta tags,
and data. Never a third family.

**Weight restraint**: 400 everywhere except display headings and nav/button labels at
500. No 700+. Hierarchy comes from size and warmth of color, not weight.

---

## 3. Spacing

8px base unit. Use only these values:

| Token | px | Use |
| --- | --- | --- |
| `1` | 4 | Tight icon gap |
| `2` | 8 | Icon-to-label gap, button padding-y |
| `3` | 12 | Inline tag padding |
| `4` | 16 | Card padding, form field gap |
| `6` | 24 | Section inner gap |
| `8` | 32 | Button padding-x, component gap |
| `10` | 40 | Medium section gap |
| `12` | 48 | Large component block gap |
| `16` | 64 | Section padding (default) |
| `24` | 96 | Section padding (large) |
| `32` | 128 | Hero section padding |

---

## 4. Layout

- **Grid**: 12 columns, 1280px max-width, 24px gutter, 24px outer padding.
- **Breakpoints**: Tailwind defaults — 640 (sm) · 768 (md) · 1024 (lg) · 1280 (xl) · 1536 (2xl). Mobile-first.
- **Container**: `container-wide` (`max-w-wide mx-auto px-6`).
- **Prose width**: `max-w-prose` (65ch) for long-form case-study copy.
- **Spatial canvas** (projects index): desktop ≥1024px gets a draggable/zoomable field;
  below that it collapses to a stacked list. Canvas transform-only (no layout thrash).

---

## 5. Components

| Component | Spec |
| --- | --- |
| **Button / Primary** | `bg-accent-500 text-surface-950 px-4 h-10 rounded-lg font-medium hover:bg-accent-400 transition-colors duration-150` |
| **Button / Secondary** | `border border-surface-600 bg-transparent text-surface-0 px-4 h-10 rounded-lg font-medium hover:border-surface-500 hover:bg-surface-800 transition-all duration-150` |
| **Button / Ghost** | `bg-transparent text-surface-200 px-2 h-8 rounded-md border border-transparent hover:text-surface-0 transition-colors duration-150` |
| **Card** | `bg-surface-800 border border-surface-700 rounded-2xl p-6 hover:border-surface-500 transition-colors duration-300` |
| **Canvas card** | Same as Card plus `hover:-translate-y-1 hover:shadow-[0_12px_32px_-12px_rgba(0,0,0,0.6)]` while dragging disabled under reduced motion |
| **Badge** | `inline-flex items-center rounded-full bg-surface-700/60 px-2.5 py-0.5 text-xs font-medium text-surface-200` |
| **Badge / Accent** | Same as Badge, but `text-accent-400` |
| **Input** | `h-10 px-3 border border-surface-600 rounded-lg bg-surface-900 text-surface-0 placeholder:text-surface-400 focus:border-accent-500 outline-none transition` |
| **Nav link** | `text-sm text-surface-300 hover:text-surface-0 transition-colors` |
| **Filter chip** | `rounded-full border px-3 py-1.5 text-xs font-medium` — active: `border-accent-500 bg-accent-500 text-surface-950`; idle: `border-surface-600 text-surface-200 hover:border-surface-500` |

---

## 6. Motion

| Token | Value | Use |
| --- | --- | --- |
| `duration.hover` | 150ms | Hover, focus, color transitions |
| `duration.reveal` | 380ms | Fade/slide-in on scroll, page enter |
| `ease.out-soft` | `cubic-bezier(0.22, 1, 0.36, 1)` | Default for reveals and hovers |
| `spring.ui` | stiffness 320, damping 28 | Lifts, chips, arrows |
| `spring.canvas` | stiffness 200, damping 26, mass 0.8 | Draggable cards, frames |

- All hover transitions ≤ 150ms; reveal transitions ≤ 380ms; springs for anything physical.
- Respect `prefers-reduced-motion`: disable transforms/drag, shorten durations to 0ms.
- No carousels, no parallax beyond the hero grid drift, no auto-playing animation.

---

## 7. Voice & Tone

- **Voice**: confident, concise, first-person. "I design interfaces that make complex products feel simple."
- **Tense**: present for what you do; past for case-study results.
- **Sentence length**: average 12–18 words. Break long sentences.
- **Punctuation**: Oxford comma; em-dash for asides; never semicolons in body copy.
- **Forbidden words**: "synergy", "leverage", "best-in-class", "world-class", "passionate", "guru", "ninja", "rockstar".

---

## 8. Brand

- **Name**: Serbay Sivrikaya ("Serb")
- **One-liner**: Design engineer focused on product clarity.
- **About (1 sentence)**: I design interfaces for products where the work is in the details — fintech, dev tools, and B2B SaaS.
- **Logomark**: a 28×28 monogram set in Geist 500, amber (`#ffb86a`) on dark backgrounds.
- **Texture**: optional paper-grain overlay at ≤3% opacity to break flat black. Never above 4%.
- **Tone attribute**: technical, not flashy. Warm, not cozy. Kinetic, not noisy.

---

## 9. Anti-patterns

Never:

- Use a stock-photo avatar.
- Use a carousel for project thumbnails.
- Use a hamburger menu on desktop.
- Use a modal for the contact form.
- Use a light background — this is a dark-mode-native brand.
- Use cool/blue grays anywhere — every gray leans warm.
- Use the old emerald `#3ecf8e` / `#00c573` in any form.
- Use a Lorem Ipsum string anywhere in the live site.
- Add a cookie banner unless legally required.
- Add a "Made with …" badge in the footer.
- Animate text on scroll (staggered entrance on load is fine).
- Use emoji in copy.
- Use bold (700) font weight — hierarchy is size-driven.
