"use client";

import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";

export function BackLink() {
  return (
    <Link
      href="/projects"
      className="group inline-flex items-center gap-1.5 text-sm text-surface-400 transition-colors hover:text-accent-400"
    >
      <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" weight="bold" />
      All projects
    </Link>
  );
}