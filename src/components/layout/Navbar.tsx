"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useTransform } from "motion/react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Navbar({
  name = "Serb",
  role = "UI/UX",
  logo,
}: {
  name?: string;
  role?: string;
  logo?: string;
}) {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const blur = useTransform(scrollY, [0, 40], [0, 12]);
  const borderOpacity = useTransform(scrollY, [0, 40], [0, 1]);
  const bgOpacity = useTransform(scrollY, [0, 40], [0, 0.8]);

  return (
    <motion.header
      style={{
        backdropFilter: useTransform(() => `blur(${blur.get()}px)`),
        borderBottomColor: useTransform(() => `rgba(46,46,46,${borderOpacity.get()})`),
        backgroundColor: useTransform(() => `rgba(23,23,23,${bgOpacity.get()})`),
      }}
      className="sticky top-0 z-40 w-full border-b border-transparent"
    >
      <div className="container-wide flex h-16 items-center justify-between">
        <Link
          href="/"
          className="group flex items-center gap-2.5 text-sm font-semibold tracking-tight"
          aria-label="Home"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-surface-950 text-accent-500">
            <svg
              viewBox="0 0 32 32"
              className="h-4 w-4"
              fill="none"
              aria-hidden
            >
              {logo ? (
                <path d={logo} stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              ) : (
                <>
                  <path
                    d="M9 11h14M9 16h10M9 21h14"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                </>
              )}
            </svg>
          </span>
          <span className="text-surface-0">{name}</span>
          <span className="hidden text-surface-500 sm:inline">/</span>
          <span className="hidden font-mono text-xs uppercase tracking-widest text-surface-400 sm:inline">
            {role}
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {links.map((l) => {
            const active =
              l.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-sm transition-colors duration-150 sm:px-3",
                  active
                    ? "text-surface-0"
                    : "text-surface-400 hover:text-surface-0",
                )}
                aria-current={active ? "page" : undefined}
              >
                {l.label}
              </Link>
            );
          })}
          <span
            aria-hidden
            className="mx-1 hidden h-4 w-px bg-surface-700 sm:inline-block"
          />
          <Link
            href="/contact"
            className="ml-1 hidden items-center gap-1.5 rounded-md bg-surface-950 px-3 py-1.5 text-sm font-medium text-white transition-colors duration-150 hover:bg-surface-800 sm:inline-flex"
          >
            Hire me
            <svg
              viewBox="0 0 20 20"
              className="h-3.5 w-3.5"
              fill="none"
              aria-hidden
            >
              <path
                d="M5 10h10M11 6l4 4-4 4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </nav>
      </div>
    </motion.header>
  );
}
