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
    // snap-start: beat one of the /projects scroll story (intro → canvas).
    // pb-0: no tail after the stage — the canvas is the hard bottom.
    <section className="container-wide section snap-start pb-0">
      <header className="max-w-3xl">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1 className="mt-2 text-display-1 font-medium tracking-tight text-balance">
          {copy.title}
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-surface-300">
          {copy.lead}
        </p>
      </header>

      <ProjectsExplorer projects={projects} />
    </section>
  );
}
