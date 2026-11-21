import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Check } from "lucide-react";
import { ContentBlocks, SourcesList, formatDay, headingsOf, wrapButtonClass } from "@/components/content/ContentBlocks";
import { ArrowLink, Breadcrumbs, Container, DeltaBadge, FaqList, FinalCta, SectionHeading } from "@/components/site/Blocks";
import { JsonLd } from "@/components/site/SiteChrome";
import { SiteImage } from "@/components/site/SiteImage";
import { BLOG_PATH } from "@/lib/blog/routes";
import { ANSWER_ID, TAKEAWAYS_ID, blogPostingJsonLd, postCrumbs } from "@/lib/blog/seo";
import { AUTHORS, BLOG_CATEGORIES, readingMinutes, type BlogPost } from "@/lib/blog/types";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/site";
import { cn } from "@/lib/utils/cn";
import { AboutEcrn } from "./AboutEcrn";
import { PostCard, PostGrid } from "./PostCard";
import { TocDisclosure, type TocItem } from "./TableOfContents";
import { TocRail } from "./TocRail";

const FAQ_ID = "questions-people-ask";
const FAQ_HEADING = "Questions people ask";
const SOURCES_ID = "sources";

/** The same backdrop as the site's page heroes: a faint grid, Delta cobalt top right, ECRN green bottom left. */
const HERO_GRID: CSSProperties = {
  backgroundImage:
    "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
  backgroundSize: "56px 56px",
  backgroundPosition: "center top",
  WebkitMaskImage: "radial-gradient(110% 85% at 50% 0%, #000 0%, transparent 78%)",
  maskImage: "radial-gradient(110% 85% at 50% 0%, #000 0%, transparent 78%)",
};
/** Room for the site header (site.css sets --site-header-total) plus a little air above the breadcrumbs. */
const HERO_TOP: CSSProperties = { paddingTop: "calc(var(--site-header-total, 0px) + 0.25rem)" };
const HERO_LIGHT: CSSProperties = {
  backgroundImage:
    "radial-gradient(38rem 30rem at 104% -8%, rgba(6,85,206,0.3), transparent 70%), " +
    "radial-gradient(34rem 24rem at -6% 108%, rgba(22,193,114,0.16), transparent 70%)",
};

/**
 * The full article page: header (with the Delta badge), cover, short answer,
 * takeaways, contents, body, FAQs, sources, the About ECRN box (ECRN and
 * Delta), the next step, related posts and the site CTA, with the structured
 * data that describes exactly those parts.
 *
 * Phones first: one 20 px gutter for everything, a 16:10 cover, the contents
 * as a closed disclosure in the flow (it never floats over the text), and a
 * reading column of about 40 characters a line on a phone and 65 on desktop.
 */
