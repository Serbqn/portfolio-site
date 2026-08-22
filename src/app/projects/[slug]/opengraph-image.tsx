import { ImageResponse } from "next/og";
import { getProjectBySlug, getSite } from "@/lib/content";

/**
 * Per-project social share card — renders title / client / year / tags as a
 * PNG (SVG covers can't be used as og:image). Falls back to a generic card
 * when the slug doesn't resolve.
 */

export const alt = "Project case study";
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

export default async function ProjectOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [project, site] = await Promise.all([
    getProjectBySlug(slug),
    getSite(),
  ]);

  const eyebrow = project
    ? `${project.year} · ${project.client}`
    : site.site.role;
  const title = project?.title ?? site.site.name;
  // Long titles get a smaller size so they stay on ~2 lines.
  const titleSize = title.length > 24 ? 84 : 108;
  const tags = (project?.tags ?? []).slice(0, 3);

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
        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 48,
              height: 4,
              backgroundColor: ACCENT,
              display: "flex",
            }}
          />
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: ACCENT,
            }}
          >
            {eyebrow}
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: titleSize,
            fontWeight: 700,
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            maxWidth: 1040,
          }}
        >
          {title}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", fontSize: 28, color: MUTED }}>
            {site.site.name} — {site.site.role}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {tags.map((tag) => (
              <div
                key={tag}
                style={{
                  display: "flex",
                  padding: "10px 22px",
                  borderRadius: 9999,
                  border: "1px solid #2e2823",
                  fontSize: 22,
                  color: MUTED,
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
