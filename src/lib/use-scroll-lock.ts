"use client";

import { useEffect } from "react";

/**
 * Locks page scroll while `locked` is true.
 *
 * The lock MUST go on <html>, not <body>: `overflow: hidden` on body turns
 * body into a scroll container, which silently un-sticks every
 * `position: sticky` descendant — the fixed navbar snapped back to the
 * document top whenever the mobile menu / palette / lightbox opened
 * mid-scroll, leaving the menu invisible below the fold. Locking <html>
 * (the actual scroller) preserves sticky positioning and the current
 * scroll offset. `scrollbar-gutter: stable` on html prevents layout shift.
 */
export function useScrollLock(locked: boolean | null | undefined) {
  useEffect(() => {
    if (!locked) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev;
    };
  }, [locked]);
}
