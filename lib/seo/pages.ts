import type { MetadataRoute } from "next";
import { allPosts } from "@/content/blog";
import { GLOSSARY, GLOSSARY_UPDATED_AT } from "@/content/glossary";
import { ROLES } from "@/content/roles";
import { BLOG_CATEGORIES, type BlogCategory, type BlogPost } from "@/lib/blog/types";
import type { GlossaryTerm, RolePage } from "@/lib/careers/types";
import { SITE_URL } from "@/lib/site";
import { IMAGES, isImageName, type SiteImageMeta } from "@/lib/site-images";
import { latestDay } from "./text";

/**
 * One list of every public, indexable page. It feeds sitemap.xml, llms.txt and
 * llms-full.txt, so a page added here shows up in all three.
 *
 * Blog posts, career pages and the glossary come from their own data
 * (content/blog, content/roles.ts, content/glossary.ts) and appear on their
 * own as soon as those files have entries. Open jobs are added in app/sitemap.ts.
 */

/**
 * The day each static page's content last really changed (YYYY-MM-DD).
 * This is the <lastmod> search engines see. Bump a page's date when you edit
 * its copy, and only then. Never set these to "today" on every build.
 */
export const STATIC_PAGE_DATES = {
  "/": "2026-11-20",
  "/jobs": "2026-11-20",
  "/how-it-works": "2026-11-20",
  "/referral-rewards": "2026-11-20",
  "/hire": "2026-11-20",
  "/about": "2026-11-20",
  "/faq": "2026-11-20",
  "/support": "2026-11-20",
  "/terms": "2026-11-20",
  "/privacy": "2026-11-20",
  /** The blog, careers and glossary index pages (their layout, not their entries). */
  "/blog": "2026-11-20",
  "/careers": "2026-11-20",
  "/glossary": "2026-11-20",
} as const;

type StaticPath = keyof typeof STATIC_PAGE_DATES;

/**
 * Photos shown on each static page (names from lib/site-images.ts). A photo is
 * listed in the sitemap only once it is `ready`. Keep this in step with the
 * <SiteImage name="…" /> tags on the page.
 */
export const STATIC_PAGE_PHOTOS: Partial<Record<StaticPath, string[]>> = {
  // Home page, as of Nov 20, 2026: the hero, the two "refer or find a role" tiles and the four "why ECRN" tiles.
  "/": ["hero-jobsite-dusk", "handshake-site", "crew-on-lift", "switchgear-room", "data-center-hall", "conduit-racks", "foreman-plans"],
};

export interface SitePage {
  /** Starts with "/". */
  path: string;
  /** Short name, used as link text in llms.txt. */
  label: string;
  /** One line saying what the page answers. Facts from docs/SITE_BUILD_CONTRACT.md only. */
  answer: string;
  /** YYYY-MM-DD. */
  updatedAt: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
  /** Photo names from lib/site-images.ts. */
  photos: string[];
  /** Legal and support pages: listed under "Optional" in llms.txt. */
  secondary?: boolean;
}

const page = (
  path: StaticPath,
  label: string,
  answer: string,
  changeFrequency: SitePage["changeFrequency"],
  priority: number,
  secondary = false
): SitePage => ({
  path,
  label,
  answer,
  updatedAt: STATIC_PAGE_DATES[path],
  changeFrequency,
  priority,
  photos: STATIC_PAGE_PHOTOS[path] ?? [],
  secondary,
});

/** The marketing, job board and legal pages. Always in the sitemap. */
export const STATIC_PAGES: SitePage[] = [
  page(
    "/",
    "Home",
    "ECRN is a free referral network and job board for electrical construction, powered by Delta Construction Partners. Find a role or refer people you know and earn up to $10,000 per hire.",
    "weekly",
    1
  ),
  page(
    "/jobs",
    "Open jobs",
    "Current electrical construction roles recruited by Delta Construction Partners. Apply with a free account, or refer someone for the role.",
    "daily",
    0.9
  ),
  page(
    "/how-it-works",
    "How it works",
    "Join free, apply to a role or refer someone, Delta's recruiters handle vetting and placement, then you get hired or get paid.",
    "monthly",
    0.8
  ),
  page(
    "/referral-rewards",
    "Referral rewards",
    "Up to $10,000 per hire in four tiers by role level, paid after the referral is placed and completes the guarantee period, typically 90 days.",
    "monthly",
    0.8
  ),
  page(
    "/hire",
    "For employers",
    "Electrical contractors tell Delta Construction Partners what they need to hire, and a recruiter reaches out.",
    "monthly",
    0.7
  ),
  page(
    "/about",
    "About ECRN",
    "ECRN is an initiative of Delta Construction Partners, a construction recruiting firm that has been recruiting since 2008 and has 30+ recruiters.",
    "monthly",
    0.6
  ),
  page(
    "/faq",
    "FAQ",
    "Answers on referral payouts, when they are paid, looking for a job without your employer knowing, what it costs and who is behind ECRN.",
    "monthly",
    0.6
  ),
  page("/support", "Help and support", "How to get help with an ECRN account, a referral or a payout.", "yearly", 0.3, true),
  page(
    "/terms",
    "Terms and referral program terms",
    "The terms of use and the ECRN Referral Compensation Program terms: eligibility, payout tiers, payout conditions and taxes.",
    "yearly",
    0.2,
    true
  ),
  page("/privacy", "Privacy policy", "What ECRN collects, how it is used, and how to delete your account.", "yearly", 0.2, true),
];

