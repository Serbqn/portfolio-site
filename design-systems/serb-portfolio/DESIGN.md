# Serb Portfolio — DESIGN.md

> Brand tokens for the personal portfolio of **Serb**, a UI/UX designer.
> Inspired by Supabase — dark-mode-native, emerald accent, border-driven depth.
> Source of truth for Open Design.md for Open Design renders. Mirror changes into `tailwind.config.ts` and `src/app/globals.css`.

---

## 1. Color

**Palette intent**: dark-mode-native. Near-black canvas (`#171717`) with emerald green accents (`#3ecf8e`, `#00c573`). Depth comes from a border hierarchy (`#242424` → `#2e2e2e` → `#363636` → `#393939`), not shadows. Text is near-white (`#fafafa`) with a muted gray scale for secondary/tertiary copy.

| Token | Hex | Use |
| --- | --- | --- |
| `surface.950` | `#0f0f0f` | Deepest surface, primary button bg |
| `surface.900` | `#171717` | Page background, card bg |
| `surface.800` | `#242424` | Subtle divider, section hr |
| `surface.700` | `#2e2e2e` | Card border, tab border |
| `surface.600` | `#363636` | Button border, secondary divider |
| `surface.500` | `#393939` | Secondary border |
| `surface.400` | `#434343` | Tertiary border |
| `surface.300` | `#4d4d4d` | Heavy secondary text |
| `surface.200` | `#898989` | Muted text, tertiary links |
| `surface.100` | `#b4b4b4` | Secondary link text |
| `surface.50` | `#efefef` | Light border, subtle surface |
| `surface.0` | `#fafafa` | Primary text, button text |
| `accent.400` | `#3ecf8e` | Brand green — logo, accent borders |
| `accent.500` | `#00c573` | Interactive green — links, CTAs |
| `accent.600` | `rgba(62, 207, 142, 0.3)` | Green border accent |

**Contrast**: `#fafafa` on `#171717` = 15.3:1 (AAA). `#00c573` on `#171717` = 5.1:1 (AA) — safe for links. `#3ecf8e` on `#0f0f0f` = 5.8:1 (AA) — safe for logo marks.

---

## 2. Typography

| Role | Family | Weight | Size (desktop) | Line height |
| --- | --- | --- | --- | --- |
| Display 1 | Inter | 400 | clamp(2.75rem, 5.5vw, 4.5rem) | 1.00 |
| Display 2 | Inter | 400 | clamp(2.25rem, 4vw, 3.5rem) | 1.10 |
| Display 3 | Inter | 400 | clamp(1.75rem, 3vw, 2.5rem) | 1.15 |
| Body L | Inter | 400 | 1.125rem | 1.56 |
| Body | Inter | 400 | 1rem | 1.50 |
| Body S | Inter | 400 | 0.875rem | 1.43 |
| Eyebrow | JetBrains Mono | 400 | 0.75rem (uppercase, +1.2px) | 1.33 |
| Code | JetBrains Mono | 400 | 0.875rem | 1.55 |

**Pairing**: Inter for everything user-facing (replaces Circular); JetBrains Mono for the eyebrow label, code blocks, and small data tags. Never use a third family.

**Weight restraint**: Nearly all text uses weight 400. Weight 500 appears only for navigation links and button labels. No bold (700) — hierarchy is created through size, not weight.

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
- **Breakpoints**: 600px (mobile → desktop). Single breakpoint, mobile-first.
- **Container**: `max-w-wide mx-auto px-6`.
- **Prose width**: `max-w-prose` (65ch) for long-form case-study copy.

---

## 5. Components

| Component | Spec |
| --- | --- |
| **Button / Primary** | `bg-surface-950 text-surface-0 px-8 h-10 rounded-full font-medium border border-surface-0 hover:bg-surface-800 transition-colors duration-150` |
| **Button / Secondary** | `bg-surface-950 text-surface-0 px-8 h-10 rounded-full font-medium border border-surface-700 hover:border-surface-500 opacity-80 transition-all duration-150` |
| **Button / Ghost** | `bg-transparent text-surface-0 px-2 h-8 rounded-md border border-transparent hover:border-surface-600 transition-all duration-150` |
| **Card** | `bg-surface-900 border border-surface-700 rounded-2xl p-6 hover:border-surface-500 transition-all duration-300` |
| **Badge** | `inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-surface-800 text-surface-100 text-xs font-medium border border-surface-700` |
| **Badge / Accent** | Same as Badge, but `border-accent-600 text-accent-400` |
| **Input** | `h-10 px-3 border border-surface-600 rounded-lg bg-surface-900 text-surface-0 focus:border-accent-500 outline-none transition` |
| **Nav link** | `text-sm text-surface-200 hover:text-surface-0 transition-colors` |

---

## 6. Motion

| Token | Value | Use |
| --- | --- | --- |
| `duration.hover` | 150ms | Hover, focus, color transitions |
| `duration.reveal` | 300ms | Fade/slide-in on scroll, page enter |
| `ease.out-soft` | `cubic-bezier(0.22, 1, 0.36, 1)` | Default for reveals and hovers |

- All hover transitions ≤ 150ms; reveal transitions ≤ 300ms.
- Respect `prefers-reduced-motion`: disable transforms and shorten durations to 0ms.
- No carousels, no parallax, no auto-playing animation.

---

## 7. Voice & Tone

