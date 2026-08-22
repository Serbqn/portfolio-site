import { getSite } from "@/lib/content";
import { buildFaviconSvg } from "@/lib/favicon";

/**
 * Dynamic SVG favicon built from the admin-configured logo (site.logo).
 * PNG variants for Safari/iOS live at /api/favicon/png?size=N.
 */

export async function GET() {
  const site = await getSite();
  return new Response(buildFaviconSvg(site), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=600, stale-while-revalidate=86400",
    },
  });
}
