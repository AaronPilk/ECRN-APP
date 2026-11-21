import type { Metadata } from "next";
import { SITE_URL, absoluteUrl, pageMeta } from "@/lib/site";
import { IMAGES, isImageName, ogImagePath, type SiteImageMeta } from "@/lib/site-images";
import { isoNoon, titleCase } from "./format";
import { BLOG_PATH, BLOG_RSS_PATH, categoryPath, postPath } from "./routes";
import { AUTHORS, BLOG_CATEGORIES, wordCount, type BlogCategory, type BlogPost } from "./types";

/**
 * Metadata and structured data for the blog (PILK AI SEO SOP, Phases 3 and 5).
 * Everything here describes what the pages actually show: nothing more.
 */

export const BLOG_NAME = "ECRN Blog";
export const BLOG_HEADING = "Electrical construction careers, pay and referral guides";
export const BLOG_META_TITLE = "Electrical Construction Career, Pay & Referral Guides | ECRN";
export const BLOG_DESCRIPTION =
  "Electrical construction guides from ECRN: what roles pay, how to move up, how referral bonuses work and where the demand is. Answer first, with sources.";

const ORG_ID = `${SITE_URL}/#organization`;
const BLOG_ID = `${absoluteUrl(BLOG_PATH)}#blog`;

/** <link rel="alternate" type="application/rss+xml"> for every blog page. */
const RSS_ALTERNATE = { "application/rss+xml": [{ url: absoluteUrl(BLOG_RSS_PATH), title: BLOG_NAME }] };

type Crumb = { name: string; path: string };

const HOME: Crumb = { name: "Home", path: "/" };
const BLOG: Crumb = { name: "Blog", path: BLOG_PATH };

export const BLOG_CRUMBS: Crumb[] = [HOME, BLOG];

export function categoryCrumbs(category: BlogCategory): Crumb[] {
  return [HOME, BLOG, { name: BLOG_CATEGORIES[category].label, path: categoryPath(category) }];
}

export function postCrumbs(post: BlogPost): Crumb[] {
  return [...categoryCrumbs(post.category), { name: post.title, path: postPath(post.slug) }];
}

/** H1 of a category page, in the words people search. */
export function categoryHeading(category: BlogCategory): string {
  return `${BLOG_CATEGORIES[category].label}: electrical construction guides`;
}

/** The longest option that fits, so titles and descriptions use the room they have. */
function fit(options: string[], max: number): string {
  return options.find((o) => o.length <= max) ?? options[options.length - 1];
}

const DESCRIPTION_ENDINGS = [
  "Answer-first guides from ECRN, the free referral network and job board powered by Delta Construction Partners.",
  "Answer-first guides from ECRN, the referral network and job board powered by Delta Construction Partners.",
  "Answer-first guides from ECRN, the referral network powered by Delta Construction Partners.",
  "Answer-first guides from ECRN, powered by Delta Construction Partners.",
];

export function blogIndexMetadata(): Metadata {
  const base = pageMeta({ title: BLOG_META_TITLE, description: BLOG_DESCRIPTION, path: BLOG_PATH });
  return { ...base, alternates: { ...base.alternates, types: RSS_ALTERNATE } };
}

export function categoryMetadata(category: BlogCategory): Metadata {
  const c = BLOG_CATEGORIES[category];
  const label = titleCase(c.label);
  const title = fit(
    [`${label}: Electrical Construction Guides and Data | ECRN`, `${label}: Electrical Construction Guides | ECRN`, `${label} Guides | ECRN`],
    60
  );
  const description = fit(
    DESCRIPTION_ENDINGS.map((ending) => `${c.description} ${ending}`),
    160
  );
  const base = pageMeta({ title, description, path: categoryPath(category) });
  return { ...base, alternates: { ...base.alternates, types: RSS_ALTERNATE } };
}

/** The post's own share image once the photo exists, otherwise null (callers fall back to the site default). */
export function shareImage(cover: string): { url: string; alt: string } | null {
  const og = ogImagePath(cover);
  if (!og || !isImageName(cover)) return null;
  return { url: absoluteUrl(og), alt: IMAGES[cover].alt };
}

