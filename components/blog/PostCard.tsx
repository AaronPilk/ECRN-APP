import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { formatDay } from "@/components/content/ContentBlocks";
import { SiteImage } from "@/components/site/SiteImage";
import { excerptOf } from "@/lib/blog/format";
import { postPath } from "@/lib/blog/routes";
import { BLOG_CATEGORIES, readingMinutes, type BlogPost } from "@/lib/blog/types";
import { cn } from "@/lib/utils/cn";

/**
 * Blog post card. Server-component safe and self-contained (Tailwind only),
 * so other pages can use it too. The whole card is one link (the title),
 * stretched over the card.
 *
 * States match the site's link cards (site-card + site-lift in site.css): it
 * lifts 3px and deepens its shadow on hover (mouse and trackpad only), presses
 * in on tap or click, and shows a ring on keyboard focus. Only transform and
 * opacity change, and nothing moves for reduced motion.
 *
 * `row`: on phones the card is a compact list row (thumbnail beside the title)
 * inside the list PostGrid draws; from 640 px it is the normal card.
 */
export interface PostCardProps {
  post: BlogPost;
  /** Large two-column layout for the lead story. */
  featured?: boolean;
  /** Phones: a list row instead of a card (PostGrid sets this). */
  row?: boolean;
  /** Load the cover eagerly. Use on the one above-the-fold image of a page. */
  priority?: boolean;
  /** Heading tag for the title, to fit the section the card sits in. Default 3. */
  headingLevel?: 2 | 3;
  /** `sizes` for the cover when the card sits in a grid other than the blog's. */
  sizes?: string;
  className?: string;
}

// Class strings are written out in full (no interpolation) so Tailwind's scanner sees every one.

/** A card on every screen. */
const SURFACE =
  "group relative isolate bg-white " +
  "shadow-[0_0_0_1px_rgba(15,22,18,0.07),0_1px_2px_rgba(15,22,18,0.04),0_10px_24px_-14px_rgba(15,22,18,0.12)] contrast-more:shadow-[0_0_0_1px_#0f1612] " +
  "transition-transform duration-[320ms] ease-[cubic-bezier(0.23,1,0.32,1)] active:duration-[140ms] motion-reduce:transition-none " +
  "motion-safe:active:scale-[0.985] " +
  "before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:opacity-0 " +
  "before:shadow-[0_2px_4px_rgba(15,22,18,0.05),0_24px_48px_-20px_rgba(15,22,18,0.28)] " +
  "before:transition-opacity before:duration-[320ms] before:ease-[cubic-bezier(0.23,1,0.32,1)] " +
  "[@media(hover:hover)_and_(pointer:fine)]:hover:before:opacity-100 " +
  "motion-safe:[@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-[3px]";

/** A list row on phones (the list draws the surface), the same card from 640 px. */
const ROW_SURFACE =
  "group relative isolate transition-colors duration-150 ease-out active:bg-[rgba(15,22,18,0.045)] motion-reduce:transition-none " +
  "sm:bg-white sm:shadow-[0_0_0_1px_rgba(15,22,18,0.07),0_1px_2px_rgba(15,22,18,0.04),0_10px_24px_-14px_rgba(15,22,18,0.12)] sm:contrast-more:shadow-[0_0_0_1px_#0f1612] sm:active:bg-white " +
  "sm:transition-transform sm:duration-[320ms] sm:ease-[cubic-bezier(0.23,1,0.32,1)] sm:active:duration-[140ms] " +
  "sm:motion-safe:active:scale-[0.985] " +
  "sm:before:pointer-events-none sm:before:absolute sm:before:inset-0 sm:before:-z-10 sm:before:rounded-[22px] sm:before:opacity-0 " +
  "sm:before:shadow-[0_2px_4px_rgba(15,22,18,0.05),0_24px_48px_-20px_rgba(15,22,18,0.28)] " +
  "sm:before:transition-opacity sm:before:duration-[320ms] sm:before:ease-[cubic-bezier(0.23,1,0.32,1)] " +
  "sm:[@media(hover:hover)_and_(pointer:fine)]:hover:before:opacity-100 " +
  "sm:motion-safe:[@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-[3px]";

const PHOTO_ZOOM =
  "transition-transform duration-[900ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none " +
  "motion-safe:[@media(hover:hover)_and_(pointer:fine)]:group-hover:scale-[1.035]";