export function PostView({ post, related, more = [] }: { post: BlogPost; related: BlogPost[]; more?: BlogPost[] }) {
  const author = AUTHORS[post.author];
  const crumbs = postCrumbs(post);
  const minutes = readingMinutes(post);

  const sections: TocItem[] = headingsOf(post.body)
    .filter((h) => h.level === 2)
    .map((h) => ({ id: h.id, text: h.text }));
  const toc: TocItem[] = [
    ...sections,
    ...(post.faqs.length ? [{ id: FAQ_ID, text: FAQ_HEADING }] : []),
    ...(post.sources.length ? [{ id: SOURCES_ID, text: "Sources" }] : []),
  ];
  const showToc = sections.length >= 2;

  return (
    <>
      <JsonLd data={blogPostingJsonLd(post)} />
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      {post.faqs.length > 0 && <JsonLd data={faqJsonLd(post.faqs)} />}

      <article>
        {/* Dark header. data-site-hero slides it under the site's glass header, like the other page heroes. */}
        <header data-site-hero className="site-tone-dark relative bg-ecrn-black">
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-clip">
            <div className="absolute inset-0" style={HERO_GRID} />
            <div className="absolute inset-0" style={HERO_LIGHT} />
          </div>

          <Container className="relative lg:pb-32">
            {/* Clears the glass header the hero sits under. The category crumb names the topic, so the post title
                (the H1 just below) is dropped from the trail on small screens. */}
            <div className="max-md:[&_li:last-child]:hidden" style={HERO_TOP}>
              <Breadcrumbs items={crumbs} />
            </div>

            <div className="mt-3 grid gap-8 sm:mt-5 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:items-center lg:gap-14">
              <div>
                {/* Who is behind ECRN, on every page, without scrolling: the same badge as every other page hero. */}
                <DeltaBadge href="/about" />
                <h1 className="mt-5 text-balance font-display text-[34px] font-semibold leading-[1.05] tracking-[-0.03em] sm:mt-6 sm:text-[44px] xl:text-[50px] xl:tracking-[-0.035em]">
                  {post.title}
                </h1>

                <div className="mt-6 space-y-3.5 sm:mt-7">
                  <div className="relative flex items-center gap-3">
                    <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] bg-white/[0.07] ring-1 ring-inset ring-white/15">
                      <svg viewBox="0 0 26 22" fill="none" className="h-[18px] w-auto">
                        <path d="M13 1 L25 21 L13 21 Z" fill="#0FA15D" />
                        <path d="M13 1 L13 21 L1 21 Z" fill="#36DC86" />
                        <path d="M13 9 L18 18 L8 18 Z" fill="#0A100C" />
                      </svg>
                    </span>
                    <p className="min-w-0 text-[15px] leading-tight">
                      <span className="text-white/60">By </span>
                      <Link
                        href={author.url}
                        className="font-medium text-white underline decoration-white/30 underline-offset-[3px] after:absolute after:inset-0 [@media(hover:hover)_and_(pointer:fine)]:hover:decoration-white"
                      >
                        {author.name}
                      </Link>
                      <span className="mt-1 block text-[13px] leading-snug text-white/60">{author.role}</span>
                    </p>
                  </div>

                  <dl className="flex flex-wrap gap-x-4 gap-y-1 text-[13.5px] leading-[1.5] text-white/80">
                    <div className="flex gap-1.5">
                      <dt className="text-white/55">Published</dt>
                      <dd>
                        <time dateTime={post.publishedAt}>{formatDay(post.publishedAt)}</time>
                      </dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt className="text-white/55">Updated</dt>
                      <dd>
                        <time dateTime={post.updatedAt}>{formatDay(post.updatedAt)}</time>
                      </dd>
                    </div>
                    <div className="flex gap-1.5">
                      <dt className="sr-only">Reading time</dt>
                      <dd>{minutes} min read</dd>
                    </div>
                  </dl>

                  {post.reviewedBy && (
                    <p className="flex items-start gap-2 text-[13.5px] leading-snug text-white/80">
                      <BadgeCheck className="mt-px h-4 w-4 shrink-0 text-[#91F9B3]" aria-hidden />
                      <span>
                        Reviewed by <span className="font-medium text-white">{post.reviewedBy.name}</span>, {post.reviewedBy.role}
                      </span>
                    </p>
                  )}
                </div>
              </div>

              {/* Cover: 16:10 on phones and tablets, where it bridges the dark header and the page below; 4:3 beside the title on desktop. */}
              <div className="relative z-10 -mb-14 sm:-mb-20 lg:mb-0">
                <div className="relative aspect-[16/10] overflow-hidden rounded-[20px] shadow-[0_28px_70px_-26px_rgba(0,0,0,0.75)] ring-1 ring-white/10 sm:rounded-[28px] lg:aspect-[4/3]">
                  <SiteImage name={post.cover} fill priority sizes="(min-width: 1024px) 480px, (min-width: 640px) calc(100vw - 64px), calc(100vw - 40px)" />
                </div>
              </div>
            </div>
          </Container>
        </header>

        <Container className="lg:grid lg:grid-cols-[minmax(0,46rem)_15rem] lg:justify-between lg:gap-8 xl:grid-cols-[minmax(0,46rem)_21rem]">
          {/* The reading surface: full-bleed white on phones (same 20 px gutter), a floating sheet from tablets up. */}
          <div className="relative -mx-5 border-b border-ecrn-line bg-white px-5 pb-12 pt-[5.25rem] sm:mx-auto sm:mt-28 sm:max-w-[46rem] sm:rounded-[28px] sm:border sm:px-8 sm:pb-14 sm:pt-10 sm:shadow-[0_1px_2px_rgba(10,16,12,0.05),0_36px_70px_-40px_rgba(10,16,12,0.38)] lg:mx-0 lg:-mt-16 lg:max-w-none lg:pt-12 xl:pt-14">
            {/* The measure: about 40 characters a line on a phone, 65 to 70 at the desktop body size. */}
            <div className="mx-auto max-w-[34rem] md:max-w-[36rem]">
              <section
                id={ANSWER_ID}
                aria-labelledby="short-answer-heading"
                className="relative overflow-hidden rounded-[18px] border border-ecrn-line bg-ecrn-paper py-[18px] pl-[22px] pr-[18px] sm:rounded-[20px] sm:py-6 sm:pl-8 sm:pr-7"
              >
                <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-ecrn-action-bright via-ecrn-green to-cobalt" />
                <h2 id="short-answer-heading" className="font-display text-[13.5px] font-semibold tracking-[-0.005em] text-ecrn-green-text">
                  The short answer
                </h2>
                <p className="mt-2 text-pretty font-display text-[17.5px] font-medium leading-[1.5] tracking-[-0.012em] text-ecrn-ink sm:mt-2.5 sm:text-[20px] sm:leading-[1.48]">
                  {post.answer}
                </p>
              </section>

              {post.keyTakeaways.length > 0 && (
                <section id={TAKEAWAYS_ID} aria-labelledby="key-takeaways-heading" className="mt-8">
                  <h2 id="key-takeaways-heading" className="font-display text-[20px] font-semibold tracking-[-0.015em] text-ecrn-ink">
                    Key takeaways
                  </h2>
                  <ul role="list" className="mt-3.5 space-y-3">
                    {post.keyTakeaways.map((t) => (
                      <li key={t} className="flex gap-3 text-[16.5px] leading-[1.55] text-[#2B3A32]">
                        {/* As tall as the first line, so the tick sits on it. */}
                        <span aria-hidden className="flex h-[1.55em] shrink-0 items-center">
                          <Check className="h-4 w-4 text-ecrn-green-text" strokeWidth={2.75} />
                        </span>
                        <span className="text-pretty">{t}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {showToc && <TocDisclosure items={toc} className="mt-8 lg:hidden" />}

              <ContentBlocks blocks={post.body} className="mt-10 border-t border-ecrn-line pt-10" />

              {post.faqs.length > 0 && (
                <section id={FAQ_ID} aria-labelledby="post-faq-heading" className="mt-14">
                  <h2 id="post-faq-heading" className="text-balance font-display text-[27px] font-semibold leading-[1.12] tracking-[-0.025em] text-ecrn-ink sm:text-[32px] sm:leading-[1.1]">
                    {FAQ_HEADING}
                  </h2>
                  <div className="mt-5">
                    <FaqList faqs={post.faqs} />
                  </div>
                </section>
              )}

              {/* The FAQ list ends with its own rule, so the sources skip theirs when both are shown. */}
              <div id={SOURCES_ID}>
                <SourcesList sources={post.sources} className={post.faqs.length > 0 ? "border-t-0 pt-0" : undefined} />
              </div>

              <AboutEcrn author={post.author} className="mt-12" />
              <NextStep post={post} className="mt-4" />
            </div>
          </div>

          {showToc && (
            <div className="hidden lg:block lg:pb-16 lg:pt-12">
              <TocRail items={toc} className="sticky top-24 max-h-[calc(100vh-7.5rem)] overflow-y-auto pr-1" />
            </div>
          )}
        </Container>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related-guides-heading" className="pb-14 pt-12 sm:pb-24 sm:pt-20">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-1">
              <SectionHeading title={<span id="related-guides-heading">Related guides</span>} />
              <ArrowLink href={BLOG_PATH}>All guides</ArrowLink>
            </div>
            {related.length === 1 ? (
              <PostCard post={related[0]} featured className="mt-5 sm:mt-8" />
            ) : (
              <PostGrid posts={related} columns={related.length === 2 ? 2 : 3} className="mt-5 sm:mt-8" />
            )}
          </Container>
        </section>
      )}

      {more.length > 0 && <MoreInTopic post={post} posts={more} />}

      <FinalCta />
    </>
  );
}

/**
 * Every other guide on the same topic, as a plain list of links. It keeps
 * each post within reach of its siblings (the SOP's "new pages get links
 * from older pages on the same topic") without another row of cards.
 */
function MoreInTopic({ post, posts }: { post: BlogPost; posts: BlogPost[] }) {
  const label = BLOG_CATEGORIES[post.category].label;
  return (
    <section aria-labelledby="more-in-topic-heading" className="pb-14 sm:pb-20">
      <Container>
        <div className="border-t border-ecrn-line pt-8 sm:pt-10">
          <h2 id="more-in-topic-heading" className="font-display text-[20px] font-semibold tracking-[-0.015em] text-ecrn-ink sm:text-[22px]">
            More on {label.toLowerCase()}
          </h2>
          <ul className="mt-3 grid gap-x-10 sm:grid-cols-2">
            {posts.map((p) => (
              <li key={p.slug} className="border-b border-ecrn-line">
                <Link
                  href={`${BLOG_PATH}/${p.slug}`}
                  className="flex min-h-[52px] items-center justify-between gap-4 py-3 text-[16px] leading-snug text-ecrn-ink active:opacity-70 [@media(hover:hover)]:hover:text-ecrn-green-text"
                >
                  <span>{p.title}</span>
                  <ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-ecrn-secondary" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

/**
 * What to do after reading: the page this post supports, as the one green
 * button, and a second, quieter way in. Inside the article, so the page does
 * not stack two dark call-to-action panels on top of each other.
 */
function NextStep({ post, className }: { post: BlogPost; className?: string }) {
  // Second link beside the money page: sign up, or the job board when the money page is sign-up itself.
  const secondary = post.moneyPage.href === "/signup" ? { href: "/jobs", label: "Browse open jobs" } : { href: "/signup", label: "Sign up free" };
  return (
    <section aria-labelledby="next-step-heading" className={cn("rounded-[22px] border border-ecrn-line bg-ecrn-paper px-5 pb-3 pt-5 sm:rounded-[26px] sm:px-8 sm:pb-4 sm:pt-7", className)}>
      <h2 id="next-step-heading" className="font-display text-[13.5px] font-semibold tracking-[-0.005em] text-ecrn-green-text">
        Next step
      </h2>
      <p className="mt-2 text-pretty text-[16px] leading-[1.6] text-[#2B3A32]">
        ECRN is free to join. One account lets you apply to open roles and refer people you know.
      </p>
      <Link href={post.moneyPage.href} className={cn(wrapButtonClass, "mt-4")}>
        <span>{post.moneyPage.label}</span>
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
      </Link>
      <div className="mt-1">
        <ArrowLink href={secondary.href}>{secondary.label}</ArrowLink>
      </div>
    </section>
  );
}
