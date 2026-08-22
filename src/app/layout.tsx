import type { Metadata } from "next";
import { Geist, JetBrains_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getSite, getProjects } from "@/lib/content";

/** GA4 measurement ID ("G-XXXXXXXXXX"). Analytics loads only when set. */
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

const sans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { site, hero } = await getSite();
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://serb.design",
    ),
    title: {
      default: `${site.name} — ${site.role}`,
      template: `%s — ${site.name}`,
    },
    description: site.description,
    openGraph: {
      type: "website",
      title: `${site.name} — ${site.role}`,
      description: hero.subheadline,
      siteName: site.name,
    },
    twitter: {
      card: "summary_large_image",
      title: `${site.name} — ${site.role}`,
      description: hero.subheadline,
    },
    icons: {
      icon: [
        { url: "/api/favicon", type: "image/svg+xml" },
        { url: "/api/favicon/png?size=32", type: "image/png", sizes: "32x32" },
        { url: "/api/favicon/png?size=16", type: "image/png", sizes: "16x16" },
      ],
      // Safari/iOS don't support SVG favicons — PNG rendered from the same logo.
      apple: [{ url: "/api/favicon/png?size=180" }],
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [{ site }, projects] = await Promise.all([getSite(), getProjects()]);
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body className="grain min-h-screen flex flex-col bg-surface-900 text-surface-0 antialiased">
        <Navbar
          name={site.name}
          role={site.role}
          logo={site.logo}
          projects={projects}
        />
        <main className="flex-1">{children}</main>
        <Footer />
        {/* Google Analytics 4 — renders nothing when NEXT_PUBLIC_GA_ID is unset */}
        {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
      </body>
    </html>
  );
}
