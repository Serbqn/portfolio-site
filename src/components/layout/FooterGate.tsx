"use client";

import { usePathname } from "next/navigation";

/** /projects owns a full-height browsing viewport with its own native scroll. */
export function FooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/projects") return null;
  return <>{children}</>;
}
