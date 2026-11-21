"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * The list behind the blog topic chips. On phones it is one row that scrolls
 * inside itself (the page never scrolls sideways); this only makes sure the
 * current topic starts in view, centred when it can be. It sets the scroll
 * position once, before the first paint, and never animates or moves the page.
 */
export function ChipScroller({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLUListElement>(null);

  useLayoutEffect(() => {
    const list = ref.current;
    if (!list || list.scrollWidth <= list.clientWidth) return;
    const current = list.querySelector<HTMLElement>('[aria-current="page"]')?.closest("li");
    if (!current) return;
    list.scrollLeft = Math.max(0, current.offsetLeft - (list.clientWidth - current.offsetWidth) / 2);
  }, []);

  return (
    <ul ref={ref} role="list" className={className}>
      {children}
    </ul>
  );
}
