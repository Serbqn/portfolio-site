"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type Frame = {
  src: string;
  alt: string;
  caption?: string;
};

type Props = {
  /** First item is the main cover, rest are gallery frames. */
  frames: Frame[];
  /** Project title shown in the browser tab. */
  title: string;
  /** URL bar shown in the address bar. */
  url?: string;
  /** Optional accent theme: "dark" (default) or "light". */
  theme?: "dark" | "light";
};

/**
 * BrowserFrame — a creative way to present project screenshots.
 *
 * Each project renders as a macOS-style browser window: URL bar + traffic
 * lights on top, the screenshot inside. Hovering the frame subtly tilts and
 * glows; scrolling brings the next frame into view with a reveal animation.
 */
export function BrowserFrame({
  frames,
  title,
  url = "https://",
  theme = "dark",
}: Props) {
  if (!frames.length) return null;
  const [main, ...rest] = frames;

  return (
    <div className={cn(rest.length > 0 && "space-y-8")}>
      {/* Main frame */}
      <Frame title={title} url={url} theme={theme} index={0}>
        <Image
          src={main.src}
          alt={main.alt}
          fill
          sizes="(min-width: 1024px) 1152px, 100vw"
          className="object-cover object-top"
          priority
        />
      </Frame>

      {/* Gallery frames */}
      {rest.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {rest.map((f, i) => (
            <div
              key={f.src}
              className={cn(
                "group relative block rounded-2xl outline-none",
              )}
            >
              <Frame
                title={f.caption ?? title}
                url={url}
                theme={theme}
                index={i + 1}
                compact
              >
                <Image
                  src={f.src}
                  alt={f.alt}
                  fill
                  sizes="(min-width: 640px) 50vw, 100vw"
                  className="object-cover object-top"
                />
              </Frame>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function Frame({
  title,
  url,
  theme,
  index,
  compact,
  children,
}: {
  title: string;
  url: string;
  theme: "dark" | "light";
  index: number;
  compact?: boolean;
  children: React.ReactNode;
}) {
  const isDark = theme === "dark";
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border transition-all duration-500 ease-out-soft",
        isDark
          ? "border-surface-700 bg-surface-950"
          : "border-surface-300 bg-surface-50",
        "shadow-[0_0_0_1px_rgba(62,207,142,0.04)]",
        "group-hover:border-accent-600 group-hover:shadow-[0_0_60px_-10px_rgba(62,207,142,0.25)]",
        compact ? "aspect-[16/10]" : "aspect-[16/9]",
      )}
      style={{
        // Subtle 3D tilt on hover, per-frame angle for variety.
        transform: `perspective(1200px) rotateX(${compact ? 1.5 : 0.5}deg) rotateY(${index % 2 === 0 ? -1 : 1}deg)`,
      }}
    >
      {/* Browser chrome */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 z-10 flex items-center gap-2 border-b px-3",
          compact ? "h-7" : "h-9",
          isDark
            ? "border-surface-700 bg-surface-950"
            : "border-surface-200 bg-surface-100",
        )}
      >
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
        </span>
        <span
          className={cn(
            "mx-auto flex items-center gap-1.5 truncate rounded-md px-2 py-0.5 font-mono text-[10px]",
            compact ? "max-w-[60%]" : "max-w-[55%]",
            isDark
              ? "bg-surface-800 text-surface-200"
              : "bg-white text-surface-700",
          )}
        >
          <svg
            viewBox="0 0 20 20"
            className="h-3 w-3 shrink-0 text-accent-400"
            fill="currentColor"
            aria-hidden
          >
            <path d="M10 2a4 4 0 0 0-4 4v3H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-1V6a4 4 0 0 0-4-4Zm-2 7V6a2 2 0 1 1 4 0v3H8Z" />
          </svg>
          <span className="truncate">
            {url}
            <span className="opacity-70">{title.toLowerCase().replace(/\s+/g, "-")}</span>
          </span>
        </span>
        <span className="flex items-center gap-1">
          <span
            aria-hidden
            className={cn(
              "h-3 w-3 rounded-sm border",
              isDark ? "border-surface-700" : "border-surface-300",
            )}
          />
          <span
            aria-hidden
            className={cn(
              "h-3 w-3 rounded-sm border",
              isDark ? "border-surface-700" : "border-surface-300",
            )}
          />
        </span>
      </div>

      {/* Screenshot */}
      <div
        className={cn(
          "absolute inset-0",
          compact ? "pt-7" : "pt-9",
        )}
      >
        {children}
      </div>

      {/* Subtle scanline glow on hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(180deg, rgba(62,207,142,0.06) 0%, transparent 30%)",
        }}
      />
    </div>
  );
}
