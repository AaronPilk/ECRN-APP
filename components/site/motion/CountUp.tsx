"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";
import { REVEAL_EVENT } from "./Reveal";
import { reducedMotion, watchEntry, type EntryState } from "./scroll";

const format = (n: number) => n.toLocaleString("en-US");

/**
 * Counts up to `value` once, when it scrolls into view. The final figure is
 * what the server renders (crawlers and no-JS readers see the real number) and
 * it keeps its space throughout, so nothing around it moves.
 *
 * Inside a <Reveal> it starts together with that reveal; on its own it watches
 * itself. A number that is already on screen when the page loads is left
 * alone.
 *
 *   <CountUp value={10000} prefix="$" />     →  $10,000
 */
export function CountUp({
  value,
  prefix = "",
  suffix = "",
  from = 0,
  duration = 1400,
  delay = 0,
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  /** Starting figure (default 0). */
  from?: number;
  /** Milliseconds. */
  duration?: number;
  /** Milliseconds to wait after it comes into view (use for a stagger). */
  delay?: number;
  className?: string;
}) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const liveRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const live = liveRef.current;
    if (!root || !live || reducedMotion()) return;

    let frame = 0;
    let timer = 0;
    const show = (n: number) => {
      live.textContent = `${prefix}${format(n)}${suffix}`;
    };
    const arm = () => {
      show(from);
      root.dataset.counting = "";
    };
    const run = () => {
      if (root.dataset.counting === undefined) arm();
      timer = window.setTimeout(() => {
        const t0 = performance.now();
        const step = (now: number) => {
          const t = Math.min(1, (now - t0) / duration);
          const eased = 1 - Math.pow(1 - t, 4);
          show(Math.round(from + (value - from) * eased));
          if (t < 1) frame = requestAnimationFrame(step);
          else delete root.dataset.counting;
        };
        frame = requestAnimationFrame(step);
      }, delay);
    };
    const onState = (state: EntryState) => (state === "pending" ? arm() : run());

    const host = root.closest(".site-reveal, .site-reveal-group");
    let stop: () => void;
    if (host) {
      const handler = (e: Event) => onState((e as CustomEvent<EntryState>).detail);
      host.addEventListener(REVEAL_EVENT, handler);
      stop = () => host.removeEventListener(REVEAL_EVENT, handler);
    } else {
      stop = watchEntry(root, onState);
    }

    return () => {
      stop();
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      delete root.dataset.counting;
    };
  }, [value, prefix, suffix, from, duration, delay]);

  return (
    <span ref={rootRef} className={cn("site-countup", className)}>
      <span className="site-countup-final">
        {prefix}
        {format(value)}
        {suffix}
      </span>
      <span ref={liveRef} className="site-countup-live" aria-hidden="true" />
    </span>
  );
}
