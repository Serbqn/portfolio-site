"use client";

import { useMemo, useState } from "react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import type { ProjectListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProjectsExplorer({ projects }: { projects: ProjectListItem[] }) {
  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) for (const t of p.tags) set.add(t);
    return ["All", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [projects]);

  const [active, setActive] = useState<string>("All");

  const filtered = useMemo(
    () => (active === "All" ? projects : projects.filter((p) => p.tags.includes(active))),
    [active, projects],
  );

  return (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-2">
        {tags.map((tag) => {
          const isActive = active === tag;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => setActive(tag)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150",
                isActive
                  ? "border-surface-0 bg-surface-0 text-surface-950"
                  : "border-surface-700 bg-surface-900 text-surface-200 hover:border-surface-500 hover:text-surface-0",
              )}
              aria-pressed={isActive}
            >
              {tag}
            </button>
          );
        })}
        <span className="ml-2 font-mono text-xs uppercase tracking-widest text-surface-400">
          {filtered.length} project{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
        {filtered.map((p) => (
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-12 text-center text-sm text-surface-400">
          No projects match this filter yet.
        </p>
      ) : null}
    </>
  );
}
