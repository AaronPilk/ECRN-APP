import type { BlogCategory, BlogPost } from "@/lib/blog/types";
import { POSTS_A } from "./batch-a";
import { POSTS_B } from "./batch-b";
import { POSTS_C } from "./batch-c";
import { POSTS_D } from "./batch-d";
import { POSTS_E } from "./batch-e";
import { POSTS_F } from "./batch-f";
import { POSTS_G } from "./batch-g";
import { POSTS_H } from "./batch-h";
import { POSTS_I } from "./batch-i";
import { POSTS_J } from "./batch-j";
import { POSTS_K } from "./batch-k";

/**
 * Every published post, newest first. Posts are static data, so this list is
 * the single source for /blog, the sitemap, RSS, llms.txt and related links.
 * To add a post: create content/blog/posts/<slug>.ts and add it to a batch file.
 */
export const allPosts: BlogPost[] = [...POSTS_A, ...POSTS_B, ...POSTS_C, ...POSTS_D, ...POSTS_E, ...POSTS_F, ...POSTS_G, ...POSTS_H, ...POSTS_I, ...POSTS_J, ...POSTS_K].sort(
  (a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title)
);

export function getPost(slug: string): BlogPost | undefined {
  return allPosts.find((p) => p.slug === slug);
}

export function postsInCategory(category: BlogCategory): BlogPost[] {
  return allPosts.filter((p) => p.category === category);
}

/** Related posts that exist (a post may name a slug that has not shipped yet). */
export function relatedPosts(post: BlogPost, limit = 3): BlogPost[] {
  const named = post.related.map(getPost).filter((p): p is BlogPost => Boolean(p));
  const fill = allPosts.filter((p) => p.slug !== post.slug && p.category === post.category && !named.includes(p));
  return [...named, ...fill].slice(0, limit);
}
