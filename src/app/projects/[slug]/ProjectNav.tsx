"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import type { ProjectListItem } from "@/lib/types";

interface ProjectNavProps {
  prev: ProjectListItem;
  next: ProjectListItem;
}

export function ProjectNav({ prev, next }: ProjectNavProps) {
  return (
    <nav aria-label="Project navigation" className="border-t border-surface-700">
      <div className="container-wide grid grid-cols-2 gap-px overflow-hidden bg-surface-700 sm:grid-cols-2">
        <Link
          href={`/projects/${prev.slug}`}
          className="group flex flex-col gap-2 bg-surface-900 p-6 transition-colors hover:bg-surface-800 sm:p-8"
        >
          <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-surface-400 transition-colors group-hover:text-accent-400">
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" weight="bold" />
            Previous
          </span>
          <span className="text-base font-medium text-surface-0 sm:text-lg">
            {prev.title}
          </span>
        </Link>
        <Link
          href={`/projects/${next.slug}`}
          className="group col-start-2 flex flex-col items-end gap-2 bg-surface-900 p-6 text-right transition-colors hover:bg-surface-800 sm:p-8"
        >
          <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-surface-400 transition-colors group-hover:text-accent-400">
            Next
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" weight="bold" />
          </span>
          <span className="text-base font-medium text-surface-0 sm:text-lg">
            {next.title}
          </span>
        </Link>
      </div>
    </nav>
  );
}