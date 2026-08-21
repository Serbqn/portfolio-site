"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  animate,
  motion,
  useDragControls,
  useMotionValue,
  useReducedMotion,
  type MotionValue,
} from "motion/react";
import { MagnifyingGlassPlus, MagnifyingGlassMinus, ArrowsCounterClockwise, ArrowsOut, ArrowsIn, DotsSixVertical } from "@phosphor-icons/react";
import { ExpandedProjectPanel } from "@/components/projects/ExpandedProjectPanel";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { cn } from "@/lib/utils";
import type { ProjectFull, ProjectListItem } from "@/lib/types";

const SPRING = { type: "spring" as const, stiffness: 200, damping: 26, mass: 0.8 };
const SCALE_MIN = 0.8;
const SCALE_MAX = 1.4;
/** How far the field may be panned from its home position. The centered
 * grid fits the frame, so modest limits keep every card within reach —
 * no more getting lost off-canvas. */
const PAN_X_LIMIT = 340;
const PAN_Y_LIMIT = 300;

/** Deterministic pseudo-random jitter from the slug so layouts are stable across renders. */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

type ViewState = {
  x: number;
  y: number;
  scale: number;
  /** Per-card drag offsets from their home grid slot. */
  offsets: Record<string, { dx: number; dy: number }>;
};

const EMPTY_VIEW: ViewState = { x: 0, y: 0, scale: 1, offsets: {} };

/**
 * ProjectCanvas — a spatial field of individually draggable project cards.
 *
 * Desktop (≥1024px): grab any card to rearrange it; drag the dotted
 * background to pan the whole field; pinch (ctrl+wheel) or the toolbar
 * zooms between 0.8× and 1.4×; arrow keys pan while focused. Cards stay
 * clickable — a drag only starts once the pointer actually moves.
 * Mobile or reduced-motion: collapses to a simple stacked grid.
 */
