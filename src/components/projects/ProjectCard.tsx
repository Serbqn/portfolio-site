"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import type { ProjectListItem } from "@/lib/types";

const cardSpring = { type: "spring" as const, stiffness: 400, damping: 25, mass: 0.8 };

export function ProjectCard({
  project,
  className,
  size = "default",
}: {
  project: ProjectListItem;
  className?: string;
  size?: "default" | "feature";
}) {
  return (
    <Link href={`/projects/${project.slug}`} className={cn("block", className)}>
      <motion.div
        whileHover={{ y: -4, borderColor: "var(--surface-500)" }}
        transition={cardSpring}
        className="group overflow-hidden rounded-2xl border border-surface-700 bg-surface-900"
      >
        <div
          className={cn(
            "relative w-full overflow-hidden bg-surface-800",
            size === "feature" ? "aspect-[16/10]" : "aspect-[16/9]",
          )}
        >
          {project.cover ? (
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <Image
                src={project.cover}
                alt={`${project.title} cover`}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            </motion.div>
          ) : null}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span className="font-mono uppercase tracking-widest text-surface-400">
                {project.year}
              </span>
              <span className="text-surface-500">·</span>
              <span className="text-surface-400">{project.client}</span>
            </div>
            <h3
              className={cn(
                "mt-2 font-semibold tracking-tight text-surface-0",
                size === "feature" ? "text-2xl" : "text-lg",
              )}
            >
              {project.title}
            </h3>
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-surface-300">
              {project.subtitle}
            </p>
          </div>
          <motion.span
            aria-hidden
            whileHover={{ rotate: 45, scale: 1.1, borderColor: "var(--surface-0)", backgroundColor: "var(--surface-0)", color: "var(--surface-950)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="mt-1 grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border border-surface-700 text-surface-400"
          >
            <ArrowUpRight className="h-4 w-4" />
          </motion.span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 border-t border-surface-800 px-5 py-3 sm:px-6">
          {project.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-surface-800 px-2.5 py-0.5 text-xs font-medium text-surface-200"
            >
              {tag}
            </span>
          ))}
        </div>
      </motion.div>
    </Link>
  );
}
