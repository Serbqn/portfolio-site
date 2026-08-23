import Link from "next/link";
import { getSite } from "@/lib/content";
import { resolveLogo } from "@/lib/utils";

export async function Footer() {
  const { site, social } = await getSite().then((s) => ({
    site: s.site,
    social: s.site.social,
  }));

  const socialLinks = [
    social.dribbble && { label: "Dribbble", href: social.dribbble },
    social.behance && { label: "Behance", href: social.behance },
    social.linkedin && { label: "LinkedIn", href: social.linkedin },
    social.github && { label: "GitHub", href: social.github },
    social.twitter && { label: "X", href: social.twitter },
  ].filter(Boolean) as { label: string; href: string }[];

  const year = new Date().getFullYear();
  /** Same source as the header logo — admin-set SVG path or markup. */
  const logoMark = resolveLogo(site.logo);

  return (
    // snap-start: terminal beat for /projects' mandatory scroll-snap
    // (inert elsewhere — only that page enables snap on <html>)
    <footer className="snap-start border-t border-surface-700 bg-surface-900">
      {/* Big CTA band */}
      <div className="border-b border-surface-700">
        <div className="container-wide flex flex-col gap-6 py-section-sm sm:flex-row sm:items-end sm:justify-between">
          <p className="text-display-3 font-medium tracking-tight text-balance text-surface-0">
            Let's Build Together.
          </p>
          <Link
            href="/contact"
            className="group inline-flex shrink-0 items-center gap-2 rounded-lg bg-accent-500 px-5 py-2.5 text-sm font-medium text-surface-950 transition-colors duration-150 hover:bg-accent-400"
          >
            Start a project
            <svg
              viewBox="0 0 20 20"
              className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              fill="none"
              aria-hidden
            >
              <path
                d="M6 14L14 6M8 6h6v6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>

      <div className="container-wide grid gap-12 py-section sm:grid-cols-2 sm:gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-surface-950 text-accent-400">
              <svg
                viewBox={logoMark.viewBox}
                className="h-4 w-4"
                fill="none"
                aria-hidden
              >
                {/* Same source as the header logo */}
                <path
                  d={logoMark.d}
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="text-sm font-medium tracking-tight text-surface-0">
              {site.name}
            </span>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-surface-300">
            {site.tagline}
          </p>
          <p className="mt-4 font-mono text-xs uppercase tracking-widest text-surface-400">
            {site.location}
          </p>
        </div>

        <div className="lg:col-span-3">
          <h3 className="font-mono text-xs uppercase tracking-widest text-surface-400">
            Sitemap
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link
                href="/"
                className="link-reveal text-surface-200 hover:text-surface-0"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/projects"
                className="link-reveal text-surface-200 hover:text-surface-0"
              >
                Projects
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="link-reveal text-surface-200 hover:text-surface-0"
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="link-reveal text-surface-200 hover:text-surface-0"
              >
                Contact
              </Link>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-4">
          <h3 className="font-mono text-xs uppercase tracking-widest text-surface-400">
            Elsewhere
          </h3>
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {socialLinks.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center rounded-full border border-surface-600 px-3 py-1 font-mono text-xs uppercase tracking-widest text-surface-200 transition-colors duration-150 hover:border-accent-500 hover:text-accent-400"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={`mailto:${site.email}`}
                className="inline-flex items-center rounded-full border border-surface-600 px-3 py-1 font-mono text-xs uppercase tracking-widest text-surface-200 transition-colors duration-150 hover:border-accent-500 hover:text-accent-400"
              >
                Email
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-surface-800">
        <div className="container-wide flex flex-col gap-2 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs uppercase tracking-widest text-surface-400">
            © {year} {site.name}
          </p>
          <p className="font-mono text-xs uppercase tracking-widest text-surface-400">
            Designed &amp; built in {site.location}
          </p>
        </div>
      </div>
    </footer>
  );
}
