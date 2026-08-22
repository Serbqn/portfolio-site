import { ImageResponse } from "next/og";
import { getSite } from "@/lib/content";
import { buildFaviconSvg } from "@/lib/favicon";

/**
 * Default social share card — applies to every route that doesn't define
 * its own opengraph-image. Next serves it at /opengraph-image and injects
 * og:image / twitter:image automatically.
 */

export const alt = "Serb — product designer portfolio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Edge runtime: the Node build of @vercel/og resolves its bundled
// fonts/wasm with file URLs that break on Windows (Invalid URL at import).
export const runtime = "edge";

// Brand tokens — keep in sync with globals.css.
const BG = "#141110"; // --surface-900
const TEXT = "#f5efe6"; // --text-primary
const MUTED = "#94897c"; // --text-tertiary
const ACCENT = "#ffb86a"; // --accent-400

export default async function OpenGraphImage() {
  const content = await getSite();
  const { site, hero } = content;

  // Reuse the admin-configured logo mark as a data URI so the card always
  // matches the navbar/favicon branding.
  const mark = `data:image/svg+xml,${encodeURIComponent(
    buildFaviconSvg(content),
  )}`;
  const domain = new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.serb.work",
  ).host;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          backgroundColor: BG,
          backgroundImage:
            "radial-gradient(circle at 18% 0%, rgba(255, 107, 53, 0.16), transparent 55%)",
          color: TEXT,
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mark}
            width={64}
            height={64}
            alt=""
            style={{ borderRadius: 16 }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 34, fontWeight: 600 }}>{site.name}</div>
            <div style={{ fontSize: 24, color: MUTED }}>{site.role}</div>
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: "-0.02em",
            maxWidth: 1040,
          }}
        >
          {hero.headline}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 9999,
                backgroundColor: ACCENT,
              }}
            />
            <div style={{ fontSize: 26, color: MUTED }}>
              {site.availability}
            </div>
          </div>
          <div style={{ fontSize: 26, color: MUTED }}>{domain}</div>
        </div>
      </div>
    ),
    size,
  );
}
