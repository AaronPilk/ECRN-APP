import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Check, Zap } from "lucide-react";
import { ContentBlocks, SourcesList, formatDay, headingsOf } from "@/components/content/ContentBlocks";
import { ArrowLink, Breadcrumbs, Container, CtaLink, FaqList, FinalCta, SectionHeading } from "@/components/site/Blocks";
import { JsonLd } from "@/components/site/SiteChrome";
import { SiteImage } from "@/components/site/SiteImage";
import { BLOG_PATH } from "@/lib/blog/routes";
import { ANSWER_ID, TAKEAWAYS_ID, blogPostingJsonLd, postCrumbs } from "@/lib/blog/seo";
import { AUTHORS, BLOG_CATEGORIES, readingMinutes, type BlogPost } from "@/lib/blog/types";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/site";
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
 * Article body: 17px on phones, 18px from tablets up. The stat rules keep big
 * numbers inside their cards in a column this narrow: three across needs
 * tablet width, and four across becomes two by two.
 */
const BODY =
  "mt-10 border-t border-ecrn-line pt-10 md:text-[18px] " +
  "[&>dl_dd]:[overflow-wrap:anywhere] " +
  "sm:max-md:[&>dl:has(>div:nth-child(3):last-child)]:grid-cols-1 " +
  "lg:[&>dl:has(>div:nth-child(4))]:grid-cols-2";

/**
 * Money page labels can run to 50 characters. On a phone the first button may
 * wrap onto two lines (left-aligned, arrow at the end) instead of pushing the
 * panel sideways. Scoped from the wrapper so it outranks the button's own rules.
 */
const CTA_ROW =
  "mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap " +
  "max-sm:[&>a:first-child]:h-auto max-sm:[&>a:first-child]:min-h-[3.25rem] max-sm:[&>a:first-child]:justify-between " +
  "max-sm:[&>a:first-child]:whitespace-normal max-sm:[&>a:first-child]:px-5 max-sm:[&>a:first-child]:py-3.5 " +
  "max-sm:[&>a:first-child]:text-left max-sm:[&>a:first-child]:leading-[1.25]";

/**
 * The full article page: header, cover, short answer, takeaways, contents,
 * body, FAQs, sources, about box, next step, related posts and the site CTA,
 * with the structured data that describes exactly those parts.
 */
