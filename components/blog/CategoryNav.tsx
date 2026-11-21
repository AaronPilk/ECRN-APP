import Link from "next/link";
import { BLOG_PATH, categoryPath } from "@/lib/blog/routes";
import { BLOG_CATEGORIES, type BlogCategory } from "@/lib/blog/types";
import { cn } from "@/lib/utils/cn";

const CHIP =
  "inline-flex h-11 items-center rounded-full border px-4 text-[14.5px] font-medium " +
  "transition-transform duration-150 ease-out active:scale-[0.97] motion-reduce:transition-none";
const IDLE = "border-ecrn-line bg-white text-ecrn-ink [@media(hover:hover)_and_(pointer:fine)]:hover:border-ecrn-green-text";
const CURRENT = "border-ecrn-black bg-ecrn-black text-white";

/**
 * Topic links for the blog index and category pages. Pass only the categories
 * that have posts (categoriesWithPosts), so no chip leads to an empty page.
 */
export function CategoryNav({ categories, current, className }: { categories: BlogCategory[]; current?: BlogCategory; className?: string }) {
  if (!categories.length) return null;
  return (
    <nav aria-label="Blog topics" className={className}>
      <ul role="list" className="flex flex-wrap gap-2">
        <li>
          <Link href={BLOG_PATH} aria-current={current ? undefined : "page"} className={cn(CHIP, current ? IDLE : CURRENT)}>
            All guides
          </Link>
        </li>
        {categories.map((c) => (
          <li key={c}>
            <Link href={categoryPath(c)} aria-current={c === current ? "page" : undefined} className={cn(CHIP, c === current ? CURRENT : IDLE)}>
              {BLOG_CATEGORIES[c].label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
