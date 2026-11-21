import { ChevronDown, List } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface TocItem {
  /** Id of the heading or section on the page. */
  id: string;
  text: string;
}

/**
 * Table of contents for phones and tablets: a native disclosure in the flow
 * of the page (it pushes the article down when open and never floats over
 * it), closed by default, with plain anchor links. No script. The desktop
 * version is TocRail.
 */
export function TocDisclosure({ items, className }: { items: TocItem[]; className?: string }) {
  if (items.length < 2) return null;
  return (
    <nav aria-label="On this page" className={className}>
      <details className="group rounded-[16px] border border-ecrn-line bg-ecrn-paper">
        <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 rounded-[16px] px-4 [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2.5 font-display text-[16px] font-semibold text-ecrn-ink">
            <List className="h-[18px] w-[18px] text-ecrn-green-text" aria-hidden />
            On this page
          </span>
          <span className="flex items-center gap-2 text-[13.5px] tabular-nums text-ecrn-secondary">
            {items.length} sections
            <ChevronDown
              className={cn("h-5 w-5 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-open:rotate-180 motion-reduce:transition-none")}
              aria-hidden
            />
          </span>
        </summary>
        <ol role="list" className="border-t border-ecrn-line px-2 py-1.5">
          {items.map((it, i) => (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                className="grid min-h-[44px] grid-cols-[1.25rem_minmax(0,1fr)] items-baseline gap-x-2.5 rounded-[10px] px-2 py-2.5 text-[15.5px] leading-snug text-ecrn-ink transition-colors duration-150 active:bg-white"
              >
                <span aria-hidden className="text-right text-[13px] tabular-nums text-ecrn-secondary">
                  {i + 1}
                </span>
                <span>{it.text}</span>
              </a>
            </li>
          ))}
        </ol>
      </details>
    </nav>
  );
}
