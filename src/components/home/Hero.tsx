import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Hero } from "@/lib/types";

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
            <h1 className="mt-6 text-display-1 font-semibold tracking-tight text-balance text-surface-950">
              {hero.headline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-surface-600 sm:text-xl">
              {hero.subheadline}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link
                href={hero.primaryCta.href}
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-surface-950 px-5 text-sm font-medium text-white transition-all duration-150 hover:bg-surface-800"
              >
                {hero.primaryCta.label}
                <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={hero.secondaryCta.href}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-surface-200 bg-white px-5 text-sm font-medium text-surface-900 transition-colors duration-150 hover:bg-surface-50"
              >
                {hero.secondaryCta.label}
              </Link>
            </div>
          </div>

          <aside className="lg:col-span-4">
            <dl className="grid gap-6 border-l border-surface-200 pl-6 sm:grid-cols-2 lg:grid-cols-1">
              <div>
                <dt className="font-mono text-xs uppercase tracking-widest text-surface-500">
                  Designer
                </dt>
                <dd className="mt-1 text-base font-medium text-surface-950">
                  {name}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-xs uppercase tracking-widest text-surface-500">
                  Focus
                </dt>
                <dd className="mt-1 text-base font-medium text-surface-950">
                  Fintech · Dev tools · B2B
                </dd>
              </div>
              <div>
                <dt className="font-mono text-xs uppercase tracking-widest text-surface-500">
                  Status
                </dt>
                <dd className="mt-1 text-base font-medium text-surface-950">
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
