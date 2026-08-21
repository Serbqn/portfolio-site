"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { ProjectCanvas } from "@/components/projects/ProjectCanvas";
import type { ProjectFull } from "@/lib/types";

export function FeaturedProjects({
  projects,
  title,
}: {
  projects: ProjectFull[];
  title: string;
}) {
  if (!projects.length) return null;

  return (
    <section className="container-wide section">
      <div className="flex items-end justify-between gap-4 pb-8 sm:pb-10">
        <div>
          <p className="eyebrow">Featured</p>
          <h2 className="mt-2 text-display-3 font-medium tracking-tight text-balance">
            {title}
          </h2>
        </div>
        <Link
          href="/projects"
          className="group hidden shrink-0 items-center gap-1.5 self-end text-sm text-surface-200 transition-colors hover:text-surface-0 sm:inline-flex"
        >
          Explore the full canvas
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" weight="bold" />
        </Link>
      </div>

      {/* Locked spatial teaser — the same constellation as /projects, frozen in place */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      >
        <ProjectCanvas projects={projects} interactive={false} viewKey="featured" />
      </motion.div>

      <div className="mt-10 sm:hidden">
        <Link
          href="/projects"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-surface-600 px-4 text-sm font-medium text-surface-0 transition-colors hover:border-surface-500 hover:bg-surface-800"
        >
          All projects →
        </Link>
      </div>
    </section>
  );
}
