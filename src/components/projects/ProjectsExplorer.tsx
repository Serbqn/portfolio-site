"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "motion/react";
import { ProjectCanvas } from "@/components/projects/ProjectCanvas";
import type { ProjectFull } from "@/lib/types";
import { cn } from "@/lib/utils";

// React's CSSProperties rejects CSS custom properties; the stage feeds an
// animated radius down to the frame + glow ring via --stage-radius.
type StageStyle = CSSProperties & {
  "--stage-radius"?: string | MotionValue<string>;
};

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

  // Mandatory scroll-snap is scoped to this page: tag <html> while mounted
  // (the CSS media query limits it to ≥1024px + motion-safe), restore on
  // unmount so no other page ever snaps.
  // useLayoutEffect matters: the cleanup must run in the commit's mutation
  // phase — BEFORE Next's scroll handler (componentDidMount) touches the
  // viewport. As a passive effect the cleanup ran after paint, so leaving
  // mid-scroll navigated with mandatory snap still live and the next page
  // landed clamped to its bottom.
  useLayoutEffect(() => {
    document.documentElement.classList.add("snap-page");
    return () => document.documentElement.classList.remove("snap-page");
  }, []);

  // Entering this page — nav link, Back, or a reload — always starts at the
  // top. Browser scroll restoration would otherwise drop you mid-page,
  // where mandatory snap instantly yanks the viewport onto the canvas.
  // "instant" bypasses the page's smooth-scroll so there's no visible
  // glide up from the restored position.
  // Layout effect (see above): restoring scrollRestoration must happen
  // before Next's scroll handler reads it during the transition.
  useLayoutEffect(() => {
    const prev = history.scrollRestoration;
    history.scrollRestoration = "manual";
    window.scrollTo({ top: 0, behavior: "instant" });
    return () => {
      history.scrollRestoration = prev;
    };
  }, []);

  // ===== Extend-on-scroll morph =====
  // The stage starts in its contained "teaser" form (container width,
  // rounded, 68vh) and extends to the full-bleed, viewport-tall stage as
  // its snap beat approaches — driven purely by scroll progress.
  const stageRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [dims, setDims] = useState({ vw: 1280, vh: 720, cw: 1232, barH: 53 });
  useEffect(() => {
    const measure = () =>
      setDims({
        vw: window.innerWidth,
        vh: window.innerHeight,
        cw: stageRef.current?.parentElement?.clientWidth ?? 1232,
        barH: barRef.current?.offsetHeight || 53,
      });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const isDesktop = dims.vw >= 1024;
  // SSR can't know prefers-reduced-motion (useReducedMotion is unresolved
  // server-side), so the morph branches must stay dormant until after
  // hydration — otherwise the client's first render paints different stage
  // styles than the server HTML and React logs a hydration mismatch.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  /** Animated morph (desktop + motion-safe). */
  const morphActive = mounted && isDesktop && reduceMotion === false;
  /** Reduced motion: ProjectCanvas collapses to the stacked grid at every
   * width, so the stage must be AUTO-height — a fixed 68vh box would clip
   * the tall grid (overflow-hidden hides everything below the fold). */
  const stageAuto = mounted && isDesktop && reduceMotion === true;

  // Progress 0 → stage top at viewport bottom; 1 → stage top resting just
  // below the navbar (64) AND the pinned filter bar — exactly the snap
  // position, so the bar never paints over the canvas chrome.
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start end", `start ${64 + dims.barH}px`],
  });
  // End form touches the screen edges (square, as designed); the contained
  // start form carries the site's 20px corner radius. The radius also feeds
  // the frame through the --stage-radius variable so its border curves with
  // it instead of being clipped off by the wrapper's overflow rounding.
  const bleed = Math.max(0, (dims.vw - dims.cw) / 2);
  const mLeft = useTransform(scrollYProgress, [0, 1], [0, -bleed]);
  const mWidth = useTransform(scrollYProgress, [0, 1], [dims.cw, dims.vw]);
  const mHeight = useTransform(
    scrollYProgress,
    [0, 1],
    [Math.round(dims.vh * 0.68), Math.max(420, dims.vh - 64 - dims.barH)],
  );
  // px STRINGS, not numbers — Framer writes MotionValues to custom
  // properties verbatim, and unitless lengths are invalid CSS.
  const mRadius = useTransform(scrollYProgress, [0, 1], ["20px", "0px"]);

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

  // Esc collapses the expanded panel
  useEffect(() => {
    if (!activeSlug) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeSlug, closeDrawer]);

  const filtered = useMemo(() => {
    let list =
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
    <div className="mt-10">
      {/* Filter toolbar — the classic sticky strip: one row, docks under
          the navbar while scrolling, and sits flush above the stage at its
          snap beat. Fades out while a project is expanded: filters are
          clutter in reading mode, and the panel owns the viewport. */}
      <div
        ref={barRef}
        aria-hidden={Boolean(activeSlug)}
        className={cn(
          "sticky top-16 z-[60] -mx-6 border-y border-surface-700 bg-surface-900/90 px-6 py-3 backdrop-blur-md transition-opacity duration-300",
          activeSlug && "pointer-events-none invisible opacity-0",
        )}
      >
        <div className="flex flex-wrap items-center gap-2">{filterBarInner}</div>
      </div>

      {/* Stage — starts in the contained "teaser" form and EXTENDS to the
          full-bleed, viewport-tall stage as its snap beat approaches
          (scroll-linked morph, desktop + motion-safe). Reduced motion gets
          the end form statically; mobile keeps the contained teaser. */}
      {filtered.length > 0 ? (
        <motion.div
          ref={stageRef}
          // Teaser height lives in a class, not inline style, so it can be
          // breakpoint-scoped: ≥lg keeps the contained 68vh teaser (also
          // covers pre-hydration desktop), below lg — or everywhere under
          // reduced motion — the stage is auto-height so the stacked card
          // grid grows the page and scrolls normally.
          className={cn(
            "relative mt-8 snap-start scroll-mt-16 overflow-hidden",
            stageAuto ? "h-auto" : "h-[68vh] max-lg:h-auto",
          )}
          style={
            {
              ...(morphActive
                ? {
                    marginLeft: mLeft,
                    marginRight: mLeft,
                    width: mWidth,
                    height: mHeight,
                    borderRadius: mRadius,
                    // Park the beat below navbar + pinned bar (overrides the
                    // scroll-mt-16 class fallback once measured).
                    scrollMarginTop: 64 + dims.barH,
                  }
                : {
                    // Mobile, pre-hydration, and reduced-motion desktop:
                    // no inline geometry — the height classes own it.
                    borderRadius: 20,
                  }),
              // Frame + glow ring read this so their borders follow the
              // curve (a square border under a rounded clip loses corners).
              "--stage-radius": morphActive ? mRadius : "20px",
            } as StageStyle
          }
        >
          <motion.div
            key={`${sort}-${Array.from(active).join(",")}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <ProjectCanvas
              projects={filtered}
              interactive
              fullBleed
              /* Fill the morphing wrapper — the frame owns no height of
                 its own in stage mode. */
              className="h-full"
              viewKey="projects"
              onOpenCard={(p) => openProject(p.slug)}
              expandedSlug={activeSlug}
              onExpandCard={(slug) =>
                slug ? openProject(slug) : closeDrawer()
              }
            />
          </motion.div>
        </motion.div>
      ) : (
        <div className="mt-8 grid place-items-center rounded-2xl border border-dashed border-surface-600 bg-surface-800/50 px-6 py-20 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-surface-400">
            No matches
          </p>
          <p className="mt-2 max-w-sm text-sm text-surface-300">
            Nothing on the canvas fits that combination yet. Loosen a filter or
            clear the search.
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
