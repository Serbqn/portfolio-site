"use client";

import { usePathname } from "next/navigation";

/** Hides the global footer on immersive full-viewport pages. /projects ends
 * at the canvas stage — mandatory snap makes that the hard bottom of the
 * page, so nothing may scroll beneath it. */
export function FooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/projects") return null;
  return <>{children}</>;
}
