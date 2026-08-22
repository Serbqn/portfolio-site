import type { MetadataRoute } from "next";
import { getSite } from "@/lib/content";

/** PWA web app manifest — icons reuse the dynamic PNG favicon route. */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let name = "Portfolio";
  let shortName = "Portfolio";
  let description = "Product designer portfolio";

  try {
    const { site } = await getSite();
    name = `${site.name} — ${site.role}`;
    shortName = site.name;
    description = site.description;
  } catch {
    // Content store unreachable — fall back to static strings so the
    // manifest still resolves.
  }

  return {
    name,
    short_name: shortName,
    description,
    start_url: "/",
    display: "standalone",
    background_color: "#141110", // --surface-900
    theme_color: "#141110",
    icons: [
      {
        src: "/api/favicon/png?size=192",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/api/favicon/png?size=512",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
