"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Forces the viewport to the top after every client-side navigation.
 *
 * The global smooth-scroll setting would otherwise animate a reset from
 * the previous route's position.
 *
 * This runs after each pathname change with behavior:"instant" — no glide,
 * no reliance on Next internals. Back/Forward (popstate) is skipped so
 * native scroll restoration keeps working.
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
