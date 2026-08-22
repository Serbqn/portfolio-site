import type { NextRequest } from "next/server";
import sharp from "sharp";
import { getSite } from "@/lib/content";
import { buildFaviconSvg } from "@/lib/favicon";

/**
 * PNG favicon rendered from the admin-configured logo — Safari and
 * iOS don't support SVG favicons, so metadata points at this route
 * (e.g. /api/favicon/png?size=180 for apple-touch-icon).
 */

const MIN = 16;
const MAX = 512;
const DEFAULT = 180;

export async function GET(req: NextRequest) {
  const raw = Number(req.nextUrl.searchParams.get("size"));
  const size = Number.isFinite(raw)
    ? Math.min(MAX, Math.max(MIN, Math.round(raw)))
    : DEFAULT;

  const site = await getSite();
  const svg = buildFaviconSvg(site, size);
  const png = await sharp(Buffer.from(svg)).png().toBuffer();

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=600, stale-while-revalidate=86400",
    },
  });
}