/** The title link covers the card and carries the focus ring for it (the site's ring colour when it is set). */
const STRETCHED_LINK =
  "!outline-none after:absolute after:inset-0 after:z-10 " +
  "focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-[3px] focus-visible:after:outline-[color:var(--site-ring,#0655CE)]";

const ARROW_NUDGE =
  "transition-transform duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none " +
  "motion-safe:[@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-x-[3px]";

const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-11-20" → "Nov 20, 2026", for the narrow list rows on phones. */
function shortDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return y && m && d ? `${SHORT_MONTHS[m - 1]} ${d}, ${y}` : iso;
}

export function PostCard({ post, featured = false, row = false, priority = false, headingLevel = 3, sizes, className }: PostCardProps) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const category = BLOG_CATEGORIES[post.category].label;
  const href = postPath(post.slug);
  const meta = (
    <>
      <time dateTime={post.publishedAt} className="whitespace-nowrap">
        {row ? (
          <>
            <span className="sm:hidden">{shortDay(post.publishedAt)}</span>
            <span className="max-sm:hidden">{formatDay(post.publishedAt)}</span>
          </>
        ) : (
          formatDay(post.publishedAt)
        )}
      </time>
      <span aria-hidden>·</span>
      <span className="whitespace-nowrap">{readingMinutes(post)} min read</span>
    </>
  );

  if (featured) {
    return (
      <article className={cn(SURFACE, "grid rounded-[24px] before:rounded-[24px] sm:rounded-[28px] sm:before:rounded-[28px] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]", className)}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-[24px] sm:aspect-[16/9] sm:rounded-t-[28px] lg:aspect-auto lg:min-h-[420px] lg:rounded-l-[28px] lg:rounded-tr-none">
          <SiteImage
            name={post.cover}
            fill
            decorative
            priority={priority}
            sizes={sizes ?? "(min-width: 1200px) 610px, (min-width: 1024px) 52vw, (min-width: 640px) calc(100vw - 64px), calc(100vw - 40px)"}
            imgClassName={PHOTO_ZOOM}
          />
          {/* Floating label: frosted over the photo, solid when transparency or contrast is a problem. */}
          <p className="absolute left-4 top-4 inline-flex h-8 items-center rounded-full bg-ecrn-black/60 px-3.5 font-display text-[13px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] ring-1 ring-inset ring-white/20 backdrop-blur-md backdrop-saturate-150 contrast-more:bg-ecrn-black [@media(prefers-reduced-transparency:reduce)]:bg-ecrn-black [@media(prefers-reduced-transparency:reduce)]:backdrop-blur-none sm:left-5 sm:top-5">
            {category}
          </p>
        </div>
        <div className="flex flex-col justify-center p-5 sm:p-8 lg:p-10 xl:p-12">
          <Heading className="text-balance font-display text-[25px] font-semibold leading-[1.12] tracking-[-0.03em] text-ecrn-ink sm:text-[32px] lg:text-[36px] lg:leading-[1.06]">
            <Link href={href} className={cn(STRETCHED_LINK, "after:rounded-[24px] sm:after:rounded-[28px]")}>
              {post.title}
            </Link>
          </Heading>
          <p className="mt-3 line-clamp-4 text-pretty text-[16px] leading-[1.6] text-ecrn-secondary sm:mt-4 sm:text-[17px]">{excerptOf(post)}</p>
          <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px] text-ecrn-secondary sm:mt-5">{meta}</p>
          <p aria-hidden className="mt-5 inline-flex items-center gap-1.5 font-display text-[16px] font-semibold tracking-[-0.01em] text-ecrn-green-text sm:mt-6">
            Read the guide <ArrowRight className={cn("h-4 w-4", ARROW_NUDGE)} />
          </p>
        </div>
      </article>
    );
  }

  const cardSizes = "(min-width: 1200px) 365px, (min-width: 1024px) 31vw, (min-width: 640px) 46vw";

  if (row) {
    return (
      <article className={cn(ROW_SURFACE, "flex h-full items-start gap-3.5 px-4 py-4 sm:flex-col sm:items-stretch sm:gap-0 sm:rounded-[22px] sm:p-0", className)}>
        <div className="relative aspect-[4/3] w-[6.25rem] shrink-0 overflow-hidden rounded-[12px] bg-[#0E1512] sm:aspect-[16/10] sm:w-full sm:rounded-none sm:rounded-t-[22px]">
          <SiteImage name={post.cover} fill decorative priority={priority} sizes={sizes ?? `${cardSizes}, 100px`} imgClassName={PHOTO_ZOOM} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col self-stretch sm:p-6">
          <p className="text-[12.5px] font-medium leading-[1.3] text-ecrn-green-text sm:text-[13px]">{category}</p>
          <Heading className="mt-1 line-clamp-3 text-balance font-display text-[16.5px] font-semibold leading-[1.28] tracking-[-0.015em] text-ecrn-ink sm:mt-2 sm:text-[20px] sm:leading-[1.22] sm:tracking-[-0.02em]">
            <Link href={href} className={cn(STRETCHED_LINK, "after:rounded-none sm:after:rounded-[22px]")}>
              {post.title}
            </Link>
          </Heading>
          <p className="mt-2.5 line-clamp-3 text-pretty text-[15px] leading-[1.6] text-ecrn-secondary max-sm:hidden">{excerptOf(post)}</p>
          <p className="mt-auto flex items-center gap-2 pt-2 text-[13px] text-ecrn-secondary sm:pt-5">
            {meta}
            <ArrowUpRight aria-hidden className={cn("ml-auto hidden h-[18px] w-[18px] text-ecrn-green-text sm:block", ARROW_NUDGE)} />
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className={cn(SURFACE, "flex h-full flex-col rounded-[22px] before:rounded-[22px]", className)}>
      <SiteImage
        name={post.cover}
        ratio="16 / 10"
        decorative
        priority={priority}
        sizes={sizes ?? `${cardSizes}, calc(100vw - 40px)`}
        className="rounded-t-[22px]"
        imgClassName={PHOTO_ZOOM}
      />
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-[13px] font-medium leading-[1.3] text-ecrn-green-text">{category}</p>
        <Heading className="mt-2 line-clamp-3 text-balance font-display text-[20px] font-semibold leading-[1.22] tracking-[-0.02em] text-ecrn-ink">
          <Link href={href} className={cn(STRETCHED_LINK, "after:rounded-[22px]")}>
            {post.title}
          </Link>
        </Heading>
        <p className="mt-2.5 line-clamp-3 text-pretty text-[15px] leading-[1.6] text-ecrn-secondary">{excerptOf(post)}</p>
        <p className="mt-auto flex items-center gap-2 pt-5 text-[13px] text-ecrn-secondary">
          {meta}
          <ArrowUpRight aria-hidden className={cn("ml-auto h-[18px] w-[18px] text-ecrn-green-text", ARROW_NUDGE)} />
        </p>
      </div>
    </article>
  );
}

