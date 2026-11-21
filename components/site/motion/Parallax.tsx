"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { clamp01, cssScrollDriven, reducedMotion, subscribeScroll } from "./scroll";
import { siteVars } from "./vars";

/**
 * Moves its child with the scroll, 1:1, at a given depth.
 *
 * `speed` is the share of the scroll distance the element lags behind:
 * positive = slower than the page (reads as further away), negative = faster
 * (closer). Keep it small: 0.04 to 0.3.
 *
 * Three modes:
 *   <Parallax speed={-0.08}>…</Parallax>
 *       Free element. Sits exactly where it was laid out when it is centred
 *       in the viewport and drifts either side of that.
 *   <Parallax from="top" speed={0.22}>…</Parallax>
 *       For the top of the page (hero backgrounds): at rest at scroll 0.
 *   <Parallax cover>…</Parallax>
 *       "Window" mode for photos: fills its positioned, clipped parent, 20 %
 *       taller than it, and drifts inside the frame. Put a <SiteImage fill />
 *       inside. The parent must clip with overflow-clip (not overflow-hidden).
 *
 * Where the browser has scroll-driven animations this is pure CSS on the
 * compositor (site.css) and works before hydration. Elsewhere it writes
 * `transform` inside the shared requestAnimationFrame loop, only while on
 * screen. With reduced motion it does nothing.
 */
export function Parallax({
  children,
  speed = 0.1,
  from,
  cover = false,
  className,
}: {
  children: ReactNode;
  speed?: number;
  from?: "top";
  cover?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion() || cssScrollDriven()) return;
    const anchor = cover ? el.parentElement : el;
    if (!anchor) return;

    let applied = 0;
    let next = 0;
    el.style.willChange = "transform";
    const stop = subscribeScroll(anchor, {
      read(vh, scrollY) {
        if (from === "top") {
          next = Math.min(scrollY, 1600) * speed;
          return;
        }
        const rect = anchor.getBoundingClientRect();
        if (cover) {
          const progress = clamp01((vh - rect.top) / (vh + rect.height));
          next = (progress - 0.5) * 0.2 * rect.height;
          return;
        }
        // The rect includes the transform we wrote last frame: undo it.
        const top = rect.top - applied;
        const progress = clamp01((vh - top) / (vh + rect.height));
        next = (progress - 0.5) * (vh + rect.height) * speed;
      },
      write() {
        if (Math.abs(next - applied) < 0.05) return;
        applied = next;
        el.style.transform = `translate3d(0, ${applied.toFixed(2)}px, 0)`;
      },
    });

    return () => {
      stop();
      el.style.transform = "";
      el.style.willChange = "";
    };
  }, [speed, from, cover]);

  return (
    <div
      ref={ref}
      data-from={from}
      className={cn(cover ? "site-plx-cover" : "site-plx", className)}
      style={cover ? undefined : siteVars({ speed })}
    >
      {children}
    </div>
  );
}
