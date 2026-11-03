"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowsCounterClockwise, ArrowsIn, ArrowsOut, ArrowDown, Info, MagnifyingGlassMinus, MagnifyingGlassPlus } from "@phosphor-icons/react";
import { DraggableCard } from "./ProjectCanvas";
import { ProjectCard } from "./ProjectCard";
import { ExpandedProjectPanel } from "./ExpandedProjectPanel";
import { ProjectDrawer } from "./ProjectDrawer";
import type { ProjectFull, ProjectListItem } from "@/lib/types";
import { cn } from "@/lib/utils";

const CARD_WIDTH = 340;
const PADDING = 48;
const MIN_ZOOM = 0.8;
const MAX_ZOOM = 1.4;
type Offset = { dx: number; dy: number };
type Mode = "mobile" | "spatial" | "reduced";

function hashSlug(slug: string) {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) | 0;
  return Math.abs(hash);
}

/** Projects-only viewport: wheel, scrollbar, keyboard, and drag share native scroll offsets. */
export function ScrollableProjectCanvas({ projects, viewKey, onOpenCard, expandedSlug, onClose }: {
  projects: ProjectFull[];
  viewKey: string;
  onOpenCard: (project: ProjectListItem) => void;
  expandedSlug: string | null;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>("mobile");
  const [zoom, setZoom] = useState(1);
  const zoomRef = useRef(1);
  const [offsets, setOffsets] = useState<Record<string, Offset>>({});
  const [frame, setFrame] = useState({ width: 1440, height: 720 });
  const [cardHeight, setCardHeight] = useState(360);
  const [fullscreen, setFullscreen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const draggedRef = useRef(false);
  const pendingZoom = useRef<{ x: number; y: number; anchorX: number; anchorY: number } | null>(null);
  const storageKey = `project-scroll-layout:v1:${viewKey}`;
  const expandedProject = projects.find((p) => p.slug === expandedSlug);
  const spatial = mode === "spatial";

  useEffect(() => {
    const desktop = matchMedia("(min-width: 1024px)");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setMode(!desktop.matches ? "mobile" : reduced.matches ? "reduced" : "spatial");
    sync();
    desktop.addEventListener("change", sync);
    reduced.addEventListener("change", sync);
    return () => {
      desktop.removeEventListener("change", sync);
      reduced.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    // Restore arrangements only. Every new visit/filter starts at the first row.
    try {
      const saved: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? "{}");
      if (!saved || typeof saved !== "object") return;
      const valid: Record<string, Offset> = {};
      for (const [slug, value] of Object.entries(saved)) {
        const offset = value as Offset | null;
        if (offset && Number.isFinite(offset.dx) && Number.isFinite(offset.dy)) {
          valid[slug] = { dx: offset.dx, dy: offset.dy };
        }
      }
      setOffsets(valid);
    } catch { /* Storage is optional. */ }
  }, [storageKey]);

  useLayoutEffect(() => {
    if (!spatial) return;
    const viewport = scrollRef.current;
    if (!viewport) return;
    const measure = () => {
      setFrame((old) => old.width === viewport.clientWidth && old.height === viewport.clientHeight
        ? old : { width: viewport.clientWidth, height: viewport.clientHeight });
      const heights = Array.from(viewport.querySelectorAll<HTMLElement>("[data-layout-card]"))
        .map((card) => card.offsetHeight);
      if (heights.length) setCardHeight(Math.max(...heights));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    viewport.querySelectorAll<HTMLElement>("[data-layout-card]").forEach((card) => observer.observe(card));
    measure();
    return () => observer.disconnect();
  }, [spatial, projects]);

  const layout = useMemo(() => {
    const columns = Math.max(1, Math.min(projects.length, frame.width >= 1180 ? 3 : 2));
    const gridWidth = columns * CARD_WIDTH + (columns - 1) * 40;
    const baseWidth = Math.max(frame.width, gridWidth + PADDING * 2);
    const originX = (baseWidth - gridWidth) / 2;
    const positions = projects.map((project, index) => {
      const hash = hashSlug(project.slug);
      const x = originX + (index % columns) * 380 + (hash % 32) - 16;
      const y = PADDING + Math.floor(index / columns) * (cardHeight + 64) + ((hash >> 3) % 32) - 16;
      const saved = offsets[project.slug] ?? { dx: 0, dy: 0 };
      // Keep all arranged cards reachable from the scrollable top/left edges.
      const offset = { dx: Math.max(16 - x, saved.dx), dy: Math.max(16 - y, saved.dy) };
      return { project, x, y, rotate: ((hash >> 6) % 5) - 2, offset };
    });
    return {
      columns,
      positions,
      width: Math.max(baseWidth, ...positions.map((p) => p.x + p.offset.dx + CARD_WIDTH + PADDING)),
      height: Math.max(frame.height / zoom, ...positions.map((p) => p.y + p.offset.dy + cardHeight + PADDING)),
    };
  }, [frame.width, frame.height, projects, cardHeight, offsets, zoom]);
  const scaledWidth = Math.max(frame.width, layout.width * zoom);
  const scaledHeight = Math.max(frame.height, layout.height * zoom);
  const fieldLeft = Math.max(0, (frame.width - layout.width * zoom) / 2);

  const changeZoom = useCallback((next: number, anchorX?: number, anchorY?: number) => {
    const viewport = scrollRef.current;
    if (!viewport || expandedProject) return;
    next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
    const previous = zoomRef.current;
    if (next === previous) return;
    const ax = anchorX ?? viewport.clientWidth / 2;
    const ay = anchorY ?? viewport.clientHeight / 2;
    const left = Math.max(0, (viewport.clientWidth - layout.width * previous) / 2);
    pendingZoom.current = {
      x: (viewport.scrollLeft + ax - left) / previous,
      y: (viewport.scrollTop + ay) / previous,
      anchorX: ax,
      anchorY: ay,
    };
    zoomRef.current = next;
    setZoom(next);
    setHasInteracted(true);
  }, [expandedProject, layout.width]);

  useLayoutEffect(() => {
    const target = pendingZoom.current;
    const viewport = scrollRef.current;
    if (!target || !viewport) return;
    viewport.scrollLeft = target.x * zoom + fieldLeft - target.anchorX;
    viewport.scrollTop = target.y * zoom - target.anchorY;
    pendingZoom.current = null;
  }, [zoom, fieldLeft]);

  useEffect(() => {
    const viewport = scrollRef.current;
    if (!spatial || !viewport || expandedProject) return;
    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey && !event.metaKey) return; // Native wheel/trackpad scroll.
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      changeZoom(zoomRef.current - event.deltaY * 0.002, event.clientX - rect.left, event.clientY - rect.top);
    };
    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [spatial, expandedProject, changeZoom]);

  useEffect(() => {
    const viewport = scrollRef.current;
    if (!spatial || !viewport || expandedProject) return;
    let session: { id: number; x: number; y: number; left: number; top: number; moved: boolean } | null = null;
    let clearClick: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      if (!session) return;
      const finished = session;
      session = null;
      if (viewport.hasPointerCapture(finished.id)) viewport.releasePointerCapture(finished.id);
      if (finished.moved) {
        draggedRef.current = true;
        clearClick = setTimeout(() => { draggedRef.current = false; }, 0);
      }
      setDragging(false);
    };
    const start = (event: PointerEvent) => {
      if (event.button !== 0 || event.pointerType === "touch" || session ||
          (event.target as Element).closest("[data-pan-ignore]")) return;
      clearTimeout(clearClick);
      draggedRef.current = false;
      session = { id: event.pointerId, x: event.clientX, y: event.clientY,
        left: viewport.scrollLeft, top: viewport.scrollTop, moved: false };
    };
    const move = (event: PointerEvent) => {
      if (!session || event.pointerId !== session.id) return;
      const dx = event.clientX - session.x;
      const dy = event.clientY - session.y;
      if (!session.moved && Math.hypot(dx, dy) < 6) return;
      if (!session.moved) {
        session.moved = true;
        viewport.setPointerCapture(event.pointerId);
        setDragging(true);
        setHasInteracted(true);
      }
      event.preventDefault();
      viewport.scrollLeft = session.left - dx;
      viewport.scrollTop = session.top - dy;
    };
    const end = (event: PointerEvent) => { if (event.pointerId === session?.id) stop(); };
    viewport.addEventListener("pointerdown", start);
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    viewport.addEventListener("lostpointercapture", end);
    window.addEventListener("blur", stop);
    return () => {
      stop();
      clearTimeout(clearClick);
      viewport.removeEventListener("pointerdown", start);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      viewport.removeEventListener("lostpointercapture", end);
      window.removeEventListener("blur", stop);
    };
  }, [spatial, expandedProject]);

  useEffect(() => {
    const update = () => setFullscreen(document.fullscreenElement === frameRef.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);

  useEffect(() => {
    if (!expandedProject || !spatial) return;
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus({ preventScroll: true });
    return () => { if (previous?.isConnected) previous.focus({ preventScroll: true }); };
  }, [expandedProject, spatial]);

  function rememberOffset(slug: string, dx: number, dy: number) {
    const next = { ...offsets, [slug]: { dx, dy } };
    setOffsets(next);
    try { sessionStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Optional. */ }
  }

  function reset() {
    setOffsets({});
    zoomRef.current = 1;
    setZoom(1);
    pendingZoom.current = null;
    scrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "instant" });
    try { sessionStorage.removeItem(storageKey); } catch { /* Optional. */ }
  }

  if (!spatial) {
    return (
      <div className="h-full overflow-y-auto">
        <div className={cn("container-wide grid gap-6 py-6 sm:grid-cols-2", mode === "reduced" ? "lg:grid-cols-3" : "lg:hidden")}>
          {projects.map((project, index) => <ProjectCard key={project.slug} project={project} priority={index === 0} />)}
        </div>
        {expandedProject ? <ProjectDrawer project={expandedProject} onClose={onClose} onNavigate={(slug) => {
          const project = projects.find((p) => p.slug === slug);
          if (project) onOpenCard(project);
        }} /> : null}
      </div>
    );
  }

  const toolClass = "grid h-9 w-9 place-items-center rounded-md text-surface-200 transition-colors hover:bg-surface-800 hover:text-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-500 disabled:opacity-40";

  return (
    <div ref={frameRef} className="relative h-full min-h-0 bg-surface-950">
      <div
        ref={scrollRef}
        data-project-scroll=""
        role="region"
        aria-label={`Projects — ${projects.length} project${projects.length === 1 ? "" : "s"}. Scroll to browse or drag to pan.`}
        tabIndex={0}
        onScroll={() => setHasInteracted(true)}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget || event.ctrlKey || event.metaKey || event.altKey || expandedProject) return;
          const viewport = event.currentTarget;
          const page = viewport.clientHeight * 0.9;
          const destinations: Record<string, number> = {
            Home: 0, End: viewport.scrollHeight,
            PageUp: viewport.scrollTop - page, PageDown: viewport.scrollTop + page,
            ArrowUp: viewport.scrollTop - 80, ArrowDown: viewport.scrollTop + 80,
            " ": viewport.scrollTop + (event.shiftKey ? -page : page),
          };
          if (!(event.key in destinations)) return;
          event.preventDefault();
          viewport.scrollTop = destinations[event.key];
        }}
        onClickCapture={(event) => {
          if (!draggedRef.current) return;
          event.preventDefault();
          event.stopPropagation();
          draggedRef.current = false;
        }}
        className={cn("h-full select-none overscroll-contain outline-none [scrollbar-gutter:stable] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent-500",
          expandedProject ? "overflow-hidden" : "overflow-auto", dragging ? "cursor-grabbing" : "cursor-grab")}
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.08) 1.5px, transparent 1.5px)", backgroundSize: "24px 24px" }}
      >
        <div className="relative overflow-clip" style={{ width: scaledWidth, height: scaledHeight }}>
          <div className={cn("absolute left-0 top-0 origin-top-left transition-opacity duration-150", expandedProject && "opacity-30")}
            style={{ width: layout.width, height: layout.height, transform: `translateX(${fieldLeft}px) scale(${zoom})` }}>
            {layout.positions.map(({ project, x, y, rotate, offset }, index) => (
              <div key={project.slug} data-layout-card="" className="absolute w-[340px] hover:z-30 focus-within:z-30"
                inert={Boolean(expandedProject)}
                style={{ left: x, top: y, transform: `rotate(${rotate}deg)` }}>
                <DraggableCard slug={project.slug} dx={offset.dx} dy={offset.dy}
                  bounds={{ left: 16 - x, top: 16 - y }}
                  onDragStart={() => setHasInteracted(true)} onDragEnd={rememberOffset}>
                  <ProjectCard project={project} onOpen={onOpenCard} priority={index < layout.columns} />
                </DraggableCard>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div data-pan-ignore="" className="absolute right-5 top-4 z-50 flex flex-col items-center rounded-lg border border-surface-600 bg-surface-900 p-1.5">
        <div className="group relative">
          <button type="button" aria-label="Scroll, drag and zoom help" aria-describedby="project-scroll-help" className={toolClass}>
            <Info className="h-5 w-5" />
          </button>
          <p id="project-scroll-help" role="tooltip" className="pointer-events-none absolute right-full top-0 mr-3 w-64 rounded-lg border border-surface-600 bg-surface-900 px-3 py-2 text-sm text-surface-100 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
            Scroll to browse. Drag to pan. Use a card’s handle to rearrange it. Ctrl / ⌘ + scroll to zoom.
          </p>
        </div>
        <span aria-hidden className="my-1 h-px w-6 bg-surface-600" />
        <button type="button" aria-label={fullscreen ? "Exit fullscreen" : "Open canvas fullscreen"} aria-pressed={fullscreen} className={toolClass}
          onClick={() => {
            if (document.fullscreenElement) void document.exitFullscreen();
            else void frameRef.current?.requestFullscreen().catch(() => {});
          }}>
          {fullscreen ? <ArrowsIn className="h-5 w-5" /> : <ArrowsOut className="h-5 w-5" />}
        </button>
        <button type="button" aria-label="Reset view and card layout" className={toolClass} disabled={Boolean(expandedProject)} onClick={reset}>
          <ArrowsCounterClockwise className="h-5 w-5" />
        </button>
        <span aria-hidden className="my-1 h-px w-6 bg-surface-600" />
        <button type="button" aria-label="Zoom in" className={toolClass} disabled={Boolean(expandedProject) || zoom >= MAX_ZOOM} onClick={() => changeZoom(zoom + 0.1)}>
          <MagnifyingGlassPlus className="h-5 w-5" />
        </button>
        <button type="button" aria-label="Zoom out" className={toolClass} disabled={Boolean(expandedProject) || zoom <= MIN_ZOOM} onClick={() => changeZoom(zoom - 0.1)}>
          <MagnifyingGlassMinus className="h-5 w-5" />
        </button>
      </div>

      {!hasInteracted && !expandedProject && scaledHeight > frame.height + 1 ? (
        <p className="pointer-events-none absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-surface-600 bg-surface-900 px-4 py-2 text-sm text-surface-100">
          <ArrowDown className="h-4 w-4" /> Scroll to explore · drag to pan
        </p>
      ) : null}

      {expandedProject ? (
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={expandedProject.title} tabIndex={-1}
          className="absolute inset-0 z-40 flex items-center justify-center bg-surface-950/40 p-6 outline-none"
          onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
          onKeyDown={(event) => {
            if (event.key === "Escape") { event.stopPropagation(); onClose(); return; }
            if (event.key !== "Tab" || !event.currentTarget.contains(event.target as Node)) return;
            const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex="0"]'));
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) {
              event.preventDefault(); last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault(); first?.focus();
            }
          }}>
          <ExpandedProjectPanel project={expandedProject} onCollapse={onClose} />
        </div>
      ) : null}
    </div>
  );
}