- **Voice**: confident, concise, first-person. "I design interfaces that make complex products feel simple."
- **Tense**: present for what you do; past for case-study results.
- **Sentence length**: average 12–18 words. Break long sentences.
- **Punctuation**: Oxford comma; em-dash for asides; never semicolons in body copy.
- **Forbidden words**: "synergy", "leverage", "best-in-class", "world-class", "passionate", "guru", "ninja", "rockstar".

---

## 8. Brand

- **Name**: Serb
- **One-liner**: UI/UX designer focused on product clarity.
- **About (1 sentence)**: I design interfaces for products where the work is in the details — fintech, dev tools, and B2B SaaS.
- **Logomark**: a 28×28 monogram "S" set in Inter 700, emerald-colored (`#3ecf8e`) on dark backgrounds.
- **Tone attribute**: technical, not flashy. Restrained, not boring. Dark-mode confidence.

---

## 9. Anti-patterns

Never:

- Use a stock-photo avatar.
- Use a carousel for project thumbnails.
- Use a hamburger menu on desktop.
- Use a modal for the contact form.
- Use a light background — this is a dark-mode-native brand.
- Use a box-shadow for depth — use borders instead.
- Use a Lorem Ipsum string anywhere in the live site.
- Add a cookie banner unless legally required.
- Add a "Made with …" badge in the footer.
- Animate text on scroll.
- Use emoji in copy.
- Use bold (700) font weight — hierarchy is size-driven.

| Token | px | Use |
| --- | --- | --- |
| `2` | 8 | Icon-to-label gap |
| `3` | 12 | Inline tag padding |
| `4` | 16 | Form field vertical padding |
| `6` | 24 | Card padding, gutter |
| `8` | 32 | Section padding (small) |
| `12` | 48 | Component block gap |
| `16` | 64 | Section padding (default) |
| `24` | 96 | Section padding (large) |

---

## 4. Layout

- **Grid**: 12 columns, 1280px max-width, 24px gutter, 24px outer padding.
- **Breakpoints**: 640 (sm) · 768 (md) · 1024 (lg) · 1280 (xl) · 1536 (2xl).
- **Container**: `max-w-wide mx-auto px-6`.
- **Prose width**: `max-w-prose` (65ch) for long-form case-study copy.

---

## 5. Components

| Component | Spec |
| --- | --- |
| **Button / Primary** | `bg-surface-950 text-white px-4 h-10 rounded-lg font-medium hover:bg-surface-800 transition-colors duration-150` |
| **Button / Ghost** | `border border-surface-200 text-surface-900 px-4 h-10 rounded-lg font-medium hover:bg-surface-50 transition-colors duration-150` |
| **Button / Link** | `text-surface-900 underline-offset-4 hover:underline hover:text-accent-600 transition-colors` |
| **Card** | `bg-white border border-surface-200 rounded-2xl p-6 shadow-soft hover:shadow-lift hover:-translate-y-0.5 transition-all duration-300` |
| **Badge** | `inline-flex items-center gap-1.5 px-2.5 h-6 rounded-full bg-surface-100 text-surface-700 text-xs font-medium` |
| **Badge / Accent** | Same as Badge, but `bg-accent-50 text-accent-700` |
| **Input** | `h-10 px-3 border border-surface-300 rounded-lg bg-white focus:border-accent-500 focus:shadow-ring-accent outline-none transition` |
| **Nav link** | `text-sm text-surface-600 hover:text-surface-950 transition-colors` |

---

## 6. Motion

| Token | Value | Use |
| --- | --- | --- |
| `duration.hover` | 150ms | Hover, focus, color transitions |
| `duration.reveal` | 300ms | Fade/slide-in on scroll, page enter |
| `ease.out-soft` | `cubic-bezier(0.22, 1, 0.36, 1)` | Default for reveals and hovers |
| `ease.in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Modal/panel open |

- All hover transitions ≤ 150ms; reveal transitions ≤ 300ms.
- Respect `prefers-reduced-motion`: disable transforms and shorten durations to 0ms.
- No carousels, no parallax, no auto-playing animation.

---

## 7. Voice & Tone

- **Voice**: confident, concise, first-person. "I design interfaces that make complex products feel simple."
- **Tense**: present for what you do; past for case-study results.
- **Sentence length**: average 12–18 words. Break long sentences.
- **Punctuation**: Oxford comma; em-dash for asides; never semicolons in body copy.
- **Forbidden words**: "synergy", "leverage", "best-in-class", "world-class", "passionate", "guru", "ninja", "rockstar".

---

## 8. Brand

- **Name**: Serb
- **One-liner**: UI/UX designer focused on product clarity.
- **About (1 sentence)**: I design interfaces for products where the work is in the details — fintech, dev tools, and B2B SaaS.
- **Logomark**: a 28×28 monogram "S" set in Inter 700, accent-colored when on light backgrounds, white when on dark. No wordmark in the header; the wordmark appears only in the footer.
- **Tone attribute**: technical, not flashy. Restrained, not boring.

---

## 9. Anti-patterns

Never:

- Use a stock-photo avatar.
- Use a carousel for project thumbnails.
- Use a hamburger menu on desktop.
- Use a modal for the contact form.
- Use a gradient background on body or chrome.
- Use a Lorem Ipsum string anywhere in the live site.
- Add a cookie banner unless legally required.
- Add a "Made with …" badge in the footer.
- Animate text on scroll.
- Use emoji in copy.
