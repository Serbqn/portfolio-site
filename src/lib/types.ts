// Shared types for the portfolio. Mirrors the shape of content/*.json files.

export type SocialLinks = {
  dribbble?: string;
  behance?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
};

export type Site = {
  name: string;
  role: string;
  tagline: string;
  description: string;
  location: string;
  availability: string;
  email: string;
  social: SocialLinks;
  /** Optional custom SVG path data for the logo icon. If empty, a default icon is used. */
  logo?: string;
};

export type Cta = { label: string; href: string };

export type Hero = {
  eyebrow: string;
  headline: string;
  subheadline: string;
  primaryCta: Cta;
  secondaryCta: Cta;
};

export type Skill = { name: string; level: number };

export type Intro = {
  eyebrow: string;
  title: string;
  body: string;
};

export type Home = {
  intro: Intro;
  featuredTitle: string;
  featuredCount: number;
  skills: Skill[];
  tools: string[];
};

export type Experience = {
  year: string;
  role: string;
  company: string;
  summary: string;
};

export type About = {
  eyebrow: string;
  title: string;
  lead: string;
  sections: { heading: string; body: string }[];
  experience: Experience[];
};

export type Contact = {
  eyebrow: string;
  title: string;
  lead: string;
  submitLabel: string;
};

export type ProcessStep = {
  label: string;
  value: string;
};

export type Process = {
  eyebrow: string;
  steps: ProcessStep[];
  footer: string;
};

export type SiteContent = {
  site: Site;
  hero: Hero;
  home: Home;
  about: About;
  contact: Contact;
  process: Process;
};

export type Metric = { label: string; value: string };

export type ProjectMeta = {
  slug: string;
  title: string;
  subtitle: string;
  role: string;
  year: string;
  client: string;
  tags: string[];
  featured: boolean;
  cover: string;
  summary: string;
  metrics: Metric[];
  gallery?: string[];
};

export type ProjectListItem = ProjectMeta;

export type ProjectFull = ProjectMeta & {
  problem: string;
  process: string;
  solution: string;
  results: string;
  contentPath: string;
};
