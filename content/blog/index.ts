import type { BlogCategory, BlogPost } from "@/lib/blog/types";
import { POSTS_A } from "./batch-a";
import { POSTS_B } from "./batch-b";
import { POSTS_C } from "./batch-c";

/**
 * Every published post, newest first. Posts are static data, so this list is
 * the single source for /blog, the sitemap, RSS, llms.txt and related links.
 * To add a post: create content/blog/posts/<slug>.ts and add it to a batch file.
 */
export const allPosts: BlogPost[] = [...POSTS_A, ...POSTS_B, ...POSTS_C].sort(
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