/** Posts sorted the way the blog lists them (allPosts is already newest first). */
export function publishedPosts(posts: BlogPost[] = allPosts): BlogPost[] {
  return posts.filter((p) => p.slug);
}

/** Categories that have at least one post, in the order of BLOG_CATEGORIES. */
export function activeCategories(posts: BlogPost[] = allPosts): BlogCategory[] {
  return (Object.keys(BLOG_CATEGORIES) as BlogCategory[]).filter((c) => posts.some((p) => p.category === c));
}

export interface SiteContent {
  posts: BlogPost[];
  roles: RolePage[];
  glossary: GlossaryTerm[];
  glossaryUpdatedAt: string;
}

/** The live content. Tests pass their own. */
export function siteContent(): SiteContent {
  return { posts: publishedPosts(), roles: ROLES, glossary: GLOSSARY, glossaryUpdatedAt: GLOSSARY_UPDATED_AT };
}

/**
 * The blog, careers and glossary index pages. Each is listed only once it has
 * something on it, so an empty index page is never sent to search engines.
 */
export function hubPages(content: SiteContent = siteContent()): SitePage[] {
  const hubs: SitePage[] = [];
  if (content.roles.length) {
    hubs.push({
      ...page(
        "/careers",
        "Career pages",
        "Role guides for electrical construction: what each job does, what it pays or requires, and the referral reward for filling it.",
        "monthly",
        0.8
      ),
      updatedAt: latestDay([...content.roles.map((r) => r.updatedAt), STATIC_PAGE_DATES["/careers"]], STATIC_PAGE_DATES["/careers"]),
    });
  }
  if (content.posts.length) {
    hubs.push({
      ...page(
        "/blog",
        "Blog",
        "Sourced guides on referral rewards, pay, careers, job search and hiring in electrical construction.",
        "weekly",
        0.8
      ),
      updatedAt: latestDay([...content.posts.map((p) => p.updatedAt), STATIC_PAGE_DATES["/blog"]], STATIC_PAGE_DATES["/blog"]),
    });
  }
  if (content.glossary.length) {
    hubs.push({
      ...page("/glossary", "Glossary", "Plain definitions of electrical construction terms.", "monthly", 0.5),
      updatedAt: latestDay([content.glossaryUpdatedAt, STATIC_PAGE_DATES["/glossary"]], STATIC_PAGE_DATES["/glossary"]),
    });
  }
  return hubs;
}

/** Absolute URL on the main host for a path that starts with "/". */
export function absolute(path: string): string {
  return `${SITE_URL}${path}`;
}

/**
 * Absolute URL of a photo for the sitemap: the largest WebP, which is one of
 * the files the page's <picture> offers. Null until the photo is `ready`.
 */
export function photoUrl(name: string): string | null {
  if (!isImageName(name)) return null;
  const meta: SiteImageMeta = IMAGES[name];
  if (!meta.ready) return null;
  const largest = meta.widths[meta.widths.length - 1];
  return largest ? `${SITE_URL}/img/${name}-${largest}.webp` : `${SITE_URL}/img/${name}-og.jpg`;
}

function photoUrls(names: string[]): string[] | undefined {
  const urls = names.map(photoUrl).filter((u): u is string => Boolean(u));
  return urls.length ? urls : undefined;
}

type Entry = MetadataRoute.Sitemap[number];

function entry(path: string, updatedAt: string, changeFrequency: Entry["changeFrequency"], priority: number, photos: string[] = []): Entry {
  const images = photoUrls(photos);
  return { url: absolute(path), lastModified: updatedAt, changeFrequency, priority, ...(images ? { images } : {}) };
}

/**
 * Every indexable page except the open jobs (those come from the database in
 * app/sitemap.ts): static pages, index pages that have content, career pages,
 * blog categories with at least one post, and blog posts.
 */
export function contentSitemap(content: SiteContent = siteContent()): MetadataRoute.Sitemap {
  const { posts, roles } = content;
  const entries: MetadataRoute.Sitemap = [
    ...[...STATIC_PAGES, ...hubPages(content)].map((p) => entry(p.path, p.updatedAt, p.changeFrequency, p.priority, p.photos)),
    ...roles.map((r) => entry(`/careers/${r.slug}`, latestDay([r.updatedAt], STATIC_PAGE_DATES["/careers"]), "monthly", 0.8, [r.image])),
    ...activeCategories(posts).map((c) =>
      entry(
        `/blog/category/${c}`,
        latestDay(posts.filter((p) => p.category === c).map((p) => p.updatedAt), STATIC_PAGE_DATES["/blog"]),
        "weekly",
        0.5
      )
    ),
    ...posts.map((p) => entry(`/blog/${p.slug}`, latestDay([p.updatedAt, p.publishedAt], STATIC_PAGE_DATES["/blog"]), "monthly", 0.7, [p.cover])),
  ];
  // One entry per URL, first one wins.
  const seen = new Set<string>();
  return entries.filter((e) => (seen.has(e.url) ? false : (seen.add(e.url), true)));
}
