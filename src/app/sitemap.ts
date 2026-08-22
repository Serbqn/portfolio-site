import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/content";

/**
 * Sitemap with truthful lastModified values read from Supabase rows
 * (site.updated_at / projects.updated_at). Stamping every route with the
 * build date trains crawlers to ignore lastmod entirely.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.serb.work";

  let siteUpdatedAt: Date | undefined;
  let projectEntries: { slug: string; updatedAt: Date }[] = [];

  try {
    const { siteUpdatedAt: siteIso, projects } = await getSitemapEntries();
    siteUpdatedAt = siteIso ? new Date(siteIso) : undefined;
    projectEntries = projects.map((p) => ({
      slug: p.slug,
      updatedAt: new Date(p.updatedAt),
    }));
  } catch {
    // Content store unreachable — emit URLs without lastModified rather
    // than failing the whole sitemap or faking freshness.
  }

  const latestProjectUpdate = projectEntries.reduce<Date | undefined>(
    (max, p) => (!max || p.updatedAt > max ? p.updatedAt : max),
    undefined,
  );

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: siteUpdatedAt,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: latestProjectUpdate ?? siteUpdatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: siteUpdatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: siteUpdatedAt,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const projectRoutes: MetadataRoute.Sitemap = projectEntries.map((p) => ({
    url: `${baseUrl}/projects/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...projectRoutes];
}