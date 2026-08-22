import { unstable_cache, revalidateTag } from "next/cache";
import { createServiceClient } from "@/lib/supabase";
import { normalizeExternalUrl } from "@/lib/utils";
import type {
  ProjectFull,
  ProjectListItem,
  ProjectMeta,
  SiteContent,
} from "@/lib/types";

// Slug validation: kebab-case only, no traversal, no leading dot.
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,80}[a-z0-9])?$/;

export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

// ---- Site content ----

export const getSite = unstable_cache(
  async (): Promise<SiteContent> => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("site")
      .select("content")
      .eq("id", 1)
      .single();

    if (error) {
      console.error("getSite error:", error.message);
      throw new Error("Failed to fetch site content");
    }
    return data.content as SiteContent;
  },
  ["site-content"],
  { tags: ["site"], revalidate: 30 },
);

export async function updateSite(next: SiteContent): Promise<SiteContent> {
  if (!next || typeof next !== "object") {
    throw new Error("Invalid site content");
  }
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("site")
    .upsert({ id: 1, content: next });
  if (error) {
    console.error("updateSite error:", error.message);
    throw new Error("Failed to update site content");
  }
  revalidateTag("site");
  return next;
}

// ---- Projects ----

export const getProjects = unstable_cache(
  async (): Promise<ProjectListItem[]> => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("projects")
      .select("meta")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getProjects error:", error.message);
      throw new Error("Failed to fetch projects");
    }
    return (data?.map((p) => p.meta as ProjectListItem)) ?? [];
  },
  ["projects-list"],
  { tags: ["projects"], revalidate: 30 },
);

export async function getProjectSlugs(): Promise<string[]> {
  const list = await getProjects();
  return list.map((p) => p.slug);
}

/** All projects with parsed case-study sections — powers the projects-page
 * side drawer (instant open, no per-project fetch). */
export const getProjectsFull = unstable_cache(
  async (): Promise<ProjectFull[]> => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("projects")
      .select("meta, content_md")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("getProjectsFull error:", error.message);
      throw new Error("Failed to fetch projects");
    }

    return (data ?? []).map((row) => {
      const meta = row.meta as ProjectMeta;
      const sections = parseCaseStudySections(row.content_md as string);
      return {
        ...meta,
        ...sections,
        contentPath: `/admin?edit=${meta.slug}`,
      };
    });
  },
  ["projects-full"],
  { tags: ["projects"], revalidate: 30 },
);

export const getProjectBySlug = (slug: string) =>
  unstable_cache(
    async (): Promise<ProjectFull | null> => {
      if (!isValidSlug(slug)) return null;
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from("projects")
        .select("meta, content_md")
        .eq("slug", slug)
        .single();

      if (error || !data) {
        return null;
      }

      const meta = data.meta as ProjectMeta;
      const sections = parseCaseStudySections(data.content_md);

      return {
        ...meta,
        ...sections,
        contentPath: `/admin?edit=${slug}`,
      };
    },
    ["project", slug],
    { tags: ["projects"], revalidate: 30 },
  )();

function parseCaseStudySections(md: string): {
  problem: string;
  process: string;
  solution: string;
  results: string;
} {
  const fallback = {
    problem: "",
    process: "",
    solution: "",
    results: "",
  };
  if (!md) return fallback;
  const blocks = md.split(/^##\s+/m).slice(1);
  const map: Record<string, string> = {};
  for (const block of blocks) {
    const newline = block.indexOf("\n");
    if (newline === -1) continue;
    const heading = block.slice(0, newline).trim().toLowerCase();
    const body = block.slice(newline + 1).trim();
    map[heading] = body;
  }
  return {
    problem: map["problem"] ?? "",
    process: map["process"] ?? "",
    solution: map["solution"] ?? "",
    results: map["results"] ?? "",
  };
}

// ---- Project CRUD ----

export type ProjectDraft = Omit<ProjectMeta, "slug"> & {
  problem?: string;
  process?: string;
  solution?: string;
  results?: string;
};

export async function createProject(
  slug: string,
  draft: ProjectDraft,
): Promise<ProjectListItem> {
  if (!isValidSlug(slug)) {
    throw new Error("Invalid slug");
  }

  const meta: ProjectMeta = {
    slug,
    title: draft.title,
    subtitle: draft.subtitle,
    role: draft.role,
    year: draft.year,
    client: draft.client,
    link: normalizeExternalUrl(draft.link),
    tags: draft.tags ?? [],
    featured: draft.featured ?? false,
    cover: draft.cover,
    summary: draft.summary,
    metrics: draft.metrics ?? [],
    gallery: draft.gallery ?? [],
  };

  const supabase = await createServiceClient();
  const { error } = await supabase.from("projects").insert({
    slug,
    meta,
    content_md: buildCaseStudyMD(draft, meta),
  });
  if (error) {
    console.error("createProject error:", error.message);
    throw new Error("Failed to create project");
  }
  revalidateTag("projects");
  return meta;
}

export async function updateProject(
  slug: string,
  draft: ProjectDraft,
): Promise<ProjectListItem> {
  if (!isValidSlug(slug)) throw new Error("Invalid slug");

  const meta: ProjectMeta = {
    slug,
    title: draft.title,
    subtitle: draft.subtitle,
    role: draft.role,
    year: draft.year,
    client: draft.client,
    link: normalizeExternalUrl(draft.link),
    tags: draft.tags ?? [],
    featured: draft.featured ?? false,
    cover: draft.cover,
    summary: draft.summary,
    metrics: draft.metrics ?? [],
    gallery: draft.gallery ?? [],
  };

  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("projects")
    .upsert({
      slug,
      meta,
      content_md: buildCaseStudyMD(draft, meta),
    });
  if (error) {
    console.error("updateProject error:", error.message);
    throw new Error("Failed to update project");
  }
  revalidateTag("projects");
  return meta;
}

export async function deleteProject(slug: string): Promise<void> {
  if (!isValidSlug(slug)) throw new Error("Invalid slug");
  const supabase = await createServiceClient();
  const { error } = await supabase.from("projects").delete().eq("slug", slug);
  if (error) {
    console.error("deleteProject error:", error.message);
    throw new Error("Failed to delete project");
  }
  revalidateTag("projects");
}

function buildCaseStudyMD(draft: ProjectDraft, meta: ProjectMeta): string {
  const sections = [
    ["Problem", draft.problem ?? ""],
    ["Process", draft.process ?? ""],
    ["Solution", draft.solution ?? ""],
    ["Results", draft.results ?? ""],
  ] as const;

  const md: string[] = [`# ${meta.title}`, ""];
  if (meta.subtitle) {
    md.push(`*${meta.subtitle}*`, "");
  }
  for (const [h, body] of sections) {
    md.push(`## ${h}`, "", body, "");
  }
  return md.join("\n");
}