/**
 * Posts as a list on phones (one white panel, a row per post, hairlines
 * between) and a grid of cards from 640 px: two columns on tablets, three on
 * desktop (or two with `columns={2}`). Cards in a row share one height.
 */
export function PostGrid({
  posts,
  columns = 3,
  priorityFirst = false,
  headingLevel = 3,
  surface = "white",
  className,
}: {
  posts: BlogPost[];
  /** Columns on desktop. Use 2 when there are only two posts to show. Default 3. */
  columns?: 2 | 3;
  /** Load the first card's cover eagerly (when the grid is the first thing on the page). */
  priorityFirst?: boolean;
  headingLevel?: 2 | 3;
  /** Colour of the phone list panel: white on paper pages (default), paper on white sections. */
  surface?: "white" | "paper";
  className?: string;
}) {
  return (
    <ul
      role="list"
      className={cn(
        "grid overflow-clip rounded-[22px] divide-y divide-ecrn-line sm:divide-y-0 sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:rounded-none sm:bg-transparent sm:shadow-none lg:gap-6",
        surface === "white" ? "bg-white shadow-[0_0_0_1px_rgba(15,22,18,0.07),0_10px_24px_-16px_rgba(15,22,18,0.14)]" : "bg-ecrn-paper shadow-[inset_0_0_0_1px_rgba(15,22,18,0.07)]",
        columns === 3 && "lg:grid-cols-3",
        className
      )}
    >
      {posts.map((post, i) => (
        <li key={post.slug}>
          <PostCard
            post={post}
            row
            priority={priorityFirst && i === 0}
            headingLevel={headingLevel}
            sizes={columns === 2 ? "(min-width: 1200px) 560px, (min-width: 640px) 46vw, 100px" : undefined}
          />
        </li>
      ))}
    </ul>
  );
}
