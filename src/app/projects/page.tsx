import type { Metadata } from "next";
import { ProjectsExplorer } from "@/components/projects/ProjectsExplorer";
import { getProjectsFull } from "@/lib/content";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Selected case studies in fintech, dev tools, and B2B SaaS — interface design for products where the work is in the details.",
  alternates: { canonical: "/projects" },
};

export default async function ProjectsPage() {
  const projects = await getProjectsFull();

  return (
    // snap-start: beat one of the /projects scroll story (intro → canvas).
    // pb-0: no tail after the stage — the canvas is the hard bottom.
    <section className="container-wide section snap-start pb-0">
      <header className="max-w-3xl">
        <p className="eyebrow">Work</p>
        <h1 className="mt-2 text-display-1 font-medium tracking-tight text-balance">
          A small portfolio, picked carefully.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-surface-300">
          Most of my work is under NDA. The public ones live on the canvas
          below — drag it around, zoom in, or filter by discipline.
        </p>
      </header>

      <ProjectsExplorer projects={projects} />
    </section>
  );
}
