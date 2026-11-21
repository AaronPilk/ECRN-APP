import { BLOG_CATEGORIES, type BlogCategory, type BlogPost } from "./types";

/**
 * Blog URLs in one place, so pages, cards, the sitemap, RSS and llms.txt
 * never disagree about where a post lives.
 */

export const BLOG_PATH = "/blog";
export const BLOG_RSS_PATH = "/blog/rss.xml";

export function postPath(slug: string): string {
  return `${BLOG_PATH}/${slug}`;
}

export function categoryPath(category: BlogCategory): string {
  return `${BLOG_PATH}/category/${category}`;
}

export function isBlogCategory(value: string): value is BlogCategory {
  return Object.prototype.hasOwnProperty.call(BLOG_CATEGORIES, value);
}

/** Every category key, in the order they are declared. */
export const BLOG_CATEGORY_KEYS = Object.keys(BLOG_CATEGORIES) as BlogCategory[];

/** Categories that have at least one of the given posts, in declared order. */
export function categoriesWithPosts(posts: BlogPost[]): BlogCategory[] {
  return BLOG_CATEGORY_KEYS.filter((c) => posts.some((p) => p.category === c));
}
