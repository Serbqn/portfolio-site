import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Default brand mark (three lines) used when no logo is configured. */
export const DEFAULT_LOGO = {
  d: "M9 11h14M9 16h10M9 21h14",
  viewBox: "0 0 32 32",
} as const;

/**
 * Resolve the admin-configured logo into drawable path data. Accepts
 * either a bare path `d` string or a full `<svg>`/`<path>` snippet pasted
 * from an editor — in that case the first path `d` and the viewBox are
 * extracted. Falls back to the default mark when nothing usable is found.
 */
export function resolveLogo(
  raw: string | null | undefined,
): { d: string; viewBox: string } {
  const trimmed = raw?.trim();
  if (!trimmed) return DEFAULT_LOGO;
  if (trimmed.startsWith("<")) {
    const d =
      trimmed.match(/\bd\s*=\s*"([^"]+)"/)?.[1] ??
      trimmed.match(/\bd\s*=\s*'([^']+)'/)?.[1];
    if (!d) return DEFAULT_LOGO;
    const viewBox =
      trimmed.match(/viewBox\s*=\s*"([^"]+)"/i)?.[1] ?? DEFAULT_LOGO.viewBox;
    return { d, viewBox };
  }
  return { d: trimmed, viewBox: DEFAULT_LOGO.viewBox };
}

/**
 * Normalize an admin-entered external URL into a safe href.
 * Empty stays empty; bare domains get an https:// prefix; internal paths
 * (leading "/") pass through untouched. Only http/https/mailto schemes are
 * allowed through verbatim — anything else gets coerced to https:// so a
 * stray "javascript:" can never end up in an href.
 */
export function normalizeExternalUrl(raw: string | null | undefined): string {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("/")) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

/** Pretty host for display ("https://a.b/c" → "a.b"); falls back to the raw
 * input when it can't be parsed as a URL. */
export function urlHost(raw: string): string {
  try {
    return new URL(normalizeExternalUrl(raw)).hostname || raw;
  } catch {
    return raw;
  }
}
