"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

type GalleryImage = {
  src: string;
  alt: string;
  caption?: string;
};

type Props = {
  images: GalleryImage[];
  /** Optional className for the trigger wrapper. */
  className?: string;
};

/**
 * ImageLightbox — click any gallery image to open a full-size modal
 * with a smooth shared-layout transition powered by Motion.
 *
 * Uses `layoutId` so the thumbnail morphs into the full image on open
 * and morphs back on close. Keyboard: Escape closes, Arrow keys navigate.
 */
export function ImageLightbox({ images, className }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const open = useCallback((index: number) => setActiveIndex(index), []);
  const close = useCallback(() => setActiveIndex(null), []);
  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev === null ? null : (prev + 1) % images.length));
  }, [images.length]);
  const goPrev = useCallback(() => {
    setActiveIndex((prev) =>
      prev === null ? null : (prev - 1 + images.length) % images.length,
    );
  }, [images.length]);

  // Keyboard: Escape to close, ArrowLeft/ArrowRight to navigate
  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, close, goNext, goPrev]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (activeIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeIndex]);

  return (
    <>
      {/* Thumbnail grid */}
      <div className={cn("grid gap-6 sm:grid-cols-2", className)}>
        {images.map((img, i) => (
          <button
            key={img.src}
            type="button"
            onClick={() => open(i)}
            className="group relative block w-full cursor-zoom-in overflow-hidden rounded-2xl border border-surface-700 bg-surface-800 transition-colors duration-150 hover:border-surface-500 focus-visible:border-accent-500"
          >
            <motion.div
              layoutId={`gallery-img-${img.src}`}
              className="relative aspect-[16/10] w-full"
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-cover object-top transition-transform duration-500 ease-out-soft group-hover:scale-[1.02]"
              />
            </motion.div>
            {img.caption ? (
              <div className="px-4 py-3 text-left">
                <p className="text-xs text-surface-400">{img.caption}</p>
              </div>
            ) : null}
          </button>
        ))}
      </div>

      {/* Lightbox overlay */}
      <AnimatePresence>
        {activeIndex !== null && (
          <motion.div
            key="lightbox-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-surface-950/90 backdrop-blur-sm"
            onClick={close}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={close}
              className="absolute top-4 right-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-surface-700 bg-surface-900 text-surface-200 transition-colors hover:border-surface-500 hover:text-surface-0"
              aria-label="Close lightbox"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-4 z-10 font-mono text-xs uppercase tracking-widest text-surface-400">
              {activeIndex + 1} / {images.length}
            </div>

            {/* Previous arrow */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute left-4 top-1/2 z-10 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full border border-surface-700 bg-surface-900 text-surface-200 transition-colors hover:border-surface-500 hover:text-surface-0"
                aria-label="Previous image"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}

            {/* Next arrow */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute right-4 top-1/2 z-10 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full border border-surface-700 bg-surface-900 text-surface-200 transition-colors hover:border-surface-500 hover:text-surface-0"
                aria-label="Next image"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            )}

            {/* Full-size image */}
            <motion.div
              layoutId={`gallery-img-${images[activeIndex].src}`}
              className="relative mx-4 flex max-h-[85vh] max-w-[90vw] items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={images[activeIndex].src}
                alt={images[activeIndex].alt}
                width={1920}
                height={1200}
                className="max-h-[85vh] w-auto max-w-[90vw] rounded-xl object-contain"
                priority
              />
            </motion.div>

            {/* Caption */}
            {images[activeIndex].caption && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-lg border border-surface-700 bg-surface-900/80 px-4 py-2 backdrop-blur-sm">
                <p className="text-sm text-surface-200">
                  {images[activeIndex].caption}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}