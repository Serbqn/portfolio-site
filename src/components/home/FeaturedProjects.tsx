"use client";

import { motion } from "motion/react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import type { ProjectListItem } from "@/lib/types";

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

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

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8"
      >
        {projects.map((p) => (
          <motion.div key={p.slug} variants={cardVariants}>
            <ProjectCard project={p} />
          </motion.div>
        ))}
      </motion.div>

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
