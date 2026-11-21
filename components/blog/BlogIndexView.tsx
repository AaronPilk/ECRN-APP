import { Rss } from "lucide-react";
import { ArrowLink, Breadcrumbs, Container, DeltaBand, FinalCta, PageHero, SectionHeading } from "@/components/site/Blocks";
import { JsonLd } from "@/components/site/SiteChrome";
import { BLOG_RSS_PATH, categoriesWithPosts } from "@/lib/blog/routes";
import { BLOG_CRUMBS, BLOG_HEADING, blogJsonLd } from "@/lib/blog/seo";
import type { BlogPost } from "@/lib/blog/types";
import { breadcrumbJsonLd } from "@/lib/site";
import { CategoryNav } from "./CategoryNav";
import { PostCard, PostGrid } from "./PostCard";

/** Where to send a visitor while no guide is published yet. */
const START_HERE = [
  { href: "/how-it-works", label: "How ECRN works" },
  { href: "/referral-rewards", label: "Referral rewards by role" },
  { href: "/jobs", label: "Open electrical construction jobs" },
];

/** Breadcrumb row under a hero (the crumb links are 44 px targets in Breadcrumbs itself). */
export const CRUMB_ROW = "pt-5 sm:pt-6";

/**
 * The blog index: hero, topics, the latest post as the lead story, then every
 * other post (a list on phones, cards from 640 px). `posts` is newest first
 * (allPosts). With no posts it shows a short holding message instead of an
 * empty grid.
 */
export function BlogIndexView({ posts }: { posts: BlogPost[] }) {
  const [latest, ...rest] = posts;

  return (
    <>
      <JsonLd data={blogJsonLd(posts)} />
      <JsonLd data={breadcrumbJsonLd(BLOG_CRUMBS)} />

      <PageHero
        eyebrow="The ECRN blog"
        title={BLOG_HEADING}
        intro={
          <p>
            Straight answers on what electrical construction jobs pay, how careers move from the field to the office, and how
            referral rewards work. Each guide opens with the short answer, then shows the detail and its sources.
          </p>
        }
      />

      <Container className={CRUMB_ROW}>
        <Breadcrumbs items={BLOG_CRUMBS} />
      </Container>

      {latest ? (
        <>
          <Container className="mt-3 sm:mt-4">
            <CategoryNav categories={categoriesWithPosts(posts)} />
          </Container>

          <section aria-labelledby="latest-heading" className="pt-8 sm:pt-12">
            <Container>
              <h2 id="latest-heading" className="font-display text-[17px] font-semibold tracking-[-0.01em] text-ecrn-ink">
                Latest guide
              </h2>
              <PostCard post={latest} featured priority className="mt-3 sm:mt-4" />
            </Container>
          </section>

          {rest.length > 0 && (
            <section aria-labelledby="more-guides-heading" className="pt-14 sm:pt-24">
              <Container>
                <SectionHeading title={<span id="more-guides-heading">More guides</span>} />
                <PostGrid posts={rest} className="mt-6 sm:mt-10" />
              </Container>
            </section>
          )}

          <Container className="pb-2 pt-6 sm:pb-6 sm:pt-8">
            <a
              href={BLOG_RSS_PATH}
              className="inline-flex min-h-[44px] items-center gap-2 text-[15px] font-medium text-ecrn-secondary [@media(hover:hover)_and_(pointer:fine)]:hover:text-ecrn-ink"
            >
              <Rss className="h-4 w-4 text-ecrn-green-text" aria-hidden />
              Follow new guides by RSS
            </a>
          </Container>
        </>
      ) : (
        <section aria-label="Coming soon" className="pb-4 pt-8 sm:pb-8 sm:pt-12">
          <Container>
            <div className="rounded-[28px] border border-ecrn-line bg-white px-5 py-10 sm:px-12 sm:py-16">
              <SectionHeading
                title="The first guides are on the way"
                intro={
                  <p>
                    We are writing guides on pay, career paths and referral rewards in electrical construction. Until they are
                    published, these pages cover the essentials.
                  </p>
                }
              />
              <ul role="list" className="mt-6 flex flex-col gap-x-8 sm:flex-row sm:flex-wrap">
                {START_HERE.map((l) => (
                  <li key={l.href}>
                    <ArrowLink href={l.href}>{l.label}</ArrowLink>
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </section>
      )}

      {/* Who is behind ECRN: the one Delta statement for this page. */}
      <DeltaBand />
      <FinalCta />
    </>
  );
}
