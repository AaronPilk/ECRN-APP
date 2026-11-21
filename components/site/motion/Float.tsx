"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { finePointer, reducedMotion, watchVisibility } from "./scroll";
import { siteVars } from "./vars";

/**
 * Gentle idle drift for a floating card: a slow vertical bob, transform only,
 * paused while off screen and absent under reduced motion. Give neighbours
 * different `duration` and `delay` values so they never move in step.
 *
 *   <Float amplitude={6} duration={9} delay={-3}>…</Float>
 */
export function Float({
  children,
  amplitude = 6,
  duration = 8,
  delay = 0,
  className,
}: {
  children: ReactNode;
  /** Pixels either side of rest. */
  amplitude?: number;
  /** Seconds for one direction of travel. */
  duration?: number;
  /** Seconds. Negative starts part-way through the cycle. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion()) return;
    return watchVisibility(el, (visible) => el.toggleAttribute("data-offscreen", !visible));
  }, []);

  return (
    <div ref={ref} className={cn("site-float", className)} style={siteVars({ amp: `${amplitude}px`, dur: `${duration}s`, delay: `${delay}s` })}>
      {children}
    </div>
  );
}

/**
 * Pointer-tracking parallax for a group of floating things. Every
 * <TiltLayer depth> inside shifts with the pointer, deeper layers further, on
 * a critically damped follow (no overshoot). Fine pointers only: touch
 * devices and reduced-motion visitors get a plain wrapper and no listeners.
 *
 *   <Tilt max={8}>
 *     <TiltLayer depth={1.4}>…near…</TiltLayer>
 *     <TiltLayer depth={0.5}>…far…</TiltLayer>
 *   </Tilt>
 */
export function Tilt({
  children,
  max = 8,
  className,
}: {
  children: ReactNode;
  /** Pixels a depth-1 layer travels when the pointer is at the edge of the window. */
  max?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || reducedMotion() || !finePointer()) return;
    const layers = Array.from(root.querySelectorAll<HTMLElement>("[data-tilt-depth]")).map((el) => ({
      el,
      depth: Number(el.dataset.tiltDepth) || 1,
    }));
    if (layers.length === 0) return;

    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let frame = 0;
    let last = 0;
    let visible = false;

    const step = (now: number) => {
      const dt = Math.min(64, Math.max(1, now - last));
      last = now;
      // Exponential follow with a 140 ms time constant: frame-rate independent.
      const k = 1 - Math.exp(-dt / 140);
      x += (targetX - x) * k;
      y += (targetY - y) * k;
      for (const layer of layers) {
        layer.el.style.transform = `translate3d(${(x * layer.depth * max).toFixed(2)}px, ${(y * layer.depth * max).toFixed(2)}px, 0)`;
      }
      frame = Math.abs(targetX - x) > 0.002 || Math.abs(targetY - y) > 0.002 ? requestAnimationFrame(step) : 0;
    };
    const kick = () => {
      if (frame) return;
      last = performance.now();
      frame = requestAnimationFrame(step);
    };
    const onMove = (e: PointerEvent) => {
      if (!visible || e.pointerType === "touch") return;
      targetX = (e.clientX / window.innerWidth) * 2 - 1;
      targetY = (e.clientY / window.innerHeight) * 2 - 1;
      kick();
    };
    const settle = () => {
      targetX = 0;
      targetY = 0;
      kick();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", settle);
    const stopWatching = watchVisibility(root, (v) => {
      visible = v;
      if (!v) settle();
    });

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", settle);
      stopWatching();
      if (frame) cancelAnimationFrame(frame);
      for (const layer of layers) layer.el.style.transform = "";
    };
  }, [max]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** One depth plane inside a <Tilt>. Higher `depth` = closer = moves further. */
export function TiltLayer({ children, depth = 1, className }: { children: ReactNode; depth?: number; className?: string }) {
  return (
    <div data-tilt-depth={depth} className={className}>
      {children}
    </div>
  );
}
