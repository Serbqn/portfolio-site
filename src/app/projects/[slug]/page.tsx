import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getProjectBySlug, getProjects, getSite } from "@/lib/content";
import { cn } from "@/lib/utils";
import { BrowserFrame } from "@/components/projects/BrowserFrame";
import { ImageLightbox } from "@/components/projects/ImageLightbox";

type Params = { slug: string };

// Helpers for the BrowserFrame — kept inline because they're local to this page.
function urlFor(client: string): string {
  const slug = client
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug}.app/`;
}

function captionFor(title: string, i: number): string {
  const captions = [
    `${title} — overview`,
    `${title} — workflow`,
    `${title} — detail view`,
    `${title} — empty state`,
  ];
  return captions[i] ?? `${title} — view ${i + 1}`;
}

function renderMarkdownParagraphs(text: string) {
  return text
    .split(/\n+/)
    .filter(Boolean)
    .map((para, i) => <p key={i}>{para.trim()}</p>);
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found" };
  return {
    title: project.title,
    description: project.summary,
    openGraph: {
      title: project.title,
      description: project.summary,
      images: project.cover ? [{ url: project.cover }] : undefined,
    },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const [project, all, site] = await Promise.all([
    getProjectBySlug(slug),
    getProjects(),
    getSite(),
  ]);
  if (!project) notFound();

  const idx = all.findIndex((p) => p.slug === slug);
  const prev = all[(idx - 1 + all.length) % all.length];
  const next = all[(idx + 1) % all.length];

  // Build gallery images for the lightbox (cover + gallery)
  const lightboxImages =
    project.cover || project.gallery?.length
      ? [
          ...(project.cover
            ? [{ src: project.cover, alt: `${project.title} cover`, caption: `${project.title} — overview` }]
            : []),
          ...(project.gallery ?? [])
            .filter((g) => g !== project.cover)
            .map((g, i) => ({
              src: g,
              alt: `${project.title} screenshot ${i + 1}`,
              caption: captionFor(project.title, i),
            })),
        ]
      : [];

  return (
    <article>
      {/* Cover */}
      <header className="border-b border-surface-700">
        <div className="container-wide pb-10 pt-16 sm:pb-12 sm:pt-20">
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-sm text-surface-400 transition-colors hover:text-surface-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All projects
          </Link>

          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <p className="eyebrow">
                <span className="eyebrow-dot" />
                {project.year} · {project.client}
              </p>
              <h1 className="mt-3 text-display-1 font-semibold tracking-tight text-balance">
                {project.title}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-pretty text-surface-300">
                {project.subtitle}
              </p>
            </div>

            <dl className="grid gap-5 border-t border-surface-700 pt-6 text-sm sm:grid-cols-2 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <div>
                <dt className="font-mono text-xs uppercase tracking-widest text-surface-400">
                  Role
                </dt>
                <dd className="mt-1 font-medium text-surface-0">
                  {project.role}
                </dd>
              </div>
              <div>
                <dt className="font-mono text-xs uppercase tracking-widest text-surface-400">
                  Year
                </dt>
                <dd className="mt-1 font-medium text-surface-0">
                  {project.year}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="font-mono text-xs uppercase tracking-widest text-surface-400">
                  Tags
                </dt>
                <dd className="mt-1 flex flex-wrap gap-1.5">
                  {project.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center rounded-full bg-surface-800 px-2.5 py-0.5 text-xs font-medium text-surface-200"
                    >
                      {t}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </header>

      {/* Gallery: BrowserFrame for main cover + ImageLightbox for clickable gallery */}
      {project.cover ? (
        <div className="container-wide mt-10 sm:mt-12">
          {/* Main cover in BrowserFrame — presentation piece */}
          <BrowserFrame
            title={project.title}
            url={urlFor(project.client)}
            frames={[
              { src: project.cover, alt: `${project.title} cover` },
            ]}
          />

          {/* Clickable gallery grid below */}
          {lightboxImages.length > 1 ? (
            <div className="mt-8">
              <p className="font-mono text-xs uppercase tracking-widest text-surface-400 mb-4">
                Gallery — click to expand
              </p>
              <ImageLightbox images={lightboxImages} />
            </div>
          ) : lightboxImages.length === 1 ? (
            <div className="mt-8">
              <p className="font-mono text-xs uppercase tracking-widest text-surface-400 mb-4">
                Gallery — click to expand
              </p>
              <ImageLightbox images={lightboxImages} />
            </div>
          ) : null}
        </div>
      ) : lightboxImages.length > 0 ? (
        <div className="container-wide mt-10 sm:mt-12">
          <p className="font-mono text-xs uppercase tracking-widest text-surface-400 mb-4">
            Gallery — click to expand
          </p>
          <ImageLightbox images={lightboxImages} />
        </div>
      ) : null}

      {/* Metrics */}
      {project.metrics?.length ? (
        <section className="container-wide mt-section-sm">
          <div className={cn(
            "grid overflow-hidden rounded-2xl border border-surface-700 divide-x divide-surface-700",
            project.metrics.length === 1 ? "grid-cols-1" :
            project.metrics.length === 2 ? "grid-cols-1 sm:grid-cols-2" :
            "grid-cols-1 sm:grid-cols-3",
          )}>
            {project.metrics.map((m) => (
              <div key={m.label} className="bg-surface-900 p-6">
                <div className="font-mono text-xs uppercase tracking-widest text-surface-400">
                  {m.label}
                </div>
                <div className="mt-2 text-2xl font-semibold tracking-tight text-surface-0 sm:text-3xl">
                  {m.value}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Case study sections */}
      <div className="container-wide mt-section-sm grid gap-12 pb-section lg:grid-cols-12 lg:gap-16">
        <aside className="lg:col-span-3">
          <p className="eyebrow sticky top-24">
            <span className="eyebrow-dot" />
            Case study
          </p>
        </aside>
        <div className="space-y-12 lg:col-span-9">
          {project.problem ? (
            <section>
              <h2 className="text-display-3 font-semibold tracking-tight">
                Problem
              </h2>
              <div className="mt-4 max-w-prose space-y-3 text-pretty leading-relaxed text-surface-200 break-words [overflow-wrap:anywhere]">
                {renderMarkdownParagraphs(project.problem)}
              </div>
            </section>
          ) : null}
          {project.process ? (
            <section>
              <h2 className="text-display-3 font-semibold tracking-tight">
                Process
              </h2>
              <div className="mt-4 max-w-prose space-y-3 text-pretty leading-relaxed text-surface-200 break-words [overflow-wrap:anywhere]">
                {renderMarkdownParagraphs(project.process)}
              </div>
            </section>
          ) : null}
          {project.solution ? (
            <section>
              <h2 className="text-display-3 font-semibold tracking-tight">
                Solution
              </h2>
              <div className="mt-4 max-w-prose space-y-3 text-pretty leading-relaxed text-surface-200 break-words [overflow-wrap:anywhere]">
                {renderMarkdownParagraphs(project.solution)}
              </div>
            </section>
          ) : null}
          {project.results ? (
            <section>
              <h2 className="text-display-3 font-semibold tracking-tight">
                Results
              </h2>
              <div className="mt-4 max-w-prose space-y-3 text-pretty leading-relaxed text-surface-200 break-words [overflow-wrap:anywhere]">
                {renderMarkdownParagraphs(project.results)}
              </div>
            </section>
          ) : null}
        </div>
      </div>

      {/* Inline artifact strip — process section from site content */}
      <section className="container-wide pb-section">
        <div className="rounded-2xl border border-accent-600 bg-surface-950 p-6 sm:p-8">
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            {site.process.eyebrow}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {site.process.steps.map((step) => (
              <div
                key={step.label}
                className="rounded-xl border border-surface-700 bg-surface-900 p-4"
              >
                <div className="font-mono text-xs uppercase tracking-widest text-surface-200">
                  {step.label}
                </div>
                <div className="mt-1 text-lg font-medium text-surface-0">
                  {step.value}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 max-w-prose text-sm text-surface-200">
            {site.process.footer}
          </p>
        </div>
      </section>

      {/* Prev / Next */}
      <nav
        aria-label="Project navigation"
        className="border-t border-surface-700"
      >
        <div className="container-wide grid grid-cols-2 gap-px overflow-hidden bg-surface-700 sm:grid-cols-2">
          <Link
            href={`/projects/${prev.slug}`}
            className="group flex flex-col gap-2 bg-surface-900 p-6 transition-colors hover:bg-surface-800 sm:p-8"
          >
            <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-surface-400 transition-colors group-hover:text-surface-0">
              <ArrowLeft className="h-3.5 w-3.5" />
              Previous
            </span>
            <span className="text-base font-medium text-surface-0 sm:text-lg">
              {prev.title}
            </span>
          </Link>
          <Link
            href={`/projects/${next.slug}`}
            className="group col-start-2 flex flex-col items-end gap-2 bg-surface-900 p-6 text-right transition-colors hover:bg-surface-800 sm:p-8"
          >
            <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-surface-400 transition-colors group-hover:text-surface-0">
              Next
              <ArrowRight className="h-3.5 w-3.5" />
            </span>
            <span className="text-base font-medium text-surface-0 sm:text-lg">
              {next.title}
            </span>
          </Link>
        </div>
      </nav>
    </article>
  );
}
