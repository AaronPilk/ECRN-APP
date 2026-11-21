import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryNav } from "@/components/blog/CategoryNav";
import { PostCard, PostGrid } from "@/components/blog/PostCard";
import { Breadcrumbs, Container, DeltaBand, FinalCta, PageHero } from "@/components/site/Blocks";
import { JsonLd } from "@/components/site/SiteChrome";
import { allPosts, postsInCategory } from "@/content/blog";
import { BLOG_CATEGORY_KEYS, categoriesWithPosts, isBlogCategory } from "@/lib/blog/routes";
import { categoryCrumbs, categoryHeading, categoryJsonLd, categoryMetadata } from "@/lib/blog/seo";
import { BLOG_CATEGORIES } from "@/lib/blog/types";
import { breadcrumbJsonLd } from "@/lib/site";

interface PageProps {
  params: Promise<{ category: string }>;
}

/** Only the categories in BLOG_CATEGORIES exist. A category with no posts yet is a 404 as well. */
export const dynamicParams = false;

export function generateStaticParams() {
  return BLOG_CATEGORY_KEYS.map((category) => ({ category }));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { category } = await props.params;
  if (!isBlogCategory(category) || postsInCategory(category).length === 0) {
    return { title: "Topic not found", robots: { index: false, follow: true } };
  }
  return categoryMetadata(category);
}

export default async function BlogCategoryPage(props: PageProps) {
  const { category } = await props.params;
  if (!isBlogCategory(category)) notFound();
  const posts = postsInCategory(category);
  if (posts.length === 0) notFound();

  const crumbs = categoryCrumbs(category);
  // 1, 4, 7... posts would leave one card alone in a three-column row, so the newest becomes the lead story.
  const leadFirst = posts.length % 3 === 1;
  const gridPosts = leadFirst ? posts.slice(1) : posts;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={categoryJsonLd(category, posts)} />

      <PageHero
        eyebrow="The ECRN blog"
        title={categoryHeading(category)}
        intro={<p>{BLOG_CATEGORIES[category].description} Each guide opens with the short answer, then shows the detail and its sources.</p>}
      />

      <Container className="py-6">
        <Breadcrumbs items={crumbs} />
      </Container>

      <Container>
        <CategoryNav categories={categoriesWithPosts(allPosts)} current={category} />
      </Container>

      <section aria-labelledby="category-posts-heading" className="pb-6 pt-10 sm:pb-10 sm:pt-12">
        <Container>
          <h2 id="category-posts-heading" className="font-mono text-[12px] uppercase tracking-[0.16em] text-ecrn-green-text">
            {posts.length === 1 ? "1 guide" : `${posts.length} guides, newest first`}
          </h2>
          {/* Fill the row whatever the count: a lead story when one card would sit alone, two columns for two posts. */}
          {leadFirst && <PostCard post={posts[0]} featured priority className="mt-4" />}
          {gridPosts.length > 0 && (
            <PostGrid posts={gridPosts} columns={gridPosts.length === 2 ? 2 : 3} priorityFirst={!leadFirst} className={leadFirst ? "mt-6" : "mt-4"} />
          )}
        </Container>
      </section>

      {/* Who is behind ECRN: the one Delta statement for this page. */}
      <DeltaBand />
      <FinalCta />
    </>
  );
}
