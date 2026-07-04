import type { Metadata } from "next";
import { getSite } from "@/lib/content";

export const metadata: Metadata = {
  title: "About",
  description:
    "How I work, what I care about, and the four roles that taught me most of what I know about designing technical products.",
};

export default async function AboutPage() {
  const { about } = await getSite();

  return (
    <>
      <section className="container-wide section">
        <header className="max-w-3xl">
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            {about.eyebrow}
          </p>
          <h1 className="mt-3 text-display-1 font-semibold tracking-tight text-balance">
            {about.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-pretty text-surface-300">
            {about.lead}
          </p>
        </header>

        <div className="mt-section grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <div className="space-y-10">
              {about.sections.map((s) => (
                <section key={s.heading}>
                  <h2 className="text-display-3 font-semibold tracking-tight">
                    {s.heading}
                  </h2>
                  <p className="mt-4 max-w-prose text-pretty leading-relaxed text-surface-200">
                    {s.body}
                  </p>
                </section>
              ))}
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="sticky top-24 rounded-2xl border border-surface-700 bg-surface-800 p-6">
              <h2 className="font-mono text-xs uppercase tracking-widest text-surface-400">
                Experience
              </h2>
              <ol className="mt-4 space-y-6">
                {about.experience.map((e) => (
                  <li key={`${e.year}-${e.role}`} className="grid gap-1">
                    <div className="font-mono text-xs uppercase tracking-widest text-surface-400">
                      {e.year}
                    </div>
                    <div className="text-base font-semibold tracking-tight text-surface-0">
                      {e.role}
                    </div>
                    <div className="text-sm text-surface-200">{e.company}</div>
                    <p className="mt-1 text-sm leading-relaxed text-surface-300">
                      {e.summary}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