export function postMetadata(post: BlogPost): Metadata {
  const author = AUTHORS[post.author];
  const share = shareImage(post.cover);
  const base = pageMeta({ title: post.metaTitle, description: post.description, path: postPath(post.slug), image: share?.url });
  return {
    ...base,
    alternates: { ...base.alternates, types: RSS_ALTERNATE },
    authors: [{ name: author.name, url: absoluteUrl(author.url) }],
    // Let search results use the full cover image and a full-length snippet.
    robots: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    openGraph: {
      ...base.openGraph,
      ...(share ? { images: [{ url: share.url, width: 1200, height: 630, alt: share.alt }] } : {}),
      locale: "en_US",
      type: "article",
      publishedTime: isoNoon(post.publishedAt),
      modifiedTime: isoNoon(post.updatedAt),
      section: BLOG_CATEGORIES[post.category].label,
      authors: [absoluteUrl(author.url)],
    },
  };
}

const blogRef = { "@type": "Blog", "@id": BLOG_ID, name: BLOG_NAME, url: absoluteUrl(BLOG_PATH) };

/** Blog + the posts listed on the page. */
export function blogJsonLd(posts: BlogPost[]) {
  return {
    "@context": "https://schema.org",
    ...blogRef,
    description: BLOG_DESCRIPTION,
    inLanguage: "en-US",
    publisher: { "@id": ORG_ID },
    ...(posts.length
      ? {
          blogPost: posts.map((p) => ({
            "@type": "BlogPosting",
            headline: p.title,
            url: absoluteUrl(postPath(p.slug)),
            datePublished: isoNoon(p.publishedAt),
          })),
        }
      : {}),
  };
}

/** A category page: a collection of the posts it lists, in order. */
export function categoryJsonLd(category: BlogCategory, posts: BlogPost[]) {
  const url = absoluteUrl(categoryPath(category));
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${url}#collection`,
    url,
    name: categoryHeading(category),
    description: BLOG_CATEGORIES[category].description,
    inLanguage: "en-US",
    isPartOf: blogRef,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: posts.length,
      itemListElement: posts.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.title, url: absoluteUrl(postPath(p.slug)) })),
    },
  };
}

/** Share image plus a wide 16:9 file, both absolute. Empty until the photo exists. */
function postImages(cover: string): string[] {
  const og = ogImagePath(cover);
  if (!og || !isImageName(cover)) return [];
  const meta: SiteImageMeta = IMAGES[cover];
  const wide = meta.widths.filter((w) => w >= 1200 && w <= 1920).pop() ?? meta.widths[meta.widths.length - 1];
  return [absoluteUrl(og), ...(wide ? [absoluteUrl(`/img/${cover}-${wide}.webp`)] : [])];
}

/** Ids of the on-page elements an answer engine should quote first. */
export const ANSWER_ID = "short-answer";
export const TAKEAWAYS_ID = "key-takeaways";

export function blogPostingJsonLd(post: BlogPost) {
  const author = AUTHORS[post.author];
  const url = absoluteUrl(postPath(post.slug));
  const images = postImages(post.cover);
  const keywords = [...new Set([post.targetQuery, ...post.secondaryQueries].map((k) => k.trim()).filter(Boolean))];
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    url,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
      ...(post.reviewedBy ? { reviewedBy: { "@type": "Person", name: post.reviewedBy.name, jobTitle: post.reviewedBy.role } } : {}),
    },
    headline: post.title,
    description: post.description,
    abstract: post.answer,
    ...(images.length ? { image: images } : {}),
    datePublished: isoNoon(post.publishedAt),
    dateModified: isoNoon(post.updatedAt),
    author: { "@type": "Organization", name: author.name, url: absoluteUrl(author.url), parentOrganization: { "@id": ORG_ID } },
    publisher: { "@id": ORG_ID },
    isPartOf: blogRef,
    articleSection: BLOG_CATEGORIES[post.category].label,
    wordCount: wordCount(post),
    ...(keywords.length ? { keywords } : {}),
    inLanguage: "en-US",
    isAccessibleForFree: true,
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [`#${ANSWER_ID}`, ...(post.keyTakeaways.length ? [`#${TAKEAWAYS_ID}`] : [])],
    },
    ...(post.sources.length
      ? {
          citation: post.sources.map((s) => ({
            "@type": "CreativeWork",
            name: s.title,
            url: s.url,
            publisher: { "@type": "Organization", name: s.publisher },
          })),
        }
      : {}),
  };
}
