import Link from "next/link";
import { getSite } from "@/lib/content";

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

  return (
    <footer className="border-t border-surface-700 bg-surface-900">
      <div className="container-wide grid gap-12 py-section sm:grid-cols-2 sm:gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-surface-950 text-accent-500">
              <svg
                viewBox="0 0 32 32"
                className="h-4 w-4"
                fill="none"
                aria-hidden
              >
                <path
                  d="M9 11h14M9 16h10M9 21h14"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="text-sm font-semibold tracking-tight text-surface-0">
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
                className="text-surface-200 transition-colors hover:text-surface-0"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/projects"
                className="text-surface-200 transition-colors hover:text-surface-0"
              >
                Projects
              </Link>
            </li>
            <li>
              <Link
                href="/about"
                className="text-surface-200 transition-colors hover:text-surface-0"
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="text-surface-200 transition-colors hover:text-surface-0"
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
          <ul className="mt-4 grid grid-cols-2 gap-y-2 text-sm sm:grid-cols-1">
            {socialLinks.map((l) => (
              <li key={l.label}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="link-reveal text-surface-200"
                >
                  {l.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href={`mailto:${site.email}`}
                className="link-reveal text-surface-200"
              >
                {site.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-surface-700">
        <div className="container-wide flex flex-col items-start justify-between gap-2 py-6 sm:flex-row sm:items-center">
          <p className="font-mono text-xs uppercase tracking-widest text-surface-400">
            © {year} {site.name}
          </p>
          <p className="font-mono text-xs uppercase tracking-widest text-surface-400">
            Built with Next.js · Designed in Open Design
          </p>
        </div>
      </div>
    </footer>
  );
}
