/**
 * Seed script: migrates existing file-based content to Supabase.
 * Run once: npx tsx --env-file=.env.local supabase/seed.ts
 */
import { createClient } from "@supabase/supabase-js";
import { promises as fs } from "node:fs";
import path from "node:path";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content");
const PROJECTS_DIR = path.join(CONTENT_DIR, "projects");

async function main() {
  // 1. Seed site
  const siteRaw = await fs.readFile(path.join(CONTENT_DIR, "site.json"), "utf8");
  const siteContent = JSON.parse(siteRaw);
  const { error: siteErr } = await supabase
    .from("site")
    .upsert({ id: 1, content: siteContent });
  if (siteErr) {
    console.error("Failed to seed site:", siteErr.message);
  } else {
    console.log("✅ Site seeded.");
  }

  // 2. Seed projects
  const projectsRaw = await fs.readFile(path.join(CONTENT_DIR, "projects.json"), "utf8");
  const projectsList = JSON.parse(projectsRaw) as { slug: string }[];

  for (const p of projectsList) {
    const slug = p.slug;
    const metaPath = path.join(PROJECTS_DIR, slug, "meta.json");
    const contentPath = path.join(PROJECTS_DIR, slug, "content.md");

    let meta: unknown;
    let contentMd = "";
    try {
      meta = JSON.parse(await fs.readFile(metaPath, "utf8"));
    } catch {
      console.warn(`⚠️  Skipping ${slug}: no meta.json`);
      continue;
    }
    try {
      contentMd = await fs.readFile(contentPath, "utf8");
    } catch {
      // content.md is optional
    }

    const { error } = await supabase.from("projects").upsert({
      slug,
      meta,
      content_md: contentMd,
    });
    if (error) {
      console.error(`❌ Failed to seed project ${slug}:`, error.message);
    } else {
      console.log(`✅ Project seeded: ${slug}`);
    }
  }

  console.log("\n🎉 Seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});