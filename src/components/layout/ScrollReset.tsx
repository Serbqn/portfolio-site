"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Forces the viewport to the top after every client-side navigation.
 *
 * Two things defeat Next.js's built-in scroll reset on this site:
 * 1. /projects pins `history.scrollRestoration = "manual"` while mounted
 *    (mandatory-snap story), and Next skips its own scroll handling while
 *    the flag is up — so the old scroll offset carries into the next page,
 *    clamped to its bottom.
 * 2. The global `html { scroll-behavior: smooth }` turns whatever reset
 *    survives into a slow glide from the old position.
 *
 * This runs after each pathname change with behavior:"instant" — no glide,
 * no reliance on Next internals. Back/Forward (popstate) is skipped so
 * native scroll restoration keeps working; /projects re-anchors to the top
 * itself by design.
 */
export function ScrollReset() {
  const pathname = usePathname();
  /** Set by popstate before React commits, read+cleared in the path effect. */
  const poppedRef = useRef(false);

  useEffect(() => {
    const onPop = () => {
      poppedRef.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (poppedRef.current) {
      poppedRef.current = false;
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}
