"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { reducedMotion, watchVisibility } from "./scroll";
import { siteVars } from "./vars";

/**
 * Constant, linear ticker. Pauses on hover (mouse), on keyboard focus inside
 * it, and while it is off screen. With reduced motion it is a static, wrapped,
 * centred list. The second copy that makes the loop seamless is hidden from
 * assistive technology.
 *
 *   <Marquee label="Roles" items={roles.map((r) => <span key={r}>{r}</span>)} />
 */
export function Marquee({
  items,
  duration = 44,
  label,
  className,
  itemClassName,
}: {
  items: ReactNode[];
  /** Seconds for one full loop. Longer = slower. */
  duration?: number;
  /** Accessible name for the list. */
  label?: string;
  className?: string;
  /** Classes for each <li> (use padding for the gap so the loop stays seamless). */
  itemClassName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    return watchVisibility(el, (visible) => el.toggleAttribute("data-offscreen", !visible));
  }, []);

  const group = (copy: boolean) => (
    <ul className="site-marquee-group" aria-hidden={copy || undefined} aria-label={copy ? undefined : label}>
      {items.map((item, i) => (
        <li key={i} className={itemClassName}>
          {item}
        </li>
      ))}
    </ul>
  );

  return (
    <div ref={ref} className={cn("site-marquee", className)}>
      <div className="site-marquee-track" style={siteVars({ dur: `${duration}s` })}>
        {group(false)}
        {group(true)}
      </div>
    </div>
  );
}
