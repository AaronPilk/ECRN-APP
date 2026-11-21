/**
 * One scroll controller for the whole public site.
 *
 * Scroll-linked motion is CSS first (animation-timeline in app/(site)/site.css).
 * This file is the fallback for browsers without scroll timelines, plus the
 * shared observers the motion components use. It keeps the cost flat:
 *   - one passive scroll listener and one resize listener for the page,
 *   - one requestAnimationFrame per frame, only while something is on screen,
 *   - every subscriber reads first (measure), then every subscriber writes
 *     (transform), so nothing forces layout twice in a frame.
 */

export interface ScrollSubscriber {
  /** Read phase: getBoundingClientRect and friends. No style writes. */
  read(viewportHeight: number, scrollY: number): void;
  /** Write phase: set transform or opacity on your own elements. No reads. */
  write(): void;
}

interface Entry {
  sub: ScrollSubscriber;
  active: boolean;
}

const entries = new Map<Element, Entry>();
let observer: IntersectionObserver | null = null;
let frame = 0;

function tick() {
  frame = 0;
  const vh = window.innerHeight;
  const y = window.scrollY;
  const live: ScrollSubscriber[] = [];
  entries.forEach((e) => {
    if (e.active) live.push(e.sub);
  });
  for (const s of live) s.read(vh, y);
  for (const s of live) s.write();
}

function requestTick() {
  if (!frame) frame = requestAnimationFrame(tick);
}

function start() {
  if (observer) return;
  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick, { passive: true });
  observer = new IntersectionObserver(
    (list) => {
      for (const item of list) {
        const e = entries.get(item.target);
        if (e) e.active = item.isIntersecting;
      }
      requestTick();
    },
    { rootMargin: "30% 0px 30% 0px" }
  );
}

function stop() {
  window.removeEventListener("scroll", requestTick);
  window.removeEventListener("resize", requestTick);
  observer?.disconnect();
  observer = null;
  if (frame) cancelAnimationFrame(frame);
  frame = 0;
}

/**
 * Run `sub` once per frame while `el` is on screen (or near it).
 * Pass `always` for things that must follow the page itself, like the header.
 * Returns the unsubscribe function.
 */
export function subscribeScroll(el: Element, sub: ScrollSubscriber, always = false): () => void {
  start();
  entries.set(el, { sub, active: always });
  if (!always) observer!.observe(el);
  requestTick();
  return () => {
    entries.delete(el);
    observer?.unobserve(el);
    if (entries.size === 0) stop();
  };
}

/**
 * True when the browser runs scroll-driven animations itself (the CSS path).
 * Debug switch: set `window.__SITE_FORCE_JS_SCROLL__ = true` before the page
 * hydrates to exercise the requestAnimationFrame path in any browser.
 */
export function cssScrollDriven(): boolean {
  if (typeof window === "undefined") return false;
  if ((window as unknown as { __SITE_FORCE_JS_SCROLL__?: boolean }).__SITE_FORCE_JS_SCROLL__) {
    document.documentElement.dataset.siteScroll = "js";
    return false;
  }
  return typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("animation-timeline: view()");
}

export function reducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function finePointer(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/* ── Entry observer: "has this come into view yet?" (Reveal, CountUp) ──── */

export type EntryState = "pending" | "in";

const entryCallbacks = new Map<Element, (state: EntryState) => void>();
const entrySeen = new WeakSet<Element>();
let entryObserver: IntersectionObserver | null = null;

/**
 * Tells `cb` "pending" if `el` is still below the viewport when first checked,
 * then "in" once it scrolls into view. Elements already on screen (or above
 * it) get no callback at all: the visitor has seen them, so nothing is hidden
 * and nothing replays. The observer reports asynchronously, without forcing
 * layout.
 */
export function watchEntry(el: Element, cb: (state: EntryState) => void): () => void {
  if (!entryObserver) {
    entryObserver = new IntersectionObserver(
      (list) => {
        for (const item of list) {
          const target = item.target;
          const fn = entryCallbacks.get(target);
          if (!fn) continue;
          if (!entrySeen.has(target)) {
            entrySeen.add(target);
            const vh = item.rootBounds?.height ?? window.innerHeight;
            if (item.isIntersecting || item.boundingClientRect.top < vh) {
              entryCallbacks.delete(target);
              entryObserver?.unobserve(target);
            } else {
              fn("pending");
            }
          } else if (item.isIntersecting) {
            entryCallbacks.delete(target);
            entryObserver?.unobserve(target);
            fn("in");
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
  }
  entryCallbacks.set(el, cb);
  entryObserver.observe(el);
  return () => {
    entryCallbacks.delete(el);
    entrySeen.delete(el);
    entryObserver?.unobserve(el);
  };
}

/* ── Visibility observer: pause idle animation off screen (Float, Marquee) ─ */

const visibilityCallbacks = new Map<Element, (visible: boolean) => void>();
let visibilityObserver: IntersectionObserver | null = null;

export function watchVisibility(el: Element, cb: (visible: boolean) => void): () => void {
  if (!visibilityObserver) {
    visibilityObserver = new IntersectionObserver(
      (list) => {
        for (const item of list) visibilityCallbacks.get(item.target)?.(item.isIntersecting);
      },
      { rootMargin: "10% 0px 10% 0px" }
    );
  }
  visibilityCallbacks.set(el, cb);
  visibilityObserver.observe(el);
  return () => {
    visibilityCallbacks.delete(el);
    visibilityObserver?.unobserve(el);
  };
}
