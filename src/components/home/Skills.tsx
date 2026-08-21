"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import type { Skill } from "@/lib/types";

const barTransition = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

/**
 * SkillBar — fills to `level`% when scrolled into view.
 *
 * Robustness: some mobile browsers never report the intersection
 * (rootMargin/IO quirks), which left bars permanently empty. So:
 * scroll trigger when available, plus a timed fallback that fills
 * regardless, and a static render under reduced motion.
 */
function SkillBar({ level, index }: { level: number; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduceMotion = useReducedMotion();
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setFallback(true), 2500);
    return () => window.clearTimeout(t);
  }, []);

  const target = `${level}%`;
  const trackClass =
    "mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-700";
  const fillClass =
    "h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-400";

  if (reduceMotion) {
    return (
      <div ref={ref} className={trackClass}>
        <div className={fillClass} style={{ width: target }} />
      </div>
    );
  }

  const filled = inView || fallback;
  return (
    <div ref={ref} className={trackClass}>
      <motion.div
        className={fillClass}
        initial={{ width: 0 }}
        animate={filled ? { width: target } : { width: 0 }}
        transition={{ ...barTransition, delay: inView ? index * 0.08 : 0 }}
      />
    </div>
  );
}

export function Skills({ skills, tools }: { skills: Skill[]; tools: string[] }) {
  return (
    <section className="border-y border-surface-700 bg-surface-800">
      <div className="container-wide grid gap-12 py-section lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <p className="eyebrow">Capabilities</p>
          <h2 className="mt-2 text-display-3 font-medium tracking-tight text-balance">
            Where the work happens.
          </h2>
          <p className="mt-4 text-pretty text-surface-300">
            Self-reported proficiency across the disciplines I practice most.
            Tools change every year; the methods are slower to move.
          </p>
        </div>

        <div className="lg:col-span-7">
          <ul className="grid gap-3">
            {skills.map((s, i) => (
              <li
                key={s.name}
                className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-surface-700 py-3 last:border-b-0"
              >
                <div>
                  <div className="text-sm font-medium text-surface-0">
                    {s.name}
                  </div>
                  <SkillBar level={s.level} index={i} />
                </div>
                <span className="font-mono text-xs uppercase tracking-widest text-surface-400">
                  {s.level}
                </span>
              </li>
            ))}
          </ul>

          {tools.length > 0 ? (
            <div className="mt-8">
              <h3 className="font-mono text-xs uppercase tracking-widest text-surface-400">
                Tools I reach for
              </h3>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {tools.map((t) => (
                  <li
                    key={t}
                    className="inline-flex items-center rounded-full border border-surface-600 bg-surface-900 px-2.5 py-1 text-xs font-medium text-surface-200 transition-colors duration-150 hover:border-accent-600 hover:text-surface-0"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
