import type { Metadata } from "next";
import { getSite } from "@/lib/content";
import { ContactForm } from "@/components/contact/ContactForm";
import { SocialLinks } from "@/components/contact/SocialLinks";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Have a project in mind? I take on a small number of engagements per quarter.",
};

export default async function ContactPage() {
  const { contact, site } = await getSite();

  return (
    <section className="container-wide section">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <p className="eyebrow">
            <span className="eyebrow-dot" />
            {contact.eyebrow}
          </p>
          <h1 className="mt-3 text-display-1 font-semibold tracking-tight text-balance">
            {contact.title}
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-pretty text-surface-600">
            {contact.lead}
          </p>

          <div className="mt-10">
            <h2 className="font-mono text-xs uppercase tracking-widest text-surface-500">
              Direct
            </h2>
            <a
              href={`mailto:${site.email}`}
              className="link-reveal mt-2 inline-block text-base font-medium text-surface-950"
            >
              {site.email}
            </a>
            <p className="mt-1 text-sm text-surface-500">{site.location}</p>
          </div>

          <div className="mt-10">
            <h2 className="font-mono text-xs uppercase tracking-widest text-surface-500">
              Elsewhere
            </h2>
            <SocialLinks
              social={site.social}
              className="mt-3 grid grid-cols-2 gap-y-2"
            />
          </div>
        </div>

        <div className="lg:col-span-7">
          <ContactForm
            submitLabel={contact.submitLabel}
            contactEmail={site.email}
          />
        </div>
      </div>
    </section>
  );
}
