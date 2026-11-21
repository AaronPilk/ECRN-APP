import type { Block, BlogFaq, BlogSource } from "@/lib/blog/types";

/**
 * Career ("money") pages: one per role Delta Construction Partners recruits
 * for, at /careers/<slug>. Same block format as blog posts.
 */
export interface RolePage {
  /** URL slug: /careers/<slug>. */
  slug: string;
  /** Role name, singular: "Electrical Superintendent". */
  title: string;
  /** Plural, lower case, for sentences: "electrical superintendents". */
  plural: string;
  /** H1. */
  heading: string;
  /** <title>: 50–60 characters, "| ECRN" last. */
  metaTitle: string;
  /** Meta description: 140–160 characters. */
  description: string;
  /** Answer-first: two sentences on what the role is and what it pays or needs. Plain text. */
  answer: string;
  /** Index into TIERS in lib/site.ts (0 = Tier 1 field … 3 = Tier 4 executive). */
  tierIndex: 0 | 1 | 2 | 3;
  /** Lower-case words that mark an open job as this role (matched against the job title). */
  jobKeywords: string[];
  /** Image name from lib/site-images.ts. */
  image: string;
  body: Block[];
  faqs: BlogFaq[];
  sources: BlogSource[];
  /** Blog post slugs that go deeper on this role. */
  relatedPosts: string[];
  /** Other role slugs on the same career path. */
  relatedRoles: string[];
  /** YYYY-MM-DD. */
  updatedAt: string;
}

export interface GlossaryTerm {
  /** Anchor on /glossary: #<slug>. */
  slug: string;
  term: string;
  /** Also known as. */
  aka?: string[];
  /** One or two plain sentences an AI answer could quote as-is. */
  definition: string;
  /** Optional link to a deeper page on this site. */
  href?: string;
  /** Source id in GLOSSARY_SOURCES when the definition leans on a code or standard. */
  source?: number;
}
