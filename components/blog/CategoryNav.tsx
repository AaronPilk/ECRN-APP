import Link from "next/link";
import { BLOG_PATH, categoryPath } from "@/lib/blog/routes";
import { BLOG_CATEGORIES, type BlogCategory } from "@/lib/blog/types";
import { cn } from "@/lib/utils/cn";
import { ChipScroller } from "./ChipScroller";

const CHIP =
  "inline-flex h-11 shrink-0 snap-start items-center whitespace-nowrap rounded-full border px-4 font-display text-[14.5px] font-medium tracking-[-0.005em] " +
  "transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] motion-reduce:transition-none";
const IDLE = "border-ecrn-line bg-white text-ecrn-ink [@media(hover:hover)_and_(pointer:fine)]:hover:border-ecrn-green-text";
const CURRENT = "border-ecrn-black bg-ecrn-black text-white";

/**
 * Phones: one row of chips that scrolls inside its own strip, edge to edge
 * (the first chip starts on the page gutter), snapping chip by chip. Both
 * edges fade softly: the right one says there is more, the left one keeps a
 * scrolled-away chip from ending in a hard sliver (at rest the first chip sits
 * clear of it, on the gutter). From 640 px the chips simply wrap.
 */
const STRIP =
  "relative -mx-5 flex snap-x snap-proximity scroll-px-5 gap-2 overflow-x-auto overscroll-x-contain px-5 py-0.5 " +
  "[-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden " +
  "[mask-image:linear-gradient(90deg,transparent,#000_1.25rem,#000_calc(100%-2.5rem),transparent)] " +
  "sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:[mask-image:none]";

/**
 * Topic links for the blog index and category pages. Pass only the categories
 * that have posts (categoriesWithPosts), so no chip leads to an empty page.
 */
export function CategoryNav({ categories, current, className }: { categories: BlogCategory[]; current?: BlogCategory; className?: string }) {
  if (!categories.length) return null;
  return (
    <nav aria-label="Blog topics" className={className}>
      <ChipScroller className={STRIP}>
        <li className="flex">
          <Link href={BLOG_PATH} aria-current={current ? undefined : "page"} className={cn(CHIP, current ? IDLE : CURRENT)}>
            All guides
          </Link>
        </li>
        {categories.map((c) => (
          <li key={c} className="flex">
            <Link href={categoryPath(c)} aria-current={c === current ? "page" : undefined} className={cn(CHIP, c === current ? CURRENT : IDLE)}>
              {BLOG_CATEGORIES[c].label}
            </Link>
          </li>
        ))}
        {/* Room after the last chip, so it can scroll clear of the fade. */}
        <li aria-hidden className="w-6 shrink-0 sm:hidden" />
      </ChipScroller>
    </nav>
  );
}
