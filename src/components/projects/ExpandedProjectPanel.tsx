"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { X, ArrowUpRight, ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { Markdown } from "@/components/projects/Markdown";
import { cn, normalizeExternalUrl } from "@/lib/utils";
import type { ProjectFull } from "@/lib/types";

type Tab = "overview" | "gallery" | "case";

/**
 * ExpandedProjectPanel — the in-canvas expansion of a project card.
 * Renders inside the card's slot on the field: Overview / Gallery /
 * Case study tabs, internal scroll, collapse button. Sized as a
 * percentage of the frame so it reads big on any screen. The canvas
 * centers it automatically.
 */
export function ExpandedProjectPanel({
  project,
  onCollapse,
}: {
  project: ProjectFull;
  onCollapse: () => void;
}) {
  const [tab, setTab] = useState<Tab>("overview");
  const reduceMotion = useReducedMotion();
  /** Index into galleryImages shown in the lightbox, if open. */
  const [activeImg, setActiveImg] = useState<number | null>(null);
  /** Gallery scroller — owns one-image-per-gesture wheel paging. */
  const galleryRef = useRef<HTMLDivElement>(null);
  const lastPageAt = useRef(0);

  const metrics = (project.metrics ?? []).filter(
    (m) => m.label.trim() || m.value.trim(),
  );

  // Cover first, then gallery entries — blanks from the admin are skipped.
  const galleryImages = [
    ...(project.cover ? [project.cover] : []),
    ...(project.gallery ?? []),
  ].filter(
    (src, i, arr) =>
      typeof src === "string" && src.trim() !== "" && arr.indexOf(src) === i,
  );
  const galleryCount = galleryImages.length;

  const sections = [
    { heading: "Problem", body: project.problem },
    { heading: "Process", body: project.process },
    { heading: "Solution", body: project.solution },
    { heading: "Results", body: project.results },
  ].filter((s) => s.body);

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "case", label: "Case study" },
    ...(galleryCount ? [{ id: "gallery" as Tab, label: `Gallery · ${galleryCount}` }] : []),
  ];

  const closeLightbox = useCallback(() => setActiveImg(null), []);
  const stepLightbox = useCallback(
    (dir: 1 | -1) =>
      setActiveImg((i) =>
        i === null ? i : (i + dir + galleryCount) % galleryCount,
      ),
    [galleryCount],
  );

  // Lightbox keyboard — capture phase so Escape closes the IMAGE first and
  // never reaches the panel-collapse / canvas handlers underneath.
  useEffect(() => {
    if (activeImg === null) return;
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") stepLightbox(1);
      if (e.key === "ArrowLeft") stepLightbox(-1);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [activeImg, closeLightbox, stepLightbox]);

  // Portal target — the lightbox must escape the panel's stacking context,
  // otherwise the canvas toolbar (z-50) paints above it. While the canvas
  // frame is browser-fullscreen only ITS subtree renders, so the lightbox
  // must portal into the fullscreen element instead of <body> — otherwise
  // it stays invisible and gallery images "can't be expanded".
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const sync = () =>
      setPortalTarget(
        (document.fullscreenElement as HTMLElement | null) ?? document.body,
      );
    sync();
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  // Gallery paging — one image per wheel gesture. Native non-passive
  // listener so preventDefault sticks (React's onWheel is passive). Each
  // gesture advances exactly one full-height slide; a short cooldown
  // swallows the momentum tail so a flick never skips three images. CSS
  // snap alone can't do this: a small wheel tick snaps back instead of
  // committing to the next full-height page.
  useEffect(() => {
    const sc = galleryRef.current;
    if (tab !== "gallery" || !sc) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.deltaY || galleryCount === 0) return;
      e.preventDefault();
      const now = performance.now();
      if (now - lastPageAt.current < 450) return;
      lastPageAt.current = now;
      // Stride = slide height + inter-slide gap, measured from real
      // positions (the scroller is relative, so offsetTop is local).
      const first = sc.firstElementChild as HTMLElement | null;
      const second = first?.nextElementSibling as HTMLElement | null;
      const stride =
        first && second
          ? second.offsetTop - first.offsetTop
          : Math.max(first?.offsetHeight ?? sc.clientHeight - 32, 1);
      const current = Math.round(sc.scrollTop / stride);
      const next = Math.min(
        Math.max(current + (e.deltaY > 0 ? 1 : -1), 0),
        galleryCount - 1,
      );
      sc.scrollTo({
        top: next * stride,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    };
    sc.addEventListener("wheel", onWheel, { passive: false });
    return () => sc.removeEventListener("wheel", onWheel);
  }, [tab, galleryCount, reduceMotion]);

  return (
    <motion.div
      data-expanded-panel=""
      initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="pointer-events-auto flex h-[92%] max-h-[860px] w-[76%] min-w-[600px] flex-col overflow-hidden rounded-2xl border border-surface-500 bg-surface-800 shadow-lift"
    >
      {/* Header — title + tabs + actions on one line for more content space */}
      <div className="flex items-center gap-3 border-b border-surface-700 px-4 py-2.5">
        <div className="min-w-0 shrink">
          <h3 className="truncate text-base font-medium tracking-tight text-surface-0">
            {project.title}
          </h3>
          <p className="truncate font-mono text-[9px] uppercase tracking-widest text-surface-400">
            {project.year} · {project.client}
          </p>
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Project details"
          className="ml-auto flex items-center gap-1"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-md px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors duration-150",
                tab === t.id
                  ? "bg-surface-700 text-accent-400"
                  : "text-surface-400 hover:text-surface-0",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <span aria-hidden className="h-6 w-px shrink-0 bg-surface-600" />
        <Link
          href={`/projects/${project.slug}`}
          aria-label={`Open ${project.title} page`}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-surface-600 text-surface-200 transition-colors hover:border-accent-500 hover:text-accent-400"
        >
          <ArrowUpRight className="h-4 w-4" weight="bold" />
        </Link>
        <button
          type="button"
          onClick={onCollapse}
          aria-label="Collapse panel"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-surface-600 text-surface-200 transition-colors hover:border-accent-500 hover:text-accent-400"
        >
          <X className="h-4 w-4" weight="bold" />
        </button>
      </div>

      {/* Content */}
      <div ref={galleryRef} className="relative flex-1 overflow-y-auto overscroll-contain p-4">
        {tab === "overview" ? (
          /* Flex column that fills the visible area: the cover absorbs all
             leftover height (min floor with scroll fallback), so it reads
             large on any panel size without pushing content out of view. */
          <div className="flex h-full min-h-0 flex-col gap-3">
            {/* Meta group — subtitle + disciplines + role + link stacked
               tightly; the outer gap-3 keeps air before the cover. */}
            <div className="flex flex-col gap-1.5">
              <p className="text-sm leading-relaxed text-pretty text-surface-200">
                {project.subtitle}
              </p>

              {/* Disciplines / role / live link — reads before the cover so
                 the meta leads and the visuals follow. */}
              <ul className="flex flex-wrap items-center gap-x-1.5 font-mono text-[11px] uppercase tracking-wider text-surface-400">
                {project.tags.map((tag, i) => (
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

              <p className="font-mono text-[10px] uppercase tracking-widest text-surface-400">
                Role · <span className="text-surface-200">{project.role}</span>
              </p>

              {/* External/live link — opens in a new tab */}
              {project.link ? (
                <p className="font-mono text-[10px] uppercase tracking-widest text-surface-400">
                  Link ·{" "}
                  <a
                    href={normalizeExternalUrl(project.link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm normal-case tracking-normal text-accent-400 underline-offset-2 transition-colors hover:text-accent-300 hover:underline"
                  >
                    Visit Project ↗
                  </a>
                </p>
              ) : null}
            </div>

            {project.cover ? (
              <button
                type="button"
                onClick={() => setActiveImg(0)}
                aria-label="Open cover full size"
                className="group relative block w-full min-h-[140px] flex-1 cursor-zoom-in overflow-hidden rounded-xl border border-surface-700"
              >
                <Image
                  src={project.cover}
                  alt={`${project.title} cover`}
                  fill
                  draggable={false}
                  sizes="800px"
                  className="object-cover saturate-[0.9] transition-transform duration-500 ease-out-soft group-hover:scale-[1.04] group-hover:saturate-100"
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-950/50 via-transparent to-transparent"
                />
              </button>
            ) : null}

            {metrics.length ? (
              <div
                className="grid gap-px overflow-hidden rounded-xl border border-surface-700"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(metrics.length, 3)}, minmax(0, 1fr))`,
                }}
              >
                {metrics.map((m) => (
                  <div key={m.label} className="bg-surface-900 p-3">
                    <div className="font-mono text-[9px] uppercase tracking-widest text-surface-400">
                      {m.label}
                    </div>
                    <div className="mt-1 text-lg font-medium tracking-tight text-accent-400">
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

          </div>
        ) : tab === "gallery" ? (
          /* Gallery — one image per scroll gesture: every slide fills the
             visible area exactly and snap-mandatory pages between them.
             Click opens the lightbox. */
          galleryImages.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActiveImg(i)}
              aria-label={`Open image ${i + 1} of ${galleryImages.length}`}
              className="group relative mb-4 block h-full w-full overflow-hidden rounded-xl border border-surface-700 transition-colors hover:border-accent-500"
            >
              <Image
                src={src}
                alt={`${project.title} — view ${i + 1}`}
                fill
                draggable={false}
                sizes="760px"
                className="object-cover saturate-[0.9] transition-transform duration-500 ease-out-soft group-hover:scale-[1.03] group-hover:saturate-100"
              />
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-2 right-2 rounded-md border border-surface-600 bg-surface-950/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-surface-200 backdrop-blur-sm"
              >
                {String(i + 1).padStart(2, "0")} / {String(galleryImages.length).padStart(2, "0")} · expand
              </span>
            </button>
          ))
        ) : (
          /* Case study — left-aligned text in a centered, readable column */
          <div className="mx-auto max-w-[62ch] space-y-6 text-left">
            {sections.length ? (
              sections.map((s) => (
                <section key={s.heading}>
                  <h4 className="font-mono text-xs uppercase tracking-widest text-accent-400">
                    {s.heading}
                  </h4>
                  <div className="mt-2">
                    <Markdown>{s.body}</Markdown>
                  </div>
                </section>
              ))
            ) : (
              <p className="text-sm text-surface-300">
                The written case study for this project isn't published yet —
                open the full page for visuals and details.
              </p>
            )}
          </div>
        )}

        {/* Lightbox — full-size image viewer, portaled above the panel so it
            stacks above the canvas toolbar; while the frame is fullscreen it
            portals into the fullscreen element (only its subtree renders) */}
        {mounted && portalTarget
          ? createPortal(
              <AnimatePresence>
                {activeImg !== null && galleryImages[activeImg] ? (
                  <motion.div
                    key="lightbox"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.18 }}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Image ${activeImg + 1} of ${galleryCount}`}
                    className="fixed inset-0 z-[90] flex flex-col bg-surface-950/95"
                    onClick={closeLightbox}
                  >
                    {/* Top bar */}
                    <div className="flex items-center justify-between px-5 py-4">
                      <span className="font-mono text-xs uppercase tracking-widest text-surface-300">
                        {String(activeImg + 1).padStart(2, "0")} / {String(galleryCount).padStart(2, "0")}
                      </span>
                      <button
                        type="button"
                        onClick={closeLightbox}
                        aria-label="Close image viewer"
                        className="grid h-10 w-10 place-items-center rounded-lg border border-surface-600 text-surface-200 transition-colors hover:border-accent-500 hover:text-accent-400"
                      >
                        <X className="h-5 w-5" weight="bold" />
                      </button>
                    </div>

                    {/* Image area */}
                    <div
                      className="relative flex flex-1 items-center justify-center px-6 pb-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {galleryImages.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => stepLightbox(-1)}
                          aria-label="Previous image"
                          className="absolute left-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-surface-600 bg-surface-900/80 text-surface-200 backdrop-blur-sm transition-colors hover:border-accent-500 hover:text-accent-400"
                        >
                          <ArrowLeft className="h-5 w-5" weight="bold" />
                        </button>
                      ) : null}
                      <motion.div
                        key={galleryImages[activeImg]}
                        initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeOut" }}
                        className="relative h-full w-full"
                      >
                        <Image
                          src={galleryImages[activeImg]}
                          alt={`${project.title} — image ${activeImg + 1}`}
                          fill
                          draggable={false}
                          sizes="100vw"
                          className="object-contain"
                        />
                      </motion.div>
                      {galleryImages.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => stepLightbox(1)}
                          aria-label="Next image"
                          className="absolute right-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-surface-600 bg-surface-900/80 text-surface-200 backdrop-blur-sm transition-colors hover:border-accent-500 hover:text-accent-400"
                        >
                          <ArrowRight className="h-5 w-5" weight="bold" />
                        </button>
                      ) : null}
                    </div>

                    {/* Bottom padding for balance */}
                    <div className="h-12" />
                  </motion.div>
                ) : null}
              </AnimatePresence>,
              portalTarget,
            )
          : null}
      </div>
    </motion.div>
  );
}
