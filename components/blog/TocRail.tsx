"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { TocItem } from "./TableOfContents";

/** A section is "current" once its heading has passed the top 30% of the viewport. */
const READING_LINE = 0.3;
/** The rail is only shown from this width up, so nothing is measured on phones. */
const DESKTOP = "(min-width: 1024px)";

/**
 * Desktop table of contents: plain anchor links in a sticky rail, with the
 * section being read marked as current. It reads heading positions at most
 * once per frame while the page scrolls (passive listener) and never moves
 * the page itself: clicking a link is an ordinary anchor jump.
 */
export function TocRail({ items, className }: { items: TocItem[]; className?: string }) {
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    const targets = items.map((it) => document.getElementById(it.id)).filter((el): el is HTMLElement => el !== null);
    if (!targets.length) return;

    const desktop = window.matchMedia(DESKTOP);
    let frame = 0;

    const update = () => {
      frame = 0;
      const line = window.innerHeight * READING_LINE;
      let id: string | null = null;
      for (const el of targets) {
        if (el.getBoundingClientRect().top > line) break;
        id = el.id;
      }
      setCurrent(id);
    };
    const schedule = () => {
      if (!frame && desktop.matches) frame = requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [items]);

  if (items.length < 2) return null;

  return (
    <nav aria-label="On this page" className={className}>
      <p className="font-mono text-[11.5px] uppercase tracking-[0.16em] text-ecrn-secondary">On this page</p>
      <ol className="mt-3 border-l border-ecrn-line">
        {items.map((it) => {
          const active = it.id === current;
          return (
            <li key={it.id}>
              <a
                href={`#${it.id}`}
                aria-current={active ? "location" : undefined}
                className={cn(
                  "-ml-px flex min-h-[44px] items-center border-l-2 py-1.5 pl-4 pr-1 text-[14.5px] leading-snug",
                  "[@media(hover:hover)_and_(pointer:fine)]:hover:text-ecrn-ink",
                  active ? "border-ecrn-green text-ecrn-ink" : "border-transparent text-ecrn-secondary"
                )}
              >
                {it.text}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
