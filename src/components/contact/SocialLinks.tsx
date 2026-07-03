import type { SocialLinks as SocialLinksType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SocialLinks({
  social,
  className,
}: {
  social: SocialLinksType;
  className?: string;
}) {
  const items: { label: string; href: string }[] = [];
  if (social.dribbble) items.push({ label: "Dribbble", href: social.dribbble });
  if (social.behance) items.push({ label: "Behance", href: social.behance });
  if (social.linkedin) items.push({ label: "LinkedIn", href: social.linkedin });
  if (social.github) items.push({ label: "GitHub", href: social.github });
  if (social.twitter) items.push({ label: "X", href: social.twitter });

  return (
    <ul className={cn("text-sm", className)}>
      {items.map((l) => (
        <li key={l.label}>
          <a
            href={l.href}
            target="_blank"
            rel="noreferrer noopener"
            className="link-reveal text-surface-700"
          >
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
