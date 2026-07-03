import { Hero } from "@/components/home/Hero";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { Skills } from "@/components/home/Skills";
import { getProjects, getSite } from "@/lib/content";

export default async function HomePage() {
  const [site, projects] = await Promise.all([getSite(), getProjects()]);
  const featured = projects.filter((p) => p.featured).slice(
    0,
    site.home.featuredCount,
  );

  return (
    <>
      <Hero
        hero={site.hero}
        name={site.site.name}
        availability={site.site.availability}
      />
      <FeaturedProjects
        title={site.home.featuredTitle}
        projects={featured}
      />
      <Skills skills={site.home.skills} tools={site.home.tools} />

      <section className="container-wide pb-section">
        <div className="rounded-2xl border border-surface-200 bg-surface-50 p-8 sm:p-12">
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            {site.home.intro.eyebrow}
          </p>
          <h2 className="mt-3 text-display-3 font-semibold tracking-tight text-balance">
            {site.home.intro.title}
          </h2>
          <p className="mt-4 max-w-2xl text-pretty text-surface-600">
            {site.home.intro.body}
          </p>
          <a
            href="/about"
            className="mt-6 inline-flex items-center gap-1.5 text-sm text-surface-700 transition-colors hover:text-surface-950"
          >
            More about how I work
            <span aria-hidden>→</span>
          </a>
        </div>
      </section>
    </>
  );
}
