import { Hero } from "@/components/home/Hero";
import { FeaturedProjects } from "@/components/home/FeaturedProjects";
import { Skills } from "@/components/home/Skills";
import { getProjectsFull, getSite } from "@/lib/content";

export default async function HomePage() {
  const [site, projects] = await Promise.all([getSite(), getProjectsFull()]);
  const featured = projects.filter((p) => p.featured).slice(
    0,
    site.home.featuredCount,
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: site.site.name,
            jobTitle: site.site.role,
            description: site.site.description,
            email: site.site.email,
            url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://serb.design",
            sameAs: Object.values(site.site.social).filter(Boolean),
          }),
        }}
      />
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

      <section className="container-wide section">
        <div className="rounded-2xl border border-surface-700 bg-surface-800 p-8 transition-colors duration-300 hover:border-surface-500 sm:p-12">
          <p className="eyebrow">{site.home.intro.eyebrow}</p>
          <h2 className="mt-3 text-display-3 font-medium tracking-tight text-balance">
            {site.home.intro.title}
          </h2>
          <p className="mt-4 max-w-2xl text-pretty text-surface-300">
            {site.home.intro.body}
          </p>
          <a
            href="/about"
            className="link-reveal mt-6 inline-flex items-center gap-1.5 text-sm text-accent-400 transition-colors hover:text-accent-500"
          >
            More about how I work
            <span aria-hidden>→</span>
          </a>
        </div>
      </section>
    </>
  );
}
