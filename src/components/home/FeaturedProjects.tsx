import { ProjectCard } from "@/components/projects/ProjectCard";
import type { ProjectListItem } from "@/lib/types";

export function FeaturedProjects({
  projects,
  title,
}: {
  projects: ProjectListItem[];
  title: string;
}) {
  if (!projects.length) return null;

  return (
    <section className="container-wide section">
      <div className="flex items-end justify-between gap-4 pb-8 sm:pb-10">
        <div>
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            {title}
          </p>
          <h2 className="mt-3 text-display-3 font-semibold tracking-tight text-balance">
            Recent work, the kind that ships.
          </h2>
        </div>
        <a
          href="/projects"
          className="hidden shrink-0 items-center gap-1.5 self-end text-sm text-surface-200 transition-colors hover:text-surface-0 sm:inline-flex"
        >
          All projects
          <span aria-hidden>→</span>
        </a>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {projects.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>

      <div className="mt-10 sm:hidden">
        <a
          href="/projects"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-surface-700 px-4 text-sm font-medium text-surface-0 transition-colors hover:bg-surface-800"
        >
          All projects →
        </a>
      </div>
    </section>
  );
}
