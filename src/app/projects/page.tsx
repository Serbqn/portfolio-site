import type { Metadata } from "next";
import { ProjectsExplorer } from "@/components/projects/ProjectsExplorer";
import { getProjectsFull, getSite } from "@/lib/content";
import { PROJECTS_PAGE_DEFAULT } from "@/lib/types";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Selected case studies in fintech, dev tools, and B2B SaaS — interface design for products where the work is in the details.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
  // Site copy is editable from the admin panel; a missing field (legacy
  // rows) or a DB hiccup falls back to the original hardcoded text.
  const [site, projects] = await Promise.all([
    getSite().catch(() => null),
    getProjectsFull(),
  ]);
  const copy = site?.projectsPage ?? PROJECTS_PAGE_DEFAULT;

  return (
    <section aria-label="Projects">
      <h1 className="sr-only">{copy.title}</h1>
      <ProjectsExplorer projects={projects} />
    </section>
  );
}
