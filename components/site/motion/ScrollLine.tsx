"use client";

import { createElement, useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { clamp01, cssScrollDriven, reducedMotion, subscribeScroll } from "./scroll";

/** Where on the viewport the current's leading edge sits (matches 58vh in site.css). */
const READING_LINE = 0.58;

/**
 * The conduit: a run of electrical conduit down the left edge of a list of
 * steps. As the reader scrolls, a glowing current travels down it, 1:1 with
 * the scroll, and each junction box lights up as the current reaches it.
 *
 *   <ScrollLine>
 *     <ScrollLineStep marker="01">…heading and text…</ScrollLineStep>
 *     <ScrollLineStep marker="02">…</ScrollLineStep>
 *   </ScrollLine>
 *
 * Place it on a dark surface (`site-tone-dark`). The finished, fully lit
 * state is the default, so it is complete without JavaScript and with reduced
 * motion. Where scroll-driven animations exist the current is pure CSS;
 * elsewhere this component drives it from the shared requestAnimationFrame
 * loop, only while on screen.
 */
export function ScrollLine({
  children,
  as = "ol",
  lead = true,
  className,
}: {
  children: ReactNode;
  as?: "ol" | "ul";
  /** Draw a short run of conduit coming in above the first step. */
  lead?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || reducedMotion() || cssScrollDriven()) return;

    const segments = Array.from(root.querySelectorAll<HTMLElement>(".site-conduit-seg, .site-conduit-lead")).map((el) => ({
      el,
      fill: el.querySelector<HTMLElement>(".site-conduit-fill"),
      head: el.querySelector<HTMLElement>(".site-conduit-head"),
      progress: -1,
      next: 0,
      height: 0,
    }));
    const steps = Array.from(root.querySelectorAll<HTMLElement>(".site-step")).map((el) => ({
      el,
      marker: el.querySelector<HTMLElement>(".site-step-marker"),
      lit: false,
      next: false,
    }));

    root.dataset.live = "js";
    const stop = subscribeScroll(root, {
      read(vh) {
        const line = vh * READING_LINE;
        for (const s of segments) {
          const rect = s.el.getBoundingClientRect();
          s.height = rect.height;
          s.next = rect.height > 0 ? clamp01((line - rect.top) / rect.height) : 0;
        }
        for (const st of steps) {
          const rect = (st.marker ?? st.el).getBoundingClientRect();
          st.next = line >= rect.top + rect.height / 2;
        }
      },
      write() {
        for (const s of segments) {
          if (s.next === s.progress) continue;
          s.progress = s.next;
          if (s.fill) s.fill.style.transform = `scaleY(${s.progress.toFixed(4)})`;
          if (s.head) {
            s.head.style.transform = `translate3d(0, ${(s.progress * s.height).toFixed(1)}px, 0)`;
            s.head.style.opacity = s.progress > 0.02 && s.progress < 0.98 ? "1" : "0";
          }
        }
        for (const st of steps) {
          if (st.next === st.lit) continue;
          st.lit = st.next;
          st.el.toggleAttribute("data-lit", st.lit);
        }
      },
    });

    return () => {
      stop();
      delete root.dataset.live;
      for (const s of segments) {
        if (s.fill) s.fill.style.transform = "";
        if (s.head) {
          s.head.style.transform = "";
          s.head.style.opacity = "";
        }
      }
      for (const st of steps) st.el.removeAttribute("data-lit");
    };
  }, []);

  return createElement(
    as,
    { ref, className: cn("site-conduit", className), style: lead ? undefined : { paddingTop: 0 } },
    lead ? (
      <li aria-hidden="true" role="presentation" className="site-conduit-lead">
        <Run />
      </li>
    ) : null,
    children
  );
}

/** One step: a junction box on the conduit, then whatever you put inside. */
export function ScrollLineStep({ marker, children, className }: { marker: ReactNode; children: ReactNode; className?: string }) {
  return (
    <li className={cn("site-step", className)}>
      <span className="site-conduit-seg" aria-hidden="true">
        <Run />
      </span>
      <span className="site-step-marker" aria-hidden="true">
        <span className="site-step-off">{marker}</span>
        <span className="site-step-on">{marker}</span>
      </span>
      <div className="site-step-body">{children}</div>
    </li>
  );
}

/** Tube, current, and the spark at the head of the current. */
function Run() {
  return (
    <>
      <span className="site-conduit-track" />
      <span className="site-conduit-fill" />
      <span className="site-conduit-head" />
    </>
  );
}
