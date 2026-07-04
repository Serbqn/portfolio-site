import type { Metadata } from "next";
import { ProjectsExplorer } from "@/components/projects/ProjectsExplorer";
import { getProjects } from "@/lib/content";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Selected case studies in fintech, dev tools, and B2B SaaS — interface design for products where the work is in the details.",
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <section className="container-wide section">
      <header className="max-w-3xl">
        <p className="eyebrow">
          <span className="eyebrow-dot" />
          Projects
        </p>
        <h1 className="mt-3 text-display-1 font-semibold tracking-tight text-balance">
          A small portfolio, picked carefully.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-surface-300">
          Most of my work is under NDA. The five below are the public ones,
          with the parts I’m allowed to share. Filter by discipline to narrow
          things down.
        </p>
      </header>

      <ProjectsExplorer projects={projects} />
    </section>
  );
}
