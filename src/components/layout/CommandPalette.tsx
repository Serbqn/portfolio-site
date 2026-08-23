"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { MagnifyingGlass, ArrowRight, FileText } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useScrollLock } from "@/lib/use-scroll-lock";
import type { ProjectListItem } from "@/lib/types";

type Item = {
  label: string;
  hint?: string;
  href: string;
  group: "Pages" | "Projects";
};

/**
 * CommandPalette — ⌘K / Ctrl+K quick-jump for pages and projects.
 * Keyboard-first: arrows to move, Enter to open, Escape to close.
 */
export function CommandPalette({
  projects,
  open,
  onOpenChange,
}: {
  projects: ProjectListItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const items = useMemo<Item[]>(() => {
    const pages: Item[] = [
      { label: "Home", href: "/", group: "Pages" },
      { label: "Projects", hint: "Explore the canvas", href: "/projects", group: "Pages" },
      { label: "About", href: "/about", group: "Pages" },
      { label: "Contact", href: "/contact", group: "Pages" },
    ];
    const proj: Item[] = projects.map((p) => ({
      label: p.title,
      hint: `${p.year} · ${p.client}`,
      href: `/projects/${p.slug}`,
      group: "Projects" as const,
    }));
    return [...pages, ...proj];
  }, [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.hint?.toLowerCase().includes(q),
    );
  }, [items, query]);

  // Reset state whenever the palette opens
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIndex(0);
      // Focus after paint so the input exists
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  // Global ⌘K / Ctrl+K toggle
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const go = useCallback(
    (href: string) => {
      close();
      router.push(href);
    },
    [close, router],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && filtered[activeIndex]) {
        e.preventDefault();
        go(filtered[activeIndex].href);
      }
    },
    [filtered, activeIndex, close, go],
  );

  // Keep the active item in view
  useEffect(() => {
    const el = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // Lock page scroll while open (on <html> — see hook)
  useScrollLock(open);

  let lastGroup: Item["group"] | null = null;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="command-palette"
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[70] flex items-start justify-center bg-surface-950/80 px-4 pt-[12vh] backdrop-blur-sm"
          onClick={close}
          onKeyDown={onKeyDown}
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="w-full max-w-xl overflow-hidden rounded-2xl border border-surface-600 bg-surface-800 shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-surface-700 px-4">
              <MagnifyingGlass className="h-4 w-4 shrink-0 text-surface-400" aria-hidden />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                placeholder="Jump to a page or project…"
                aria-label="Search pages and projects"
                className="h-12 w-full bg-transparent text-sm text-surface-0 outline-none placeholder:text-surface-400"
              />
              <kbd className="hidden shrink-0 rounded-md border border-surface-600 bg-surface-900 px-1.5 py-0.5 font-mono text-[10px] uppercase text-surface-400 sm:block">
                Esc
              </kbd>
            </div>

            {/* Results */}
            <ul ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <li className="px-3 py-8 text-center text-sm text-surface-400">
                  Nothing matches “{query}”.
                </li>
              ) : (
                filtered.map((item, i) => {
                  const showGroup = item.group !== lastGroup;
                  lastGroup = item.group;
                  const isActive = i === activeIndex;
                  return (
                    <li key={`${item.group}-${item.href}`}>
                      {showGroup ? (
                        <p className="px-3 pb-1 pt-3 font-mono text-[10px] uppercase tracking-widest text-surface-400 first:pt-1">
                          {item.group}
                        </p>
                      ) : null}
                      <Link
                        href={item.href}
                        onClick={(e) => {
                          e.preventDefault();
                          go(item.href);
                        }}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-150",
                          isActive
                            ? "bg-accent-500/10 text-surface-0"
                            : "text-surface-200",
                        )}
                        aria-current={isActive}
                      >
                        {item.group === "Projects" ? (
                          <FileText className="h-4 w-4 shrink-0 text-accent-400" aria-hidden />
                        ) : (
                          <ArrowRight
                            className={cn(
                              "h-4 w-4 shrink-0",
                              isActive ? "text-accent-500" : "text-surface-400",
                            )}
                            aria-hidden
                          />
                        )}
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.hint ? (
                          <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-surface-400">
                            {item.hint}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })
              )}
            </ul>

            {/* Footer hints */}
            <div className="flex items-center gap-4 border-t border-surface-700 px-4 py-2.5">
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-surface-400">
                <kbd className="rounded border border-surface-600 bg-surface-900 px-1">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-surface-400">
                <kbd className="rounded border border-surface-600 bg-surface-900 px-1">↵</kbd>
                Open
              </span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
