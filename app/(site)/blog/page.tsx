import { BlogIndexView } from "@/components/blog/BlogIndexView";
import { allPosts } from "@/content/blog";
import { blogIndexMetadata } from "@/lib/blog/seo";

/** /blog: every published guide, newest first. Includes the RSS discovery link. */
export const metadata = blogIndexMetadata();

export default function BlogIndexPage() {
  return <BlogIndexView posts={allPosts} />;
}
