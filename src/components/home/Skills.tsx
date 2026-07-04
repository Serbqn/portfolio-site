import type { Skill } from "@/lib/types";

export function Skills({ skills, tools }: { skills: Skill[]; tools: string[] }) {
  return (
    <section className="border-y border-surface-700 bg-surface-800">
      <div className="container-wide grid gap-12 py-section lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            Skills
          </p>
          <h2 className="mt-3 text-display-3 font-semibold tracking-tight text-balance">
            Where the work happens.
          </h2>
          <p className="mt-4 text-pretty text-surface-300">
            Self-reported proficiency across the disciplines I practice most.
            Tools change every year; the methods are slower to move.
          </p>
        </div>

        <div className="lg:col-span-7">
          <ul className="grid gap-3">
            {skills.map((s) => (
              <li
                key={s.name}
                className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-surface-700 py-3 last:border-b-0"
              >
                <div>
                  <div className="text-sm font-medium text-surface-0">
                    {s.name}
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-700">
                    <div
                      className="h-full rounded-full bg-surface-950 transition-all duration-500 ease-out-soft"
                      style={{ width: `${s.level}%` }}
                    />
                  </div>
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
                    className="inline-flex items-center rounded-md border border-surface-700 bg-surface-900 px-2.5 py-1 text-xs font-medium text-surface-200"
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
