import type { SiteContent } from "@/lib/types";
import { resolveLogo } from "@/lib/utils";

/**
 * Favicon markup shared by the SVG and PNG favicon routes.
 *
 * Mirrors the navbar brand tile: warm-charcoal rounded square with the
 * admin-configured logo mark stroked in tangerine. Accepts whatever
 * `resolveLogo` accepts — a bare path `d` string or a full <svg>/<path>
 * snippet — and falls back to the default three-line mark when nothing
 * is configured.
 */

// Attribute-safe escaping for values embedded into the SVG markup.
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

/** Brand colors — keep in sync with globals.css tokens. */
const TILE = "#0e0c0b"; // --surface-950
const MARK = "#ffb86a"; // --accent-400

export function buildFaviconSvg(site: SiteContent, size?: number): string {
  const { d, viewBox } = resolveLogo(site.site.logo);
  // When rasterizing, pin width/height so sharp renders at full target
  // resolution from the vector data instead of upscaling a 32px bitmap.
  const dims = size ? ` width="${size}" height="${size}"` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"${dims}><rect width="32" height="32" rx="7" fill="${TILE}"/><svg x="4" y="4" width="24" height="24" viewBox="${esc(viewBox)}" preserveAspectRatio="xMidYMid meet"><path d="${esc(d)}" fill="none" stroke="${MARK}" stroke-width="2.4" stroke-linecap="round"/></svg></svg>`;
}
