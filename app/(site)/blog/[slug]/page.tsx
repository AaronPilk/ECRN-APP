import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostView } from "@/components/blog/PostView";
import { allPosts, getPost, relatedPosts } from "@/content/blog";
import { postMetadata } from "@/lib/blog/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Only published slugs exist. Anything else is a real 404. */
export const dynamicParams = false;

export function generateStaticParams() {
  return allPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const post = getPost(slug);
  if (!post) return { title: "Guide not found", robots: { index: false, follow: true } };
  return postMetadata(post);
}

export default async function BlogPostPage(props: PageProps) {
  const { slug } = await props.params;
  const post = getPost(slug);
  if (!post) notFound();
  return <PostView post={post} related={relatedPosts(post)} />;
}
