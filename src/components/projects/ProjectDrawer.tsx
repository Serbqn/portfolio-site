"use client";

import { useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  X,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Images,
} from "@phosphor-icons/react";
import { Markdown } from "@/components/projects/Markdown";
import type { ProjectFull } from "@/lib/types";

type Props = {
  project: ProjectFull;
  prev?: ProjectFull;
  next?: ProjectFull;
  onClose: () => void;
  onNavigate: (slug: string) => void;
};

const sectionSpring = { type: "spring" as const, stiffness: 320, damping: 30 };

/**
 * ProjectDrawer — compact case-study panel sliding in from the right.
 * The canvas stays alive behind a light scrim; Esc / scrim / ✕ close,
 * ← → jump between projects, ↗ opens the standalone page.
 */
export function ProjectDrawer({
  project,
  prev,
  next,
  onClose,
  onNavigate,
}: Props) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Keyboard: Escape closes, arrows navigate
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && next) onNavigate(next.slug);
      if (e.key === "ArrowLeft" && prev) onNavigate(prev.slug);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onNavigate, next, prev]);

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Focus the close button on open, restore focus on unmount
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previous?.focus();
  }, []);

  const lightboxImages = [
    ...(project.cover ? [{ src: project.cover, alt: `${project.title} cover` }] : []),
    // Guard against blank gallery entries saved from the admin.
    ...(project.gallery ?? [])
      .filter((g) => typeof g === "string" && g.trim() !== "" && g !== project.cover)
      .map((g) => ({ src: g, alt: `${project.title} screenshot` })),
  ].filter((img) => img.src.trim() !== "");

  const sections = [
    { heading: "Problem", body: project.problem },
    { heading: "Process", body: project.process },
    { heading: "Solution", body: project.solution },
    { heading: "Results", body: project.results },
  ].filter((s) => s.body);

  const stop = useCallback((e: React.MouseEvent) => e.stopPropagation(), []);

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label={`${project.title} case study`}>
      {/* Scrim — click to close */}
      <motion.button
        type="button"
        aria-label="Close case study"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduceMotion ? 0 : 0.2 }}
        className="absolute inset-0 w-full cursor-default bg-surface-950/60 backdrop-blur-[2px]"
      />

      {/* Panel */}
      <motion.aside
        ref={panelRef}
        onClick={stop}
        initial={reduceMotion ? false : { x: "100%" }}
        animate={{ x: 0 }}
        exit={reduceMotion ? undefined : { x: "100%" }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "spring", stiffness: 300, damping: 32 }
        }
        className="absolute inset-y-0 right-0 flex w-full max-w-[560px] flex-col border-l border-surface-700 bg-surface-900 shadow-lift"
      >
        {/* Sticky header */}
        <header className="flex items-center gap-2 border-b border-surface-700 bg-surface-900/95 px-4 py-3 backdrop-blur-sm sm:px-5">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close case study"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-surface-600 text-surface-200 transition-colors hover:border-accent-500 hover:text-accent-400"
          >
            <X className="h-4 w-4" weight="bold" />
          </button>
          <h2 className="min-w-0 flex-1 truncate text-lg font-medium tracking-tight text-surface-0">
            {project.title}
          </h2>
          <Link
            href={`/projects/${project.slug}`}
            aria-label={`Open ${project.title} page`}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-surface-600 text-surface-200 transition-colors hover:border-accent-500 hover:text-accent-400"
          >
            <ArrowUpRight className="h-4 w-4" weight="bold" />
          </Link>
          <span className="flex shrink-0 items-center overflow-hidden rounded-lg border border-surface-600">
            <button
              type="button"
              disabled={!prev}
              onClick={() => prev && onNavigate(prev.slug)}
              aria-label="Previous project"
              className="grid h-9 w-9 place-items-center text-surface-200 transition-colors hover:bg-surface-800 hover:text-accent-400 disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" weight="bold" />
            </button>
            <span aria-hidden className="h-6 w-px bg-surface-600" />
            <button
              type="button"
              disabled={!next}
              onClick={() => next && onNavigate(next.slug)}
              aria-label="Next project"
              className="grid h-9 w-9 place-items-center text-surface-200 transition-colors hover:bg-surface-800 hover:text-accent-400 disabled:opacity-40"
            >
              <ArrowRight className="h-4 w-4" weight="bold" />
            </button>
          </span>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          {/* Meta line */}
          <p className="eyebrow px-5 pt-5 sm:px-6">
            {project.year} · {project.client} · {project.role}
          </p>

          {/* Cover */}
          {project.cover ? (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...sectionSpring, delay: 0.05 }}
              className="relative mx-5 mt-4 aspect-[16/10] overflow-hidden rounded-xl border border-surface-700 sm:mx-6"
            >
              <Image
                src={project.cover}
                alt={`${project.title} cover`}
                fill
                draggable={false}
                sizes="560px"
                className="object-cover"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-950/50 via-transparent to-transparent"
              />
            </motion.div>
          ) : null}

          {/* Subtitle */}
          <p className="px-5 pt-4 text-base leading-relaxed text-pretty text-surface-200 sm:px-6">
            {project.subtitle}
          </p>

          {/* Metrics — skip blank entries saved from the admin */}
          {project.metrics?.filter((m) => m.label.trim() || m.value.trim()).length ? (
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...sectionSpring, delay: 0.08 }}
              className="mx-5 mt-5 grid gap-px overflow-hidden rounded-xl border border-surface-700 sm:mx-6"
              style={{
                gridTemplateColumns: `repeat(${Math.min(project.metrics.filter((m) => m.label.trim() || m.value.trim()).length, 3)}, minmax(0, 1fr))`,
              }}
            >
              {project.metrics.filter((m) => m.label.trim() || m.value.trim()).map((m) => (
                <div key={m.label} className="bg-surface-800 p-3.5">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-surface-400">
                    {m.label}
                  </div>
                  <div className="mt-1 text-xl font-medium tracking-tight text-accent-400">
                    {m.value}
                  </div>
                </div>
              ))}
            </motion.div>
          ) : null}

          {/* Case-study sections */}
          <div className="space-y-7 px-5 pb-6 pt-7 sm:px-6">
            {sections.map((s, i) => (
              <motion.section
                key={s.heading}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...sectionSpring, delay: 0.1 + i * 0.05 }}
              >
                <h3 className="font-mono text-xs uppercase tracking-widest text-accent-400">
                  {s.heading}
                </h3>
                <div className="mt-2.5">
                  <Markdown>{s.body}</Markdown>
                </div>
              </motion.section>
            ))}
          </div>

          {/* Gallery */}
          {lightboxImages.length > 1 ? (
            <div className="border-t border-surface-700 px-5 py-5 sm:px-6">
              <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-surface-400">
                <Images className="h-4 w-4 text-accent-400" aria-hidden />
                Gallery · {lightboxImages.length}
              </h3>
              <ul className="mt-3 grid grid-cols-2 gap-2.5">
                {lightboxImages.map((img, i) => (
                  <li key={img.src}>
                    <a
                      href={img.src}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group relative block aspect-[16/10] overflow-hidden rounded-lg border border-surface-700 transition-colors hover:border-accent-500"
                    >
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        draggable={false}
                        sizes="280px"
                        className="object-cover saturate-[0.85] transition-transform duration-500 ease-out-soft group-hover:scale-105 group-hover:saturate-100"
                      />
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-surface-400">
                Click an image to view full size
              </p>
            </div>
          ) : null}

          {/* Prev / Next footer */}
          <footer className="sticky bottom-0 grid grid-cols-2 gap-px border-t border-surface-700 bg-surface-700">
            {prev ? (
              <button
                type="button"
                onClick={() => onNavigate(prev.slug)}
                className="group flex flex-col items-start gap-0.5 bg-surface-900 p-4 text-left transition-colors hover:bg-surface-800"
              >
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-surface-400 transition-colors group-hover:text-accent-400">
                  <ArrowLeft className="h-3 w-3 transition-transform duration-150 group-hover:-translate-x-0.5" weight="bold" />
                  Previous
                </span>
                <span className="truncate text-sm font-medium text-surface-0">
                  {prev.title}
                </span>
              </button>
            ) : (
              <div className="bg-surface-900" />
            )}
            {next ? (
              <button
                type="button"
                onClick={() => onNavigate(next.slug)}
                className="group flex flex-col items-end gap-0.5 bg-surface-900 p-4 text-right transition-colors hover:bg-surface-800"
              >
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-surface-400 transition-colors group-hover:text-accent-400">
                  Next
                  <ArrowRight className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5" weight="bold" />
                </span>
                <span className="truncate text-sm font-medium text-surface-0">
                  {next.title}
                </span>
              </button>
            ) : (
              <div className="bg-surface-900" />
            )}
          </footer>
        </div>
      </motion.aside>
    </div>
  );
}
