"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { ProjectListItem } from "@/lib/types";

const cardSpring = { type: "spring" as const, stiffness: 400, damping: 25, mass: 0.8 };

export function ProjectCard({
  project,
  className,
  size = "default",
  onOpen,
}: {
  project: ProjectListItem;
  className?: string;
  size?: "default" | "feature";
  /** Present → plain clicks open the in-page drawer. Modifier-clicks and
   * middle-clicks still navigate to the standalone page normally. */
  onOpen?: (project: ProjectListItem) => void;
}) {
  return (
    <Link
      href={`/projects/${project.slug}`}
      draggable={false}
      onClick={(e) => {
        if (!onOpen) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)
          return;
        e.preventDefault();
        onOpen(project);
      }}
      className={cn("group block", className)}
    >
      <motion.article
        whileHover={{ y: -6 }}
        transition={cardSpring}
        className="relative overflow-hidden rounded-2xl border border-surface-700 bg-surface-800 transition-[border-color,box-shadow] duration-300 hover:border-surface-500 hover:shadow-lift"
      >
        {/* Cover — warm-graded at rest, full color + zoom on hover */}
        <div
          className={cn(
            "relative w-full overflow-hidden bg-surface-900",
            size === "feature" ? "aspect-[16/10]" : "aspect-[16/9]",
          )}
        >
          {project.cover ? (
            <Image
              src={project.cover}
              alt={`${project.title} cover`}
              fill
              draggable={false}
              sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
              className="object-cover saturate-[0.82] transition-[transform,filter] duration-500 ease-out-soft group-hover:scale-[1.06] group-hover:saturate-100"
            />
          ) : null}
          {/* Ember grade pooling at the bottom of the cover */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-950/70 via-surface-950/10 to-transparent"
          />
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-accent-400">
            {project.client}
          </p>

          <div className="mt-2 flex items-start justify-between gap-3">
            <h3
              className={cn(
                "font-medium tracking-tight text-surface-0 transition-colors duration-150 group-hover:text-accent-400",
                size === "feature" ? "text-2xl sm:text-[1.7rem]" : "text-xl",
              )}
            >
              {project.title}
            </h3>
            <span
              aria-hidden
              className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-surface-600 text-surface-300 transition-all duration-200 group-hover:border-accent-500 group-hover:bg-accent-500 group-hover:text-surface-950"
            >
              <ArrowUpRight
                className="h-4 w-4 transition-transform duration-200 group-hover:rotate-45"
                weight="bold"
              />
            </span>
          </div>

          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-surface-300">
            {project.subtitle}
          </p>

          {/* Tags — editorial mono row with slash separators */}
          <ul className="mt-4 flex flex-wrap items-center gap-x-1.5 border-t border-surface-700 pt-3 font-mono text-[11px] uppercase tracking-wider text-surface-400">
            {project.tags.slice(0, 3).map((tag, i) => (
              <li key={tag} className="flex items-center gap-1.5">
                {i > 0 ? (
                  <span aria-hidden className="text-surface-600">
                    /
                  </span>
                ) : null}
                {tag}
              </li>
            ))}
          </ul>
        </div>
      </motion.article>
    </Link>
  );
}