export function PostView({ post, related }: { post: BlogPost; related: BlogPost[] }) {
  const author = AUTHORS[post.author];
  const category = BLOG_CATEGORIES[post.category];
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

  // Second button beside the money page: sign up, or the job board when the money page is sign-up itself.
  const secondary = post.moneyPage.href === "/signup" ? { href: "/jobs", label: "Browse open jobs" } : { href: "/signup", label: "Sign up free" };

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
            {/* Clears the glass header the hero sits under. The post title is the H1 just below, so its crumb is
                dropped on small screens, and the crumb links get a full-height tap target. */}
            <div className="max-md:[&_li:last-child]:hidden [&_a]:min-h-[44px]" style={HERO_TOP}>
              <Breadcrumbs items={crumbs} />
            </div>

            <div className="mt-2.5 grid gap-9 sm:mt-4 lg:mt-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:items-center lg:gap-14">
              <div>
                <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-[#91F9B3]">{category.label}</p>
                <h1 className="mt-3.5 text-balance font-display text-[33px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[42px] lg:text-[44px] xl:text-[50px] xl:leading-[1.05] xl:tracking-[-0.035em]">
                  {post.title}
                </h1>

                <div className="mt-7 space-y-4">
                  <div className="relative flex items-center gap-3">
                    <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/[0.07] ring-1 ring-inset ring-white/15">
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

                  <dl className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13.5px] text-white/80">
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

              {/* Cover: bridges the dark header and the page below on phones and tablets, sits beside the title on desktop. */}
              <div className="relative z-10 -mb-14 sm:-mb-20 lg:mb-0">
                <div className="relative aspect-[16/9] overflow-hidden rounded-[22px] shadow-[0_28px_70px_-26px_rgba(0,0,0,0.75)] ring-1 ring-white/10 sm:rounded-[28px] lg:aspect-[4/3]">
                  <SiteImage name={post.cover} fill priority sizes="(min-width: 1024px) 480px, (min-width: 640px) calc(100vw - 64px), calc(100vw - 40px)" />
                </div>
              </div>
            </div>
          </Container>
        </header>

        <Container className="lg:grid lg:grid-cols-[minmax(0,46rem)_15rem] lg:justify-between lg:gap-8 xl:grid-cols-[minmax(0,46rem)_21rem]">
          {/* The reading surface: full-bleed white on phones, a floating sheet from tablets up. */}
          <div className="relative -mx-5 border-b border-ecrn-line bg-white px-5 pb-12 pt-[5.25rem] sm:mx-auto sm:mt-28 sm:max-w-[46rem] sm:rounded-[28px] sm:border sm:px-8 sm:pb-14 sm:pt-10 sm:shadow-[0_1px_2px_rgba(10,16,12,0.05),0_36px_70px_-40px_rgba(10,16,12,0.38)] lg:mx-0 lg:-mt-16 lg:max-w-none lg:pt-12 xl:pt-14">
            {/* The measure: about 70 characters a line at the body size. */}
            <div className="mx-auto max-w-[34rem] md:max-w-[36rem]">
              <section
                id={ANSWER_ID}
                aria-labelledby="short-answer-heading"
                className="relative overflow-hidden rounded-[20px] border border-ecrn-line bg-ecrn-paper py-5 pl-6 pr-5 sm:py-6 sm:pl-8 sm:pr-7"
              >
                <span aria-hidden className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-ecrn-action-bright via-ecrn-green to-cobalt" />
                <h2 id="short-answer-heading" className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.16em] text-ecrn-green-text">
                  <Zap className="h-3.5 w-3.5" aria-hidden />
                  The short answer
                </h2>
                <p className="mt-3 font-display text-[18.5px] font-medium leading-[1.5] tracking-[-0.012em] text-ecrn-ink sm:text-[21px] sm:leading-[1.48]">
                  {post.answer}
                </p>
              </section>

              {post.keyTakeaways.length > 0 && (
                <section id={TAKEAWAYS_ID} aria-labelledby="key-takeaways-heading" className="mt-8">
                  <h2 id="key-takeaways-heading" className="font-display text-[21px] font-semibold tracking-[-0.015em] text-ecrn-ink">
                    Key takeaways
                  </h2>
                  <ul role="list" className="mt-4 space-y-3">
                    {post.keyTakeaways.map((t) => (
                      <li key={t} className="flex gap-3 text-[16.5px] leading-[1.55] text-[#2B3A32]">
                        <span aria-hidden className="mt-[3px] grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ecrn-action-surface">
                          <Check className="h-3 w-3 text-ecrn-green-text" strokeWidth={3} />
                        </span>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {showToc && <TocDisclosure items={toc} className="mt-8 lg:hidden" />}

              <ContentBlocks blocks={post.body} className={BODY} />

              {post.faqs.length > 0 && (
                <section id={FAQ_ID} aria-labelledby="post-faq-heading" className="mt-14">
                  <h2 id="post-faq-heading" className="font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] text-ecrn-ink sm:text-[32px]">
                    {FAQ_HEADING}
                  </h2>
                  <div className="mt-6">
                    <FaqList faqs={post.faqs} />
                  </div>
                </section>
              )}

              {/* The FAQ list ends with its own rule, so the sources skip theirs when both are shown. */}
              <div id={SOURCES_ID}>
                <SourcesList sources={post.sources} className={post.faqs.length > 0 ? "border-t-0 pt-0" : undefined} />
              </div>

              <AboutEcrn author={post.author} className="mt-12" />
            </div>
          </div>

          {showToc && (
            <div className="hidden lg:block lg:pb-16 lg:pt-12">
              <TocRail items={toc} className="sticky top-24 max-h-[calc(100vh-7.5rem)] overflow-y-auto pr-1" />
            </div>
          )}
        </Container>
      </article>

      <section aria-label="Next step" className="py-12 sm:py-16">
        <Container>
          <div
            className="site-tone-dark relative isolate overflow-clip rounded-[28px] px-6 py-10 shadow-pass sm:rounded-[36px] sm:px-10 sm:py-14 lg:px-14 lg:py-16"
            style={{ background: "linear-gradient(120deg,#00244B,#063889 58%,#0655CE)" }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10"
              style={{ backgroundImage: "radial-gradient(40rem 24rem at 104% 108%, rgba(54,220,134,0.2), transparent 62%)" }}
            />
            <SectionHeading
              eyebrow="Next step"
              title="Take the next step with ECRN"
              intro={
                <p>
                  ECRN is free to join. One account lets you apply to open roles and refer people you know, and Delta Construction
                  Partners handles the recruiting.
                </p>
              }
            />
            <div className={CTA_ROW}>
              <CtaLink href={post.moneyPage.href}>
                {post.moneyPage.label} <ArrowRight className="h-4 w-4" aria-hidden />
              </CtaLink>
              <CtaLink href={secondary.href} variant="ghost">
                {secondary.label}
              </CtaLink>
            </div>
          </div>
        </Container>
      </section>

      {related.length > 0 && (
        <section aria-label="Related guides" className="pb-16 sm:pb-24">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-1">
              <SectionHeading title="Related guides" />
              <ArrowLink href={BLOG_PATH}>All guides</ArrowLink>
            </div>
            {related.length === 1 ? (
              <PostCard post={related[0]} featured className="mt-8" />
            ) : (
              <PostGrid posts={related} columns={related.length === 2 ? 2 : 3} className="mt-8" />
            )}
          </Container>
        </section>
      )}

      <FinalCta />
    </>
  );
}
