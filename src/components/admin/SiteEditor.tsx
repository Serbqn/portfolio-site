"use client";

import { useState } from "react";
import type { SiteContent } from "@/lib/types";
import type { AdminStatus } from "@/lib/admin-types";

export function SiteEditor({
  site,
  status,
  onSave,
}: {
  site: SiteContent;
  status: AdminStatus;
  onSave: (next: SiteContent) => Promise<void>;
}) {
  const [draft, setDraft] = useState<SiteContent>(site);

  function setSite<K extends keyof SiteContent>(key: K, value: SiteContent[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  return (
    <div className="space-y-6">
      <Section title="Identity">
        <Grid>
          <Field id="site.name" label="Name">
            <Input
              id="site.name"
              value={draft.site.name}
              onChange={(v) =>
                setSite("site", { ...draft.site, name: v })
              }
            />
          </Field>
          <Field id="site.role" label="Role (header badge)">
            <Input
              id="site.role"
              value={draft.site.role}
              onChange={(v) =>
                setSite("site", { ...draft.site, role: v })
              }
            />
          </Field>
          <Field id="site.logo" label="Logo SVG path" className="sm:col-span-2">
            <div className="space-y-2">
              <TextArea
                id="site.logo"
                rows={2}
                value={draft.site.logo ?? ""}
                onChange={(v) =>
                  setSite("site", { ...draft.site, logo: v || undefined })
                }
              />
              <p className="font-mono text-[10px] uppercase tracking-widest text-surface-500">
                SVG path data (e.g. <code className="rounded bg-surface-800 px-1">M9 11h14M9 16h10M9 21h14</code>). Leave empty for the default icon.
              </p>
              {/* Live preview */}
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-surface-700 bg-surface-800 p-3">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-surface-950 text-accent-500">
                  <svg viewBox="0 0 32 32" className="h-4 w-4" fill="none" aria-hidden>
                    <path
                      d={draft.site.logo || "M9 11h14M9 16h10M9 21h14"}
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <span className="text-sm font-semibold text-surface-0">{draft.site.name || "Name"}</span>
                <span className="text-surface-500">/</span>
                <span className="font-mono text-xs uppercase tracking-widest text-surface-400">
                  {draft.site.role || "Role"}
                </span>
              </div>
            </div>
          </Field>
          <Field id="site.email" label="Email">
            <Input
              id="site.email"
              type="email"
              value={draft.site.email}
              onChange={(v) =>
                setSite("site", { ...draft.site, email: v })
              }
            />
          </Field>
          <Field id="site.location" label="Location">
            <Input
              id="site.location"
              value={draft.site.location}
              onChange={(v) =>
                setSite("site", { ...draft.site, location: v })
              }
            />
          </Field>
          <Field id="site.tagline" label="Tagline" className="sm:col-span-2">
            <Input
              id="site.tagline"
              value={draft.site.tagline}
              onChange={(v) =>
                setSite("site", { ...draft.site, tagline: v })
              }
            />
          </Field>
          <Field id="site.description" label="Description (SEO)" className="sm:col-span-2">
            <TextArea
              id="site.description"
              rows={2}
              value={draft.site.description}
              onChange={(v) =>
                setSite("site", { ...draft.site, description: v })
              }
            />
          </Field>
          <Field id="site.availability" label="Availability" className="sm:col-span-2">
            <Input
              id="site.availability"
              value={draft.site.availability}
              onChange={(v) =>
                setSite("site", { ...draft.site, availability: v })
              }
            />
          </Field>
        </Grid>
      </Section>

      <Section title="Hero">
        <Grid>
          <Field id="hero.eyebrow" label="Eyebrow" className="sm:col-span-2">
            <Input
              id="hero.eyebrow"
              value={draft.hero.eyebrow}
              onChange={(v) => setSite("hero", { ...draft.hero, eyebrow: v })}
            />
          </Field>
          <Field id="hero.headline" label="Headline" className="sm:col-span-2">
            <Input
              id="hero.headline"
              value={draft.hero.headline}
              onChange={(v) => setSite("hero", { ...draft.hero, headline: v })}
            />
          </Field>
          <Field id="hero.sub" label="Sub-headline" className="sm:col-span-2">
            <TextArea
              id="hero.sub"
              rows={2}
              value={draft.hero.subheadline}
              onChange={(v) =>
                setSite("hero", { ...draft.hero, subheadline: v })
              }
            />
          </Field>
          <Field id="hero.cta1" label="Primary CTA label">
            <Input
              id="hero.cta1"
              value={draft.hero.primaryCta.label}
              onChange={(v) =>
                setSite("hero", {
                  ...draft.hero,
                  primaryCta: { ...draft.hero.primaryCta, label: v },
                })
              }
            />
          </Field>
          <Field id="hero.cta1h" label="Primary CTA href">
            <Input
              id="hero.cta1h"
              value={draft.hero.primaryCta.href}
              onChange={(v) =>
                setSite("hero", {
                  ...draft.hero,
                  primaryCta: { ...draft.hero.primaryCta, href: v },
                })
              }
            />
          </Field>
          <Field id="hero.cta2" label="Secondary CTA label">
            <Input
              id="hero.cta2"
              value={draft.hero.secondaryCta.label}
              onChange={(v) =>
                setSite("hero", {
                  ...draft.hero,
                  secondaryCta: { ...draft.hero.secondaryCta, label: v },
                })
              }
            />
          </Field>
          <Field id="hero.cta2h" label="Secondary CTA href">
            <Input
              id="hero.cta2h"
              value={draft.hero.secondaryCta.href}
              onChange={(v) =>
                setSite("hero", {
                  ...draft.hero,
                  secondaryCta: { ...draft.hero.secondaryCta, href: v },
                })
              }
            />
          </Field>
        </Grid>
      </Section>

      <Section title="Social links">
        <Grid>
          {(["dribbble", "behance", "linkedin", "github", "twitter"] as const).map(
            (key) => (
              <Field key={key} id={`social.${key}`} label={key}>
                <Input
                  id={`social.${key}`}
                  value={draft.site.social[key] ?? ""}
                  onChange={(v) =>
                    setSite("site", {
                      ...draft.site,
                      social: { ...draft.site.social, [key]: v || undefined },
                    })
                  }
                />
              </Field>
            ),
          )}
        </Grid>
      </Section>

      {/* ── Home ── */}
      <Section title="Home page">
        <Grid>
          <Field id="home.intro.eyebrow" label="Intro eyebrow">
            <Input
              id="home.intro.eyebrow"
              value={draft.home.intro.eyebrow}
              onChange={(v) =>
                setSite("home", {
                  ...draft.home,
                  intro: { ...draft.home.intro, eyebrow: v },
                })
              }
            />
          </Field>
          <Field id="home.intro.title" label="Intro title">
            <Input
              id="home.intro.title"
              value={draft.home.intro.title}
              onChange={(v) =>
                setSite("home", {
                  ...draft.home,
                  intro: { ...draft.home.intro, title: v },
                })
              }
            />
          </Field>
          <Field id="home.intro.body" label="Intro body" className="sm:col-span-2">
            <TextArea
              id="home.intro.body"
              rows={3}
              value={draft.home.intro.body}
              onChange={(v) =>
                setSite("home", {
                  ...draft.home,
                  intro: { ...draft.home.intro, body: v },
                })
              }
            />
          </Field>
          <Field id="home.featuredTitle" label="Featured title">
            <Input
              id="home.featuredTitle"
              value={draft.home.featuredTitle}
              onChange={(v) =>
                setSite("home", { ...draft.home, featuredTitle: v })
              }
            />
          </Field>
          <Field id="home.featuredCount" label="Featured count">
            <input
              id="home.featuredCount"
              type="number"
              min={1}
              max={9}
              value={draft.home.featuredCount}
              onChange={(e) =>
                setSite("home", {
                  ...draft.home,
                  featuredCount: Math.max(1, Number(e.target.value) || 3),
                })
              }
              className="h-10 w-full rounded-lg border border-surface-600 bg-surface-900 px-3 text-sm outline-none focus:border-accent-500 focus:shadow-ring-accent"
            />
          </Field>
        </Grid>

        {/* Skills */}
        <div className="mt-6">
          <h3 className="font-mono text-xs uppercase tracking-widest text-surface-500">
            Skills
          </h3>
          <div className="mt-3 space-y-2">
            {draft.home.skills.map((skill, i) => (
              <div key={i} className="flex items-center gap-3">
                <input
                  value={skill.name}
                  onChange={(e) => {
                    const next = [...draft.home.skills];
                    next[i] = { ...next[i], name: e.target.value };
                    setSite("home", { ...draft.home, skills: next });
                  }}
                  placeholder="Skill name"
                  className="h-9 flex-1 rounded-lg border border-surface-600 bg-surface-900 px-3 text-sm outline-none focus:border-accent-500"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={skill.level}
                  onChange={(e) => {
                    const next = [...draft.home.skills];
                    next[i] = { ...next[i], level: Math.min(100, Math.max(0, Number(e.target.value) || 0)) };
                    setSite("home", { ...draft.home, skills: next });
                  }}
                  className="h-9 w-20 rounded-lg border border-surface-600 bg-surface-900 px-2 text-sm outline-none focus:border-accent-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = draft.home.skills.filter((_, j) => j !== i);
                    setSite("home", { ...draft.home, skills: next });
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-800 text-red-400 hover:bg-red-950/50"
                  aria-label="Remove skill"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setSite("home", {
                  ...draft.home,
                  skills: [...draft.home.skills, { name: "", level: 80 }],
                })
              }
              className="inline-flex h-9 items-center justify-center rounded-lg border border-dashed border-surface-600 px-3 text-sm text-surface-400 hover:border-accent-400 hover:text-accent-500"
            >
              + Add skill
            </button>
          </div>
        </div>

        {/* Tools */}
        <div className="mt-6">
          <h3 className="font-mono text-xs uppercase tracking-widest text-surface-500">
            Tools
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {draft.home.tools.map((tool, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-full border border-surface-700 bg-surface-800 px-3 py-1 text-sm"
              >
                <input
                  value={tool}
                  onChange={(e) => {
                    const next = [...draft.home.tools];
                    next[i] = e.target.value;
                    setSite("home", { ...draft.home, tools: next });
                  }}
                  className="w-24 bg-transparent text-sm text-surface-0 outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = draft.home.tools.filter((_, j) => j !== i);
                    setSite("home", { ...draft.home, tools: next });
                  }}
                  className="text-surface-500 hover:text-red-400"
                  aria-label="Remove tool"
                >
                  ×
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() =>
                setSite("home", {
                  ...draft.home,
                  tools: [...draft.home.tools, ""],
                })
              }
              className="inline-flex h-9 items-center justify-center rounded-full border border-dashed border-surface-600 px-3 text-sm text-surface-400 hover:border-accent-400 hover:text-accent-500"
            >
              + Add tool
            </button>
          </div>
        </div>
      </Section>

      {/* ── About ── */}
      <Section title="About page">
        <Grid>
          <Field id="about.eyebrow" label="Eyebrow">
            <Input
              id="about.eyebrow"
              value={draft.about.eyebrow}
              onChange={(v) =>
                setSite("about", { ...draft.about, eyebrow: v })
              }
            />
          </Field>
          <Field id="about.title" label="Title">
            <Input
              id="about.title"
              value={draft.about.title}
              onChange={(v) =>
                setSite("about", { ...draft.about, title: v })
              }
            />
          </Field>
          <Field id="about.lead" label="Lead paragraph" className="sm:col-span-2">
            <TextArea
              id="about.lead"
              rows={3}
              value={draft.about.lead}
              onChange={(v) =>
                setSite("about", { ...draft.about, lead: v })
              }
            />
          </Field>
        </Grid>

        {/* About sections */}
        <div className="mt-6">
          <h3 className="font-mono text-xs uppercase tracking-widest text-surface-400">
            Sections
          </h3>
          <div className="mt-3 space-y-3">
            {draft.about.sections.map((section, i) => (
              <div key={i} className="rounded-lg border border-surface-700 bg-surface-800 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    value={section.heading}
                    onChange={(e) => {
                      const next = [...draft.about.sections];
                      next[i] = { ...next[i], heading: e.target.value };
                      setSite("about", { ...draft.about, sections: next });
                    }}
                    placeholder="Heading"
                    className="h-9 flex-1 rounded-lg border border-surface-600 bg-surface-900 px-3 text-sm font-semibold text-surface-0 outline-none focus:border-accent-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = draft.about.sections.filter((_, j) => j !== i);
                      setSite("about", { ...draft.about, sections: next });
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-800 text-red-400 hover:bg-red-950/50"
                    aria-label="Remove section"
                  >
                    ×
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={section.body}
                  onChange={(e) => {
                    const next = [...draft.about.sections];
                    next[i] = { ...next[i], body: e.target.value };
                    setSite("about", { ...draft.about, sections: next });
                  }}
                  placeholder="Body text"
                  className="w-full rounded-lg border border-surface-600 bg-surface-900 px-3 py-2.5 text-sm text-surface-0 leading-relaxed outline-none focus:border-accent-500"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setSite("about", {
                  ...draft.about,
                  sections: [...draft.about.sections, { heading: "", body: "" }],
                })
              }
              className="inline-flex h-9 items-center justify-center rounded-lg border border-dashed border-surface-600 px-3 text-sm text-surface-400 hover:border-accent-400 hover:text-accent-500"
            >
              + Add section
            </button>
          </div>
        </div>

        {/* Experience */}
        <div className="mt-6">
          <h3 className="font-mono text-xs uppercase tracking-widest text-surface-400">
            Experience
          </h3>
          <div className="mt-3 space-y-3">
            {draft.about.experience.map((exp, i) => (
              <div key={i} className="rounded-lg border border-surface-700 bg-surface-800 p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-widest text-surface-500">Year</label>
                    <input
                      value={exp.year}
                      onChange={(e) => {
                        const next = [...draft.about.experience];
                        next[i] = { ...next[i], year: e.target.value };
                        setSite("about", { ...draft.about, experience: next });
                      }}
                      placeholder="2024 — Now"
                      className="mt-1 h-9 w-full rounded-lg border border-surface-600 bg-surface-900 px-3 text-sm text-surface-0 outline-none focus:border-accent-500"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-widest text-surface-500">Role</label>
                    <input
                      value={exp.role}
                      onChange={(e) => {
                        const next = [...draft.about.experience];
                        next[i] = { ...next[i], role: e.target.value };
                        setSite("about", { ...draft.about, experience: next });
                      }}
                      placeholder="Senior Product Designer"
                      className="mt-1 h-9 w-full rounded-lg border border-surface-600 bg-surface-900 px-3 text-sm text-surface-0 outline-none focus:border-accent-500"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase tracking-widest text-surface-500">Company</label>
                    <input
                      value={exp.company}
                      onChange={(e) => {
                        const next = [...draft.about.experience];
                        next[i] = { ...next[i], company: e.target.value };
                        setSite("about", { ...draft.about, experience: next });
                      }}
                      placeholder="Acme Inc."
                      className="mt-1 h-9 w-full rounded-lg border border-surface-600 bg-surface-900 px-3 text-sm text-surface-0 outline-none focus:border-accent-500"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const next = draft.about.experience.filter((_, j) => j !== i);
                        setSite("about", { ...draft.about, experience: next });
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-800 text-red-400 hover:bg-red-950/50"
                      aria-label="Remove experience"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <textarea
                  rows={2}
                  value={exp.summary}
                  onChange={(e) => {
                    const next = [...draft.about.experience];
                    next[i] = { ...next[i], summary: e.target.value };
                    setSite("about", { ...draft.about, experience: next });
                  }}
                  placeholder="Summary"
                  className="mt-2 w-full rounded-lg border border-surface-600 bg-surface-900 px-3 py-2.5 text-sm text-surface-0 leading-relaxed outline-none focus:border-accent-500"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setSite("about", {
                  ...draft.about,
                  experience: [
                    ...draft.about.experience,
                    { year: "", role: "", company: "", summary: "" },
                  ],
                })
              }
              className="inline-flex h-9 items-center justify-center rounded-lg border border-dashed border-surface-600 px-3 text-sm text-surface-400 hover:border-accent-400 hover:text-accent-500"
            >
              + Add experience
            </button>
          </div>
        </div>
      </Section>

      {/* ── Contact ── */}
      <Section title="Contact page">
        <Grid>
          <Field id="contact.eyebrow" label="Eyebrow">
            <Input
              id="contact.eyebrow"
              value={draft.contact.eyebrow}
              onChange={(v) =>
                setSite("contact", { ...draft.contact, eyebrow: v })
              }
            />
          </Field>
          <Field id="contact.title" label="Title">
            <Input
              id="contact.title"
              value={draft.contact.title}
              onChange={(v) =>
                setSite("contact", { ...draft.contact, title: v })
              }
            />
          </Field>
          <Field id="contact.lead" label="Lead paragraph" className="sm:col-span-2">
            <TextArea
              id="contact.lead"
              rows={3}
              value={draft.contact.lead}
              onChange={(v) =>
                setSite("contact", { ...draft.contact, lead: v })
              }
            />
          </Field>
          <Field id="contact.submitLabel" label="Submit button label">
            <Input
              id="contact.submitLabel"
              value={draft.contact.submitLabel}
              onChange={(v) =>
                setSite("contact", { ...draft.contact, submitLabel: v })
              }
            />
          </Field>
        </Grid>
      </Section>

      <Section title="Process (project page footer)">
        <Grid>
          <Field id="process.eyebrow" label="Eyebrow" className="sm:col-span-2">
            <Input
              id="process.eyebrow"
              value={draft.process.eyebrow}
              onChange={(v) =>
                setSite("process", { ...draft.process, eyebrow: v })
              }
            />
          </Field>
        </Grid>
        <div className="mt-6">
          <h3 className="font-mono text-xs uppercase tracking-widest text-surface-500">
            Steps
          </h3>
          <div className="mt-3 space-y-2">
            {draft.process.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input
                    id={`process.steps.${i}.label`}
                    value={step.label}
                    onChange={(v) => {
                      const steps = [...draft.process.steps];
                      steps[i] = { ...steps[i], label: v };
                      setSite("process", { ...draft.process, steps });
                    }}
                  />
                  <Input
                    id={`process.steps.${i}.value`}
                    value={step.value}
                    onChange={(v) => {
                      const steps = [...draft.process.steps];
                      steps[i] = { ...steps[i], value: v };
                      setSite("process", { ...draft.process, steps });
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const steps = draft.process.steps.filter((_, j) => j !== i);
                    setSite("process", { ...draft.process, steps });
                  }}
                  className="mt-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-surface-700 text-surface-500 hover:text-red-400 hover:border-red-800 transition-colors"
                  title="Remove step"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() =>
                setSite("process", {
                  ...draft.process,
                  steps: [...draft.process.steps, { label: "", value: "" }],
                })
              }
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-surface-600 px-3 text-xs font-medium text-surface-400 hover:border-surface-0 hover:text-surface-0 transition-colors"
            >
              + Add step
            </button>
          </div>
        </div>
        <Field id="process.footer" label="Footer text" className="mt-4 sm:col-span-2">
          <TextArea
            id="process.footer"
            rows={2}
            value={draft.process.footer}
            onChange={(v) =>
              setSite("process", { ...draft.process, footer: v })
            }
          />
        </Field>
      </Section>

      <div className="sticky bottom-4 z-10 flex items-center justify-end gap-3 rounded-xl border border-surface-700 bg-surface-900/90 p-3 backdrop-blur">
        <span className="mr-auto font-mono text-xs uppercase tracking-widest text-surface-400">
          {status === "saving" ? "Saving…" : status === "saved" ? "Saved" : ""}
        </span>
        <button
          type="button"
          onClick={() => onSave(draft)}
          disabled={status === "saving"}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-surface-0 px-4 text-sm font-medium text-surface-950 transition-colors hover:bg-surface-100 disabled:opacity-50"
        >
          Save site copy
        </button>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-surface-700 bg-surface-900 p-5 sm:p-6">
      <h2 className="text-base font-semibold tracking-tight text-surface-0">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

function Field({
  id,
  label,
  children,
  className,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="font-mono text-xs uppercase tracking-widest text-surface-400"
      >
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Input({
  id,
  value,
  onChange,
  type = "text",
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-lg border border-surface-600 bg-surface-900 px-3 text-sm text-surface-0 outline-none focus:border-accent-500 focus:shadow-ring-accent"
    />
  );
}

function TextArea({
  id,
  value,
  onChange,
  rows = 3,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      id={id}
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-surface-600 bg-surface-900 px-3 py-2.5 text-sm text-surface-0 leading-relaxed outline-none focus:border-accent-500 focus:shadow-ring-accent"
    />
  );
}
