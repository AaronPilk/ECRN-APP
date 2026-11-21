"use client";

import { createElement, useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { reducedMotion, watchEntry } from "./scroll";

/** Fired on a Reveal's element with detail "pending" | "in" (CountUp listens for it). */
export const REVEAL_EVENT = "site:reveal";

type RevealTag = "div" | "section" | "article" | "ul" | "ol" | "li" | "p" | "span" | "header" | "footer" | "figure";

/**
 * Fades and lifts its children into place the first time they scroll into
 * view. Content is visible by default: only elements still below the viewport
 * once JavaScript is running are hidden, so nothing flashes and nothing is
 * lost without JavaScript or with reduced motion.
 *
 *   <Reveal>…</Reveal>
 *   <Reveal as="li" index={2}>…</Reveal>            stagger: 70 ms per index
 *   <Reveal group as="ul">                           one trigger for a whole grid:
 *     <li className="site-reveal-item" style={siteVars({ i: 0 })}>…</li>
 *   </Reveal>
 */
export function Reveal({
  children,
  as = "div",
  index = 0,
  y,
  group = false,
  className,
  style,
  id,
}: {
  children: ReactNode;
  as?: RevealTag;
  /** Position in a staggered set (0, 1, 2…). */
  index?: number;
  /** Lift distance in px (default 18). */
  y?: number;
  /** Do not animate the wrapper; animate descendants marked `site-reveal-item` instead. */
  group?: boolean;
  className?: string;
  style?: CSSProperties;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    const stop = watchEntry(el, (state) => {
      el.dataset.reveal = state;
      el.dispatchEvent(new CustomEvent(REVEAL_EVENT, { detail: state }));
    });
    return () => {
      stop();
      delete el.dataset.reveal;
    };
  }, []);

  const vars: Record<string, string | number> = { "--site-i": index };
  if (y != null) vars["--site-y"] = `${y}px`;

  return createElement(
    as,
    {
      ref,
      id,
      className: cn(group ? "site-reveal-group" : "site-reveal", className),
      style: { ...style, ...(vars as CSSProperties) },
    },
    children
  );
}
