"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollableProjectCanvas } from "@/components/projects/ScrollableProjectCanvas";
import type { ProjectFull } from "@/lib/types";
import { cn } from "@/lib/utils";

type SortKey = "featured" | "newest" | "alpha";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "newest", label: "Newest" },
  { key: "alpha", label: "A–Z" },
];

export function ProjectsExplorer({ projects }: { projects: ProjectFull[] }) {
  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) for (const t of p.tags) set.add(t);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [projects]);

  // Hydrate filter state from the URL once (avoids useSearchParams/Suspense)
  const [active, setActive] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortKey>("featured");
  const [hydrated, setHydrated] = useState(false);
  /** Slug of the project shown in the side drawer, if any. */
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tagParam = params.get("tag");
    const s = params.get("sort") as SortKey | null;
    const projectParam = params.get("project");
    // Single-select: keep at most one tag even if an old multi-tag URL is
    // still floating around.
    if (tagParam) {
      const first = tagParam.split(",").find((t) => tags.includes(t));
      if (first) setActive(new Set([first]));
    }
    if (s && SORTS.some((o) => o.key === s)) setSort(s);
    if (projectParam && projects.some((p) => p.slug === projectParam)) {
      setActiveSlug(projectParam);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirror state back into the URL without triggering navigation
  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams();
    if (active.size) params.set("tag", Array.from(active).join(","));
    if (sort !== "featured") params.set("sort", sort);
    if (activeSlug) params.set("project", activeSlug);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [active, sort, activeSlug, hydrated]);

  // Browser back / forward expands (or collapses) the in-card panel
  useEffect(() => {
    const onPop = () => {
      const slug = new URLSearchParams(window.location.search).get("project");
      setActiveSlug(slug && projects.some((p) => p.slug === slug) ? slug : null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [projects]);

  const openProject = useCallback((slug: string) => {
    // Push so browser Back collapses the expanded panel
    window.history.pushState(null, "", `?project=${slug}`);
    setActiveSlug(slug);
  }, []);

  const closeDrawer = useCallback(() => {
    const params = new URLSearchParams();
    if (active.size) params.set("tag", Array.from(active).join(","));
    if (sort !== "featured") params.set("sort", sort);
    const qs = params.toString();
    window.history.pushState(null, "", qs ? `?${qs}` : window.location.pathname);
    setActiveSlug(null);
  }, [active, sort]);

  const filtered = useMemo(() => {
    const list =
      active.size === 0
        ? projects
        : projects.filter((p) => p.tags.some((t) => active.has(t)));
    switch (sort) {
      case "newest":
        return [...list].sort((a, b) => b.year.localeCompare(a.year));
      case "alpha":
        return [...list].sort((a, b) => a.title.localeCompare(b.title));
      default:
        return [...list].sort(
          (a, b) => Number(b.featured) - Number(a.featured),
        );
    }
  }, [active, projects, sort]);

  function toggleTag(tag: string) {
    // Single-select: picking a tag replaces the previous selection;
    // clicking the active tag again clears it.
    setActive((prev) => (prev.has(tag) ? new Set() : new Set([tag])));
  }

  function reset() {
    setActive(new Set());
    setSort("featured");
  }

  const hasFilters = active.size > 0 || sort !== "featured";

  // Shared filter controls — the mobile strip and the desktop floating
  // pill render the same set.
  const filterBarInner = (
    <>
      {/* Tag chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        {tags.map((tag) => {
          const isActive = active.has(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-150",
                isActive
                  ? "border-accent-500 bg-accent-500 text-surface-950"
                  : "border-surface-600 bg-transparent text-surface-200 hover:border-surface-500 hover:text-surface-0",
              )}
              aria-pressed={isActive}
            >
              {tag}
            </button>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Sort */}
        <div
          role="group"
          aria-label="Sort projects"
          className="hidden items-center rounded-lg border border-surface-600 p-0.5 sm:flex"
        >
          {SORTS.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => setSort(o.key)}
              className={cn(
                "rounded-md px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors duration-150",
                sort === o.key
                  ? "bg-surface-800 text-surface-0"
                  : "text-surface-400 hover:text-surface-0",
              )}
              aria-pressed={sort === o.key}
            >
              {o.label}
            </button>
          ))}
        </div>

        <span
          className="font-mono text-xs uppercase tracking-widest text-surface-400"
          aria-live="polite"
        >
          {filtered.length} project{filtered.length === 1 ? "" : "s"}
        </span>
      </div>
    </>
  );

  return (
    <div className="flex min-h-[calc(100dvh-65px)] flex-col lg:h-[calc(100dvh-65px)]">
      {/* The filter bar stays above the shared scroll/drag viewport. */}
      <div
        aria-hidden={Boolean(activeSlug)}
        className={cn(
          "sticky top-16 z-[60] shrink-0 border-b border-surface-700 bg-surface-900 px-6 py-3 transition-opacity duration-150",
          activeSlug && "pointer-events-none invisible opacity-0",
        )}
      >
        <div className="container-wide flex w-full flex-wrap items-center gap-2 !px-0">{filterBarInner}</div>
      </div>

      {filtered.length > 0 ? (
        <div className="min-h-0 flex-1">
          <ScrollableProjectCanvas
            key={`${sort}-${Array.from(active).join(",")}`}
            projects={filtered}
            viewKey={`${sort}-${Array.from(active).join(",")}`}
            onOpenCard={(p) => openProject(p.slug)}
            expandedSlug={activeSlug}
            onClose={closeDrawer}
          />
        </div>
      ) : (
        <div className="mt-8 grid place-items-center rounded-2xl border border-dashed border-surface-600 bg-surface-800/50 px-6 py-20 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-surface-400">
            No matches
          </p>
          <p className="mt-2 max-w-sm text-sm text-surface-300">
            No projects match this filter. Try another discipline or reset the filters.
          </p>
          {hasFilters ? (
            <button
              type="button"
              onClick={reset}
              className="mt-6 inline-flex h-9 items-center rounded-lg border border-surface-600 px-4 text-sm font-medium text-surface-0 transition-colors hover:border-accent-500 hover:text-accent-400"
            >
              Reset filters
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