export function ProjectCanvas({
  projects,
  interactive = true,
  viewKey = "canvas",
  className,
  onOpenCard,
  expandedSlug = null,
  onExpandCard,
}: {
  projects: ProjectFull[];
  /** Enable drag/zoom/pan. Off = locked teaser (home page). */
  interactive?: boolean;
  /** sessionStorage key suffix so multiple canvases don't share state. */
  viewKey?: string;
  className?: string;
  /** Present → plain card clicks fire this (side drawer) instead of
   * navigating. Modifier-clicks still navigate via the card's href. */
  onOpenCard?: (project: ProjectListItem) => void;
  /** Slug of the card currently expanded into a tabbed panel. */
  expandedSlug?: string | null;
  /** Expand a card in place, or collapse with null. */
  onExpandCard?: (slug: string | null) => void;
}) {
  const reduceMotion = useReducedMotion();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  // Field renders on desktop unless reduced motion; interactions only when interactive.
  const showField = isDesktop && !reduceMotion;
  const canvasMode = interactive && showField;

  const storageKey = `project-canvas:v2:${viewKey}`;
  const [offsets, setOffsets] = useState<Record<string, { dx: number; dy: number }>>({});

  // Shared pan/zoom values — mutated by background drag, toolbar, and keyboard.
  const panX = useMotionValue(0);
  const panY = useMotionValue(0);
  const scale = useMotionValue(1);

  const persistPan = useRef<number | undefined>(undefined);
  const persistOffsets = useRef<number | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  /** True between a completed pan gesture and the click it produces —
   * used to swallow the click so panning never opens a project. */
  const panDraggedRef = useRef(false);
  /** Browser fullscreen state for the canvas frame. */
  const [isFullscreen, setIsFullscreen] = useState(false);

  const readSaved = useCallback((): ViewState => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) return { ...EMPTY_VIEW, ...(JSON.parse(raw) as ViewState) };
    } catch {
      /* ignore malformed state */
    }
    return EMPTY_VIEW;
  }, [storageKey]);

  // Restore persisted view once, client-side only
  useEffect(() => {
    if (!canvasMode) return;
    const saved = readSaved();
    panX.set(clamp(saved.x, -PAN_X_LIMIT, PAN_X_LIMIT));
    panY.set(clamp(saved.y, -PAN_Y_LIMIT, PAN_Y_LIMIT));
    scale.set(clamp(saved.scale ?? 1, SCALE_MIN, SCALE_MAX));
    setOffsets(saved.offsets ?? {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasMode]);

  const persistNow = useCallback(
    (nextOffsets?: Record<string, { dx: number; dy: number }>) => {
      try {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({
            x: panX.get(),
            y: panY.get(),
            scale: scale.get(),
            offsets: nextOffsets ?? offsets,
          }),
        );
      } catch {
        /* storage unavailable */
      }
    },
    [storageKey, panX, panY, scale, offsets],
  );

  // Debounced persistence for pan/zoom gestures
  const schedulePersist = useCallback(() => {
    window.clearTimeout(persistPan.current);
    persistPan.current = window.setTimeout(() => persistNow(), 400);
  }, [persistNow]);

  // The untransformed FRAME is the pan hit-area: it always covers itself
  // exactly (no zoom/pan can expose dead zones). Pan is implemented with
  // plain pointer events — deterministic, no gesture-library quirks.
  // Handles opt out via [data-pan-ignore] and drive their own card drag.
  // Panning is suspended entirely while a panel is expanded.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !canvasMode || expandedSlug) return;

    let session: {
      startX: number;
      startY: number;
      baseX: number;
      baseY: number;
      moved: boolean;
    } | null = null;

    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as Element | null)?.closest?.("[data-pan-ignore]")) return;
      panDraggedRef.current = false;
      session = {
        startX: e.clientX,
        startY: e.clientY,
        baseX: panX.get(),
        baseY: panY.get(),
        moved: false,
      };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!session) return;
      const dx = e.clientX - session.startX;
      const dy = e.clientY - session.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) session.moved = true;
      panX.set(clamp(session.baseX + dx, -PAN_X_LIMIT, PAN_X_LIMIT));
      panY.set(clamp(session.baseY + dy, -PAN_Y_LIMIT, PAN_Y_LIMIT));
    };

    const onPointerUp = (e: PointerEvent) => {
      if (session?.moved) {
        panDraggedRef.current = true;
        schedulePersist();
      } else if (
        expandedSlug &&
        onExpandCard &&
        !(e.target as Element | null)?.closest?.("[data-expanded-panel], [data-draggable-card]")
      ) {
        // Clean click on empty canvas while a panel is expanded → collapse.
        onExpandCard(null);
      }
      session = null;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    el.addEventListener("pointerdown", onPointerDown);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [canvasMode, panX, panY, schedulePersist, expandedSlug, onExpandCard]);

  // Pinch / ctrl+wheel zoom — trackpad pinch reports ctrlKey
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !canvasMode) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      scale.set(clamp(scale.get() - e.deltaY * 0.002, SCALE_MIN, SCALE_MAX));
      schedulePersist();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [canvasMode, scale, schedulePersist]);

  const zoomBy = useCallback(
    (delta: number) => {
      scale.set(clamp(scale.get() + delta, SCALE_MIN, SCALE_MAX));
      schedulePersist();
    },
    [scale, schedulePersist],
  );

  const resetView = useCallback(() => {
    panX.set(0);
    panY.set(0);
    scale.set(1);
    setOffsets({});
    persistNow({});
  }, [panX, panY, scale, persistNow]);

  // Track browser fullscreen state (user may also exit via F11 / Esc)
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      el.requestFullscreen?.();
    }
  }, []);

  // Arrow-key panning while the canvas has focus (suspended when a panel
  // is expanded so arrows can be used inside the panel content)
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!canvasMode || expandedSlug) return;
      const step = 120;
      const pan: Record<string, [number, number]> = {
        ArrowLeft: [step, 0],
        ArrowRight: [-step, 0],
        ArrowUp: [0, step],
        ArrowDown: [0, -step],
      };
      const delta = pan[e.key];
      if (!delta) return;
      e.preventDefault();
      panX.set(clamp(panX.get() + delta[0], -PAN_X_LIMIT, PAN_X_LIMIT));
      panY.set(clamp(panY.get() + delta[1], -PAN_Y_LIMIT, PAN_Y_LIMIT));
      schedulePersist();
    },
    [canvasMode, expandedSlug, panX, panY, schedulePersist],
  );

  // Card drag end — record the offset from the card's home slot
  const onCardDragEnd = useCallback(
    (slug: string, dx: number, dy: number) => {
      setOffsets((prev) => {
        const next = { ...prev, [slug]: { dx, dy } };
        window.clearTimeout(persistOffsets.current);
        persistOffsets.current = window.setTimeout(() => persistNow(next), 200);
        return next;
      });
    },
    [persistNow],
  );

  /** A11y + interaction props for the static frame. */
  const frameProps = interactive
    ? {
        role: "application" as const,
        "aria-roledescription": "spatial canvas",
        "aria-label": `Project canvas — ${projects.length} projects. Drag anywhere to pan, control plus scroll to zoom, use a card's handle to rearrange it.`,
        tabIndex: 0,
        onKeyDown,
      }
    : { "aria-label": `Featured projects — ${projects.length}` };

  // Loose-grid home positions with deterministic jitter, centered on the
  // frame so the constellation never hangs off one side at rest.
  const positions = useMemo(() => {
    const raw = projects.map((p, i) => {
      const h = hashStr(p.slug);
      const col = i % 3;
      const row = Math.floor(i / 3);
      return {
        slug: p.slug,
        x: col * 380 + (h % 56) - 28,
        y: row * 330 + ((h >> 3) % 48) - 24,
        rotate: ((h >> 6) % 5) - 2,
      };
    });
    const meanX = raw.reduce((s, c) => s + c.x, 0) / (raw.length || 1);
    const meanY = raw.reduce((s, c) => s + c.y, 0) / (raw.length || 1);
    return new Map(
      raw.map((c) => [
        c.slug,
        { x: c.x - meanX, y: c.y - meanY, rotate: c.rotate },
      ]),
    );
  }, [projects]);

  // Auto-center the expanded panel: solve (cardPos + pan) * scale = 0 for
  // pan, and lift zoom to at least 1× for comfortable reading.
  useEffect(() => {
    if (!expandedSlug || !canvasMode) return;
    const pos = positions.get(expandedSlug);
    if (!pos) return;
    const off = offsets[expandedSlug] ?? { dx: 0, dy: 0 };
    const animations = [
      animate(panX, clamp(-(pos.x + off.dx), -PAN_X_LIMIT, PAN_X_LIMIT), SPRING),
      animate(panY, clamp(-(pos.y + off.dy), -PAN_Y_LIMIT, PAN_Y_LIMIT), SPRING),
    ];
    if (scale.get() < 1) {
      animations.push(animate(scale, 1, SPRING));
    }
    return () => animations.forEach((a) => a.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedSlug, positions, offsets]);

  // Align the frame flush below the sticky chrome when a panel opens, so
  // the expanded card is never half-scrolled under the filter bar.
  useEffect(() => {
    if (!expandedSlug || !canvasMode) return;
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [expandedSlug, canvasMode]);

  if (!showField) {
    // Stacked fallback — mobile or reduced motion
    return (
      <div
        className={cn(
          "grid gap-6 sm:grid-cols-2",
          // Interactive canvas only exists ≥1024px — hide this fallback there.
          interactive ? "lg:hidden" : "lg:grid-cols-3",
          className,
        )}
      >
        {projects.map((p) => (
          // No onOpen here: below the canvas breakpoint, cards navigate to
          // the standalone project page instead of expanding in place.
          <ProjectCard key={p.slug} project={p} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Zoom toolbar */}
      {interactive ? (
        <div
          data-pan-ignore=""
          className="absolute right-4 top-4 z-50 flex items-center gap-1 rounded-lg border border-surface-600 bg-surface-900/90 p-1 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={() => zoomBy(0.1)}
            className="grid h-7 w-7 place-items-center rounded-md text-surface-300 transition-colors hover:bg-surface-800 hover:text-surface-0"
            aria-label="Zoom in"
          >
            <MagnifyingGlassPlus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => zoomBy(-0.1)}
            className="grid h-7 w-7 place-items-center rounded-md text-surface-300 transition-colors hover:bg-surface-800 hover:text-surface-0"
            aria-label="Zoom out"
          >
            <MagnifyingGlassMinus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={resetView}
            className="grid h-7 w-7 place-items-center rounded-md text-surface-300 transition-colors hover:bg-surface-800 hover:text-surface-0"
            aria-label="Reset view and card layout"
          >
            <ArrowsCounterClockwise className="h-4 w-4" />
          </button>
          <span aria-hidden className="mx-0.5 h-5 w-px bg-surface-600" />
          <button
            type="button"
            onClick={toggleFullscreen}
            className={cn(
              "grid h-7 w-7 place-items-center rounded-md transition-colors hover:bg-surface-800",
              isFullscreen ? "text-accent-400" : "text-surface-300 hover:text-surface-0",
            )}
            aria-label={isFullscreen ? "Exit fullscreen" : "Open canvas fullscreen"}
            aria-pressed={isFullscreen}
          >
            {isFullscreen ? (
              <ArrowsIn className="h-4 w-4" weight="bold" />
            ) : (
              <ArrowsOut className="h-4 w-4" weight="bold" />
            )}
          </button>
        </div>
      ) : null}

      {/* Canvas frame — static box that clips; never itself transformed */}
      <div
        ref={containerRef}
        {...frameProps}
        className={cn(
          "relative touch-none overflow-hidden rounded-2xl border border-surface-700 bg-surface-950/50 outline-none scroll-mt-32",
          interactive
            ? "h-[68vh] min-h-[540px] focus-visible:border-accent-500"
            : "h-[440px]",
          // Grab cursor only while panning is actually available — once a
          // panel is expanded there is nothing to drag, so show the default.
          canvasMode && !expandedSlug && "cursor-grab",
        )}
      >
        {/* Faint dot grid — fixed texture on the frame */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,107,53,0.10) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Moving field — the frame's pointer handlers pan this layer from
            ANY point (gaps or on top of cards). Cards opt out via their
            drag handles ([data-pan-ignore] + stopPropagation). */}
        <motion.div
          // A pan that ends over a card must not open the project beneath
          // the release point. Scoped to the field so toolbar buttons and
          // other frame chrome keep working right after a pan.
          onClickCapture={(e) => {
            if (
              panDraggedRef.current &&
              (e.target as Element | null)?.closest?.("[data-field-layer]")
            ) {
              e.preventDefault();
              e.stopPropagation();
              panDraggedRef.current = false;
            }
          }}
          style={{ x: panX, y: panY, scale }}
          transition={SPRING}
          data-field-layer=""
          className="absolute inset-0 select-none"
        >
          <div className="absolute left-1/2 top-1/2">
            {projects.map((p) => {
              if (expandedSlug === p.slug) return null; // rendered full-field below
              const pos = positions.get(p.slug);
              if (!pos) return null;
              const off = offsets[p.slug] ?? { dx: 0, dy: 0 };
              const dimmed = Boolean(expandedSlug);
              return (
                <div
                  key={p.slug}
                  className={cn(
                    "pointer-events-auto absolute transition-opacity duration-300",
                    // hover:z-30 lifts the hovered card above overlapping
                    // neighbours so its arrange handle is always reachable.
                    "w-[340px] hover:z-30",
                    dimmed && "opacity-25",
                  )}
                  style={{
                    transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) rotate(${pos.rotate}deg)`,
                  }}
                >
                  <DraggableCard
                    slug={p.slug}
                    dx={off.dx}
                    dy={off.dy}
                    onDragEnd={onCardDragEnd}
                  >
                    <ProjectCard project={p} onOpen={onOpenCard} />
                  </DraggableCard>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Expanded panel — pinned to the untransformed frame glass so it
            is always perfectly centered, whatever the pan/zoom state.
            The wrapper is pointer-transparent: only the panel itself
            catches clicks, so toolbar + canvas stay usable around it. */}
        {(() => {
          const project = projects.find((p) => p.slug === expandedSlug);
          if (!interactive || !project) return null;
          return (
            <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center p-6">
              <ExpandedProjectPanel
                project={project}
                onCollapse={() => onExpandCard?.(null)}
              />
            </div>
          );
        })()}

        {/* Interaction hint */}
        {interactive ? (
          <p className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-surface-700 bg-surface-900/80 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-surface-400 backdrop-blur-sm">
            Drag anywhere to pan · ⠿ handle arranges a card · pinch or ⌘ scroll to zoom
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * DraggableCard — wraps a card so it can be picked up and moved.
 * The offset persists across sessions; the card itself stays a working link.
 */
function DraggableCard({
  slug,
  dx,
  dy,
  onDragEnd,
  children,
}: {
  slug: string;
  dx: number;
  dy: number;
  onDragEnd: (slug: string, dx: number, dy: number) => void;
  children: React.ReactNode;
}) {
  const x = useMotionValue(dx);
  const y = useMotionValue(dy);
  const controls = useDragControls();
  const handleRef = useRef<HTMLButtonElement>(null);
  /** True between the start of a real drag and the click that follows it. */
  const draggedRef = useRef(false);

  // Sync external resets (e.g. "Reset view") into the motion values
  useEffect(() => {
    x.set(dx);
    y.set(dy);
  }, [dx, dy, x, y]);

  // Native pointerdown on the handle: stop the field's native pan listener
  // from ever seeing this press, then hand the gesture to the card drag.
  useEffect(() => {
    const el = handleRef.current;
    if (!el) return;
    const onPointerDown = (e: PointerEvent) => {
      e.stopPropagation();
      controls.start(e);
    };
    el.addEventListener("pointerdown", onPointerDown);
    return () => el.removeEventListener("pointerdown", onPointerDown);
  }, [controls]);

  return (
    <motion.div
      data-draggable-card={slug}
      drag
      dragListener={false}
      dragControls={controls}
      dragMomentum={false}
      dragElastic={0.12}
      style={{ x, y }}
      whileDrag={{ scale: 1.03, zIndex: 30 }}
      onDragStart={() => {
        draggedRef.current = true;
      }}
      onDragEnd={() => {
        onDragEnd(slug, x.get(), y.get());
      }}
      className="relative"
    >
      {/* Plain div that (a) swallows the browser's NATIVE link/image dragstart —
          it fires pointercancel and silently kills Motion's gesture — and
          (b) blocks the click that follows a completed handle-drag so the
          card's link doesn't navigate after being dropped. Pure taps pass. */}
      <div
        onDragStart={(e) => e.preventDefault()}
        onClickCapture={(e) => {
          if (draggedRef.current) {
            e.preventDefault();
            e.stopPropagation();
            draggedRef.current = false;
          }
        }}
        className="group relative [&_img]:pointer-events-none"
      >
        {children}
        {/* Arrange handle — the ONLY way to move a card. Dragging anywhere
            else on the canvas pans the whole field. The pointerdown listener
            is NATIVE because Motion's pan listener on the field layer is
            native too — a React stopPropagation would fire too late. */}
        <button
          ref={handleRef}
          type="button"
          data-pan-ignore=""
          aria-label={`Move ${slug} card`}
          className="absolute right-3 top-3 z-20 grid h-8 w-8 cursor-grab place-items-center rounded-full border border-surface-600 bg-surface-950/80 text-surface-300 opacity-0 shadow-lift backdrop-blur-sm transition-opacity duration-150 hover:border-accent-500 hover:text-accent-400 focus-visible:opacity-100 group-hover:opacity-100 active:cursor-grabbing"
        >
          <DotsSixVertical className="h-4 w-4" weight="bold" />
        </button>
      </div>
    </motion.div>
  );
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
