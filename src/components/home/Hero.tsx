"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import type { Hero } from "@/lib/types";

const tapSpring = { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.5 };

export function Hero({
  hero,
  name,
  availability,
}: {
  hero: Hero;
  name: string;
  availability: string;
}) {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
      >
        <div className="absolute inset-0 grid-lines opacity-40" />
      </div>

      <div className="container-wide pt-20 pb-section sm:pt-28">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            <p className="eyebrow">
              <span className="eyebrow-dot" />
              {hero.eyebrow}
            </p>
            <h1 className="mt-6 text-display-1 font-semibold tracking-tight text-balance text-surface-0">
              {hero.headline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-surface-300 sm:text-xl">
              {hero.subheadline}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={tapSpring}
              >
                <Link
                  href={hero.primaryCta.href}
                  className="group inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-surface-950 px-5 text-sm font-medium text-white transition-colors duration-150 hover:bg-surface-800"
                >
                  {hero.primaryCta.label}
                  <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={tapSpring}
              >
                <Link
                  href={hero.secondaryCta.href}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-surface-700 bg-surface-900 px-5 text-sm font-medium text-surface-0 transition-colors duration-150 hover:bg-surface-800"
                >
                  {hero.secondaryCta.label}
                </Link>
              </motion.div>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <dl className="grid gap-6 border-l border-surface-700 pl-6 sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <dt className="font-mono text-xs uppercase tracking-widest text-surface-400">
                  Designer
                </dt>
                <dd className="mt-1 text-base font-medium text-surface-0">
                  {name}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-xs uppercase tracking-widest text-surface-400">
                  Focus
                </dt>
                <dd className="mt-1 text-base font-medium text-surface-0">
                  Fintech · Dev tools · B2B
                </dd>
              </div>
              <div>
                <dt className="font-mono text-xs uppercase tracking-widest text-surface-400">
                  Status
                </dt>
                <dd className="mt-1 text-base font-medium text-surface-0">
                  {availability}
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </div>
    </section>
  );
}
