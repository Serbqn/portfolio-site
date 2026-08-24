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
import { MagnifyingGlassPlus, MagnifyingGlassMinus, ArrowsCounterClockwise, ArrowsOut, ArrowsIn, DotsSixVertical, Info } from "@phosphor-icons/react";
import { ExpandedProjectPanel } from "@/components/projects/ExpandedProjectPanel";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { cn } from "@/lib/utils";
import type { ProjectFull, ProjectListItem } from "@/lib/types";

const SPRING = { type: "spring" as const, stiffness: 200, damping: 26, mass: 0.8 };
const SCALE_MIN = 0.8;
const SCALE_MAX = 1.4;
/** Minimum pan range from the home position. Grows with the field via
 * `panBounds` (below) so every card stays reachable no matter how many
 * projects exist — without letting you get lost off-canvas. */
const PAN_X_MIN = 340;
const PAN_Y_MIN = 300;

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
  fullBleed = false,
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
  /** Stage mode (/projects): fill the viewport below the navbar and drop
   * corner rounding. Teaser canvases stay fixed-height and rounded. */
  fullBleed?: boolean;
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

  // useReducedMotion resolves SYNCHRONOUSLY on the client's first render
  // (unlike useMediaQuery, which waits for its effect), so any class that
  // depends on it would differ from the server HTML during hydration —
  // and React keeps the server's version. Gate such decisions behind this
  // flag: server + hydration render the pre-mount choice, then a normal
  // post-mount update applies the reduced-motion correction.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // v3: resets everyone onto the new top-anchored default view once.
  const storageKey = `project-canvas:v3:${viewKey}`;
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

  /** True once the visitor actually touches the canvas (press, wheel, or
   * arrow keys) — retires the attention effects so they never compete
   * with real use. */
  const [hasInteracted, setHasInteracted] = useState(false);
  const markInteracted = useCallback(() => setHasInteracted(true), []);

  /** True once the stage has scrolled into view — drives the settle-in
   * entrance. A timer backstop guarantees cards can never stay hidden
   * (e.g. IntersectionObserver unavailable or odd root margins). */
  const [stageEntered, setStageEntered] = useState(false);
  useEffect(() => {
    if (!canvasMode || stageEntered) return;
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setStageEntered(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((en) => en.isIntersecting)) {
          setStageEntered(true);
          io.disconnect();
        }
      },
      { rootMargin: "-12% 0px -12% 0px" },
    );
    io.observe(el);
    const t = window.setTimeout(() => setStageEntered(true), 2500);
    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, [canvasMode, stageEntered]);
  const enterStage = canvasMode && stageEntered;

  /** Auto-revealed control hint: once the stage settles into view, the
   * info-button tooltip shows itself so visitors learn the gestures
   * without hunting for it. The first real canvas manipulation (pan,
   * card drag, keyboard pan, pinch-zoom) retires it permanently for the
   * visit — hover/focus on the info button keeps revealing it after. */
  const [hintAutoVisible, setHintAutoVisible] = useState(false);
  const hintRetiredRef = useRef(false);
  const dismissHint = useCallback(() => {
    hintRetiredRef.current = true;
    setHintAutoVisible(false);
  }, []);

  useEffect(() => {
    if (!enterStage || hintRetiredRef.current) return;
    // Wait out the card settle-in animation before drawing attention.
    const t = window.setTimeout(() => {
      if (!hintRetiredRef.current) setHintAutoVisible(true);
    }, 1100);
    return () => window.clearTimeout(t);
  }, [enterStage]);

  /** Cursor spotlight — feeds --spot-x/--spot-y on the frame; an amber
   * radial veil renders at that point (see the overlay below). */
  const onSpotlightMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
      el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
    },
    [],
  );

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

  // Pan range grows with the field: always far enough to bring the
  // outermost card fully into view (+ half-card margin), never further.
  const panBounds = useMemo(() => {
    let x = PAN_X_MIN;
    let y = PAN_Y_MIN;
    for (const p of positions.values()) {
      x = Math.max(x, Math.abs(p.x) + 150);
      y = Math.max(y, Math.abs(p.y) + 170);
    }
    return { x, y };
  }, [positions]);

  /** Vertical pan that pins the TOP of the card block just inside the
   * frame's top edge — the natural "read from the top" opening view.
   * Positions are mean-centred on the frame, so the block's top edge sits
   * at min(pos.y) minus half a card; panning DOWN by the distance from
   * frame centre brings it into view. */
  const topAnchorPanY = useCallback(() => {
    const el = containerRef.current;
    const frameH = el?.clientHeight || 600;
    const cardH =
      el?.querySelector<HTMLElement>("[data-draggable-card]")?.offsetHeight || 240;
    let minY = 0;
    for (const p of positions.values()) minY = Math.min(minY, p.y);
    const blockTop = minY - cardH / 2;
    // Park the block's top edge 28px below the frame's top edge.
    return clamp(28 - frameH / 2 - blockTop, -panBounds.y, panBounds.y);
  }, [positions, panBounds]);

  // Restore persisted view once, client-side only. A FRESH visit (nothing
  // saved yet) opens anchored to the top of the card block instead of the
  // mean-centred default that hides the first row above the frame edge.
  useEffect(() => {
    if (!canvasMode) return;
    let saved: ViewState | null = null;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) saved = { ...EMPTY_VIEW, ...(JSON.parse(raw) as ViewState) };
    } catch {
      /* ignore malformed state */
    }
    if (saved) {
      panX.set(clamp(saved.x, -panBounds.x, panBounds.x));
      panY.set(clamp(saved.y, -panBounds.y, panBounds.y));
      scale.set(clamp(saved.scale ?? 1, SCALE_MIN, SCALE_MAX));
      setOffsets(saved.offsets ?? {});
      autoAnchorRef.current = false; // saved view wins over auto-anchoring
    } else {
      panX.set(0);
      panY.set(topAnchorPanY());
      scale.set(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasMode]);

  /** True while the field should stay pinned to the top of the card block.
   * The frame's height keeps changing as the stage morphs from teaser to
   * full-bleed, so a one-shot anchor computed at mount lands wrong; a
   * ResizeObserver re-applies it until the visitor actually takes control
   * (pan, zoom, drag, arrow keys). Reset hands control back to the anchor. */
  const autoAnchorRef = useRef(true);
  useEffect(() => {
    if (!canvasMode) return;
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (autoAnchorRef.current && !hasInteracted) panY.set(topAnchorPanY());
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [canvasMode, panY, topAnchorPanY, hasInteracted]);

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
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        // First real pan movement retires the auto hint.
        if (!session.moved) dismissHint();
        session.moved = true;
      }
      panX.set(clamp(session.baseX + dx, -panBounds.x, panBounds.x));
      panY.set(clamp(session.baseY + dy, -panBounds.y, panBounds.y));
    };

    const onPointerUp = (e: PointerEvent) => {
      if (session?.moved) {
        panDraggedRef.current = true;
        autoAnchorRef.current = false; // user took over the view
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
  }, [canvasMode, panX, panY, schedulePersist, expandedSlug, onExpandCard, panBounds, dismissHint]);

  // Pinch / ctrl+wheel zoom — trackpad pinch reports ctrlKey
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !canvasMode) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      dismissHint(); // zooming means the visitor has the canvas figured out
      scale.set(clamp(scale.get() - e.deltaY * 0.002, SCALE_MIN, SCALE_MAX));
      schedulePersist();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [canvasMode, scale, schedulePersist, dismissHint]);

  const zoomBy = useCallback(
    (delta: number) => {
      autoAnchorRef.current = false;
      scale.set(clamp(scale.get() + delta, SCALE_MIN, SCALE_MAX));
      schedulePersist();
    },
    [scale, schedulePersist],
  );

  const resetView = useCallback(() => {
    panX.set(0);
    // Reset re-anchors to the TOP of the card block, not the centred mean —
    // "refresh" should read like going back to page one of the field.
    autoAnchorRef.current = true;
    panY.set(topAnchorPanY());
    scale.set(1);
    setOffsets({});
    persistNow({});
  }, [panX, panY, scale, persistNow, topAnchorPanY]);

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
      markInteracted();
      dismissHint(); // keyboard panning retires the auto hint too
      autoAnchorRef.current = false; // user took over the view
      panX.set(clamp(panX.get() + delta[0], -panBounds.x, panBounds.x));
      panY.set(clamp(panY.get() + delta[1], -panBounds.y, panBounds.y));
      schedulePersist();
    },
    [canvasMode, expandedSlug, panX, panY, schedulePersist, panBounds, markInteracted, dismissHint],
  );

  // Card drag end — record the offset from the card's home slot
  const onCardDragEnd = useCallback(
    (slug: string, dx: number, dy: number) => {
      autoAnchorRef.current = false; // user took over the layout
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

  // Auto-center the expanded panel: solve (cardPos + pan) * scale = 0 for
  // pan, and lift zoom to at least 1× for comfortable reading.
  useEffect(() => {
    if (!expandedSlug || !canvasMode) return;
    const pos = positions.get(expandedSlug);
    if (!pos) return;
    const off = offsets[expandedSlug] ?? { dx: 0, dy: 0 };
    const animations = [
      animate(panX, clamp(-(pos.x + off.dx), -panBounds.x, panBounds.x), SPRING),
      animate(panY, clamp(-(pos.y + off.dy), -panBounds.y, panBounds.y), SPRING),
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
    // Stacked fallback — mobile or reduced motion.
    // `lg:hidden` only when the spatial field will actually render on
    // desktop (motion-safe). Under reduced motion the field never renders,
    // so this grid is the ONLY content at ≥1024px — hiding it there left
    // reduced-motion desktop users staring at a blank stage.
    return (
      <div
        className={cn(
          "grid gap-6 sm:grid-cols-2",
          // `lg:hidden` only while the spatial field will actually own
          // desktop (motion-safe). Under reduced motion the field never
          // renders, so this grid is the ONLY content at ≥1024px — hiding
          // it there left reduced-motion desktop users with a blank stage.
          // Pre-mount stays hidden to match the server (see `mounted`).
          interactive && (!reduceMotion || !mounted)
            ? "lg:hidden"
            : "lg:grid-cols-3",
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
      {/* Canvas frame — static box that clips; never itself transformed.
          The zoom/fullscreen toolbar lives INSIDE the frame: while the frame
          is browser-fullscreen only its subtree renders, so an outside
          toolbar would be invisible and unclickable. */}
      <div
        ref={containerRef}
        {...frameProps}
        onPointerDownCapture={markInteracted}
        onWheelCapture={markInteracted}
        onPointerMove={canvasMode ? onSpotlightMove : undefined}
        className={cn(
          "relative touch-none overflow-hidden border border-surface-700 bg-surface-950 outline-none scroll-mt-32",
          // Stage mode reads the wrapper's animated radius so the border
          // follows the curve instead of being clipped off at the corners.
          fullBleed ? "rounded-[var(--stage-radius,0px)]" : "rounded-2xl",
          interactive
            ? fullBleed
              ? // Wrapper owns the geometry (contained → full-bleed morph);
                // the frame just fills it.
                "h-full w-full focus-visible:border-accent-500"
              : "h-[68vh] min-h-[540px] focus-visible:border-accent-500"
            : "h-[440px]",
          // Grab cursor only while panning is actually available — once a
          // panel is expanded there is nothing to drag, so show the default.
          canvasMode && !expandedSlug && "cursor-grab",
        )}
      >
        {/* Top-right chrome — vertical control rail ([data-pan-ignore]
            keeps card panning off the controls). Top to bottom: help,
            fullscreen, reset, zoom. The info icon reveals the pan/zoom
            hint on hover/focus — it replaces the old bottom-center pill. */}
        {interactive ? (
          <div className="absolute right-4 top-4 z-50 flex items-start gap-2">
            <div
              data-pan-ignore=""
              className="flex flex-col items-center gap-0 rounded-lg border border-surface-600 bg-surface-900/90 p-1.5 backdrop-blur-sm"
            >
              {/* Info — hover/focus tooltip carries the pan/zoom hint. */}
              <div className="group relative">
                <button
                  type="button"
                  aria-label="Pan and zoom help"
                  aria-describedby="canvas-controls-hint"
                  className="grid h-8 w-8 place-items-center rounded-md text-surface-300 transition-colors hover:bg-surface-800 hover:text-accent-400"
                >
                  <Info className="h-5 w-5" />
                </button>
                <span
                  id="canvas-controls-hint"
                  role="tooltip"
                  className={cn(
                    "pointer-events-none absolute right-full top-1/2 z-50 mr-3.5 -translate-y-1/2 whitespace-nowrap rounded-md border border-accent-400/40 bg-surface-900/95 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-accent-400 shadow-[inset_0_0_0_1px_rgba(255,184,106,0.15),0_0_28px_-6px_rgba(255,184,106,0.5)] backdrop-blur-sm transition-opacity duration-150",
                    // Auto-shown once the stage scrolls into view (until the
                    // first real interaction); afterwards hover/focus reveals it.
                    hintAutoVisible && !expandedSlug
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
                  )}
                >
                  Drag anywhere to pan · ⠿ handle arranges a card · pinch or ⌘ scroll to zoom
                </span>
              </div>
              <span aria-hidden className="my-1.5 h-px w-6 bg-surface-600" />
              <button
                type="button"
                onClick={() => {
                  markInteracted();
                  toggleFullscreen();
                }}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-md transition-colors hover:bg-surface-800",
                  isFullscreen ? "text-accent-400" : "text-surface-300 hover:text-surface-0",
                )}
                aria-label={isFullscreen ? "Exit fullscreen" : "Open canvas fullscreen"}
                aria-pressed={isFullscreen}
              >
                {isFullscreen ? (
                  <ArrowsIn className="h-5 w-5" />
                ) : (
                  <ArrowsOut className="h-5 w-5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  markInteracted();
                  resetView();
                }}
                className="grid h-8 w-8 place-items-center rounded-md text-surface-300 transition-colors hover:bg-surface-800 hover:text-surface-0"
                aria-label="Reset view and card layout"
              >
                <ArrowsCounterClockwise className="h-5 w-5" />
              </button>
              <span aria-hidden className="my-1.5 h-px w-6 bg-surface-600" />
              <button
                type="button"
                onClick={() => {
                  markInteracted();
                  zoomBy(0.1);
                }}
                className="grid h-8 w-8 place-items-center rounded-md text-surface-300 transition-colors hover:bg-surface-800 hover:text-surface-0"
                aria-label="Zoom in"
              >
                <MagnifyingGlassPlus className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  markInteracted();
                  zoomBy(-0.1);
                }}
                className="grid h-8 w-8 place-items-center rounded-md text-surface-300 transition-colors hover:bg-surface-800 hover:text-surface-0"
                aria-label="Zoom out"
              >
                <MagnifyingGlassMinus className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : null}

        {/* Cursor spotlight — a faint neutral veil that follows the pointer
            across the dot grid (fed via --spot-x/--spot-y on the frame).
            Painted under the dots so it lights the texture, not the cards. */}
        {canvasMode ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(560px circle at var(--spot-x, 50%) var(--spot-y, 38%), rgba(255, 255, 255, 0.04), transparent 65%)",
            }}
          />
        ) : null}

        {/* Dot grid — fixed texture on the frame: near-black field with a
            sparse neutral gray dot lattice (24px pitch, ~2px dots). */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.08) 1.5px, transparent 1.5px)",
            backgroundSize: "24px 24px",
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
          <motion.div
            className="absolute left-1/2 top-1/2"
            initial={canvasMode ? { opacity: 0, scale: 0.92 } : false}
            animate={enterStage ? { opacity: 1, scale: 1 } : undefined}
            transition={SPRING}
          >
            {projects.map((p, i) => {
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
                  <motion.div
                    initial={canvasMode ? { opacity: 0, y: 16 } : false}
                    animate={enterStage ? { opacity: 1, y: 0 } : undefined}
                    transition={{
                      duration: 0.55,
                      ease: [0.22, 1, 0.36, 1],
                      delay: 0.08 + Math.min(i * 0.06, 0.42),
                    }}
                  >
                    <DraggableCard
                      slug={p.slug}
                      dx={off.dx}
                      dy={off.dy}
                      onDragEnd={onCardDragEnd}
                      onDragStart={dismissHint}
                    >
                      <ProjectCard project={p} onOpen={onOpenCard} />
                    </DraggableCard>
                  </motion.div>
                </div>
              );
            })}
          </motion.div>
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

        {/* Glow ring — breathes until the first real interaction asks it
            to leave (or a panel takes over the viewport). */}
        {canvasMode && enterStage && !hasInteracted && !expandedSlug ? (
          <div
            aria-hidden
            className={cn(
              "animate-glow-breathe pointer-events-none absolute inset-0 z-20",
              fullBleed ? "rounded-[var(--stage-radius,0px)]" : "rounded-2xl",
            )}
            style={{
              boxShadow:
                "inset 0 0 0 1px rgba(255, 184, 106, 0.35), 0 0 44px -6px rgba(255, 184, 106, 0.3)",
            }}
          />
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
  onDragStart,
  children,
}: {
  slug: string;
  dx: number;
  dy: number;
  onDragEnd: (slug: string, dx: number, dy: number) => void;
  /** Fires when a real handle-drag begins (used to retire the auto hint). */
  onDragStart?: () => void;
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
        onDragStart?.();
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
