"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import type { Hero as HeroType } from "@/lib/types";

const tapSpring = { type: "spring" as const, stiffness: 500, damping: 30, mass: 0.5 };

export function Hero({
  hero,
  name,
  availability,
  focus,
}: {
  hero: HeroType;
  name: string;
  availability: string;
  focus?: string;
}) {
  const reduceMotion = useReducedMotion();
  const words = hero.headline.split(" ");

  return (
    <section className="relative overflow-hidden">
      {/* Drifting grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top,black,transparent_72%)]"
      >
        <div className="absolute inset-0 grid-lines opacity-50 motion-safe:animate-drift" />
        {/* Ember glow pooling at the top */}
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(255,107,53,0.08),transparent)]" />
      </div>

      <div className="container-wide pt-20 pb-section sm:pt-28">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-8">
            <motion.p
              className="eyebrow"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              {hero.eyebrow}
            </motion.p>

            {/* Kinetic headline — words rise in with a stagger */}
            <h1 className="mt-6 text-display-1 font-medium tracking-tight text-balance text-surface-0">
              {words.map((word, i) => (
                <span
                  key={`${word}-${i}`}
                  className="inline-block overflow-hidden pb-1 align-bottom"
                >
                  <motion.span
                    className="inline-block"
                    initial={reduceMotion ? false : { y: "110%" }}
                    animate={{ y: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 26,
                      delay: 0.06 * i,
                    }}
                  >
                    {word}
                    {i < words.length - 1 ? "\u00A0" : ""}
                  </motion.span>
                </span>
              ))}
            </h1>

            <motion.p
              className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-surface-300 sm:text-xl"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            >
              {hero.subheadline}
            </motion.p>

            <motion.div
              className="mt-10 flex flex-wrap items-center gap-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1], delay: 0.22 }}
            >
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={tapSpring}>
                <Link
                  href={hero.primaryCta.href}
                  className="group inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-accent-500 px-5 text-sm font-medium text-surface-950 transition-colors duration-150 hover:bg-accent-400"
                >
                  {hero.primaryCta.label}
                  <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" weight="bold" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={tapSpring}>
                <Link
                  href={hero.secondaryCta.href}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-surface-600 px-5 text-sm font-medium text-surface-0 transition-colors duration-150 hover:border-surface-500 hover:bg-surface-800"
                >
                  {hero.secondaryCta.label}
                </Link>
              </motion.div>
            </motion.div>
          </div>

          <motion.aside
            className="lg:col-span-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          >
            <dl className="grid gap-6 border-l border-surface-700 pl-6 sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <dt className="font-mono text-xs uppercase tracking-widest text-surface-400">
                  Designer
                </dt>
                <dd className="mt-1 text-base font-medium text-surface-0">
                  {name}
                </dd>
              </div>
              {focus ? (
                <div>
                  <dt className="font-mono text-xs uppercase tracking-widest text-surface-400">
                    Focus
                  </dt>
                  <dd className="mt-1 text-base font-medium text-surface-0">
                    {focus}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="font-mono text-xs uppercase tracking-widest text-surface-400">
                  Status
                </dt>
                <dd className="mt-2 inline-flex items-center gap-2 rounded-full border border-accent-600 bg-accent-500/10 px-3 py-1 text-sm font-medium text-surface-0">
                  <span className="relative flex h-2 w-2">
                    <span className="motion-safe:animate-pulse-dot absolute inline-flex h-full w-full rounded-full bg-accent-500" />
                  </span>
                  {availability}
                </dd>
              </div>
            </dl>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}
