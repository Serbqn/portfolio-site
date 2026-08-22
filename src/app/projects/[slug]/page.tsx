import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProjectBySlug, getProjectSlugs, getProjects, getSite } from "@/lib/content";
import { cn, normalizeExternalUrl } from "@/lib/utils";
import { BrowserFrame } from "@/components/projects/BrowserFrame";
import { ImageLightbox } from "@/components/projects/ImageLightbox";
import { Markdown } from "@/components/projects/Markdown";
import { BackLink } from "./BackLink";
import { ProjectNav } from "./ProjectNav";

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

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CreativeWork",
            name: project.title,
            description: project.summary,
            creator: { "@type": "Person", name: site.site.name },
            image: project.cover,
            dateCreated: project.year,
          }),
        }}
      />
      {/* Cover */}
      <header className="border-b border-surface-700">
        <div className="container-wide pb-10 pt-16 sm:pb-12 sm:pt-20">
          <BackLink />

          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <p className="eyebrow">
                {project.year} · {project.client}
              </p>
              <h1 className="mt-3 text-display-1 font-medium tracking-tight text-balance">
                {project.title}
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-relaxed text-pretty text-surface-300">
                {project.subtitle}
              </p>

              {/* Live/external project link — opens in a new tab */}
              {project.link ? (
                <a
                  href={normalizeExternalUrl(project.link)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-accent-600 bg-surface-900 px-4 py-2 text-sm font-medium text-accent-400 transition-colors hover:bg-surface-800 hover:text-accent-300"
                >
                  Visit project
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M7 17L17 7M9 7h8v8" />
                  </svg>
                </a>
              ) : null}
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
          {lightboxImages.length > 0 ? (
            <div className="mt-8">
              <p className="font-mono text-xs uppercase tracking-widest text-surface-400">
                Gallery - click to expand
              </p>
              <ImageLightbox images={lightboxImages} />
            </div>
          ) : null}
        </div>
      ) : lightboxImages.length > 0 ? (
        <div className="container-wide mt-10 sm:mt-12">
          <p className="font-mono text-xs uppercase tracking-widest text-surface-400">
            Gallery - click to expand
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
              <div key={m.label} className="bg-surface-950 p-6">
                <div className="font-mono text-xs uppercase tracking-widest text-surface-400">
                  {m.label}
                </div>
                <div className="mt-2 text-2xl font-medium tracking-tight text-accent-400 sm:text-3xl">
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
          <p className="font-mono text-xs uppercase tracking-widest text-surface-400 sticky top-24">
            Case study
          </p>
        </aside>
        <div className="space-y-12 lg:col-span-9">
          {project.problem ? (
            <section>
              <h2 className="text-display-3 font-medium tracking-tight">
                Problem
              </h2>
              <div className="mt-4">
                <Markdown>{project.problem}</Markdown>
              </div>
            </section>
          ) : null}
          {project.process ? (
            <section>
              <h2 className="text-display-3 font-medium tracking-tight">
                Process
              </h2>
              <div className="mt-4">
                <Markdown>{project.process}</Markdown>
              </div>
            </section>
          ) : null}
          {project.solution ? (
            <section>
              <h2 className="text-display-3 font-medium tracking-tight">
                Solution
              </h2>
              <div className="mt-4">
                <Markdown>{project.solution}</Markdown>
              </div>
            </section>
          ) : null}
          {project.results ? (
            <section>
              <h2 className="text-display-3 font-medium tracking-tight">
                Results
              </h2>
              <div className="mt-4">
                <Markdown>{project.results}</Markdown>
              </div>
            </section>
          ) : null}
        </div>
      </div>

      {/* Inline artifact strip — process section from site content */}
      {site.process.show !== false ? (
        <section className="container-wide pb-section">
          <div className="rounded-2xl border border-accent-600 bg-surface-950 p-6 sm:p-8">
            <p className="font-mono text-xs uppercase tracking-widest text-surface-400">
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
      ) : null}

      {/* Prev / Next */}
      <ProjectNav prev={prev} next={next} />
    </article>
  );
}
