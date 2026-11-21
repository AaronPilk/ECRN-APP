"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { markTourDoneAction } from "./actions";

/**
 * Guided product tour (a "walkthrough"): a spotlight moves across the real
 * screen, one feature at a time, with a short tip and Next / Skip.
 * Shown once after onboarding and replayable from Profile.
 */

interface Step {
  /** CSS selector for the element to highlight; omit for a centered card. */
  target?: string;
  title: string;
  body: string;
}

function steps(name: string | null): Step[] {
  return [
    {
      title: `Welcome to ECRN${name ? `, ${name}` : ""}`,
      body: "Here's how it works in 30 seconds. You can find your next role, refer people you know, or both.",
    },
    {
      target: '[data-tour="jobs"]',
      title: "Jobs picked for you",
      body: "Closest to you and matched to what you do. Open any job to apply in one tap, or refer someone for it.",
    },
    {
      target: '[data-tour="refer"]',
      title: "Refer from your contacts",
      body: "Pick people straight from your phone. We fill in their name, number, and title. Only the people you choose are sent.",
    },
    {
      target: '[data-tour="earnings"]',
      title: "Track what you earn",
      body: "Every referral shows up here. If Delta places someone you referred, you can earn up to $10,000.",
    },
    {
      target: '[data-tour="profile"], nav a[href="/profile"], aside a[href="/profile"]',
      title: "Your profile and resume",
      body: "Add your resume once. Recruiters see it, and every application after that is one tap.",
    },
    {
      target: 'nav a[href="/referrals"], aside a[href="/referrals"]',
      title: "Follow every referral",
      body: "See each person's stage, from first call to placement and payout.",
    },
    {
      title: "You're all set",
      body: "Start with whatever fits you today. You can replay this tour anytime from Profile.",
    },
  ];
}

function findVisible(selector: string): HTMLElement | null {
  const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
  return els.find((el) => el.offsetParent !== null && el.getBoundingClientRect().width > 0) ?? null;
}

export function ProductTour({ firstName }: { firstName: string | null }) {
  const all = useMemo(() => steps(firstName), [firstName]);
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Start after the page has painted.
  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 500);
    return () => clearTimeout(t);
  }, []);

  const step = all[i];

  const measure = useCallback(() => {
    if (!step?.target) return setRect(null);
    const el = findVisible(step.target);
    const next = el?.getBoundingClientRect() ?? null;
    setRect((previous) => {
      if (!next || !previous) return previous === next ? previous : next;
      return previous.top === next.top && previous.left === next.left && previous.width === next.width && previous.height === next.height
        ? previous
        : next;
    });
  }, [step?.target]);

  // Skip steps whose element isn't on screen; scroll the target into view.
  useLayoutEffect(() => {
    if (!open || !step) return;
    if (step.target) {
      const el = findVisible(step.target);
      if (!el) {
        setI((n) => Math.min(n + 1, all.length - 1));
        return;
      }
      // Move once per step. Repeating smooth scroll on every rect update made
      // the page and tooltip chase each other while the user tried to tap Next.
      const header = document.querySelector<HTMLElement>("[data-app-header]");
      const top = Math.max(header?.getBoundingClientRect().bottom ?? 0, 16) + 12;
      const bottom = cardRef.current?.getBoundingClientRect().top ?? window.innerHeight - 280;
      const target = el.getBoundingClientRect();
      const isTab = Boolean(el.closest("nav, aside"));
      if (!isTab && (target.top < top || target.bottom > bottom - 12)) {
        window.scrollBy({ top: target.top - top, behavior: "instant" });
      }
      measure();
      return;
    }
    setRect(null);
  }, [open, step, measure, all.length]);

  useEffect(() => {
    if (!open) return;
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = 0; measure(); });
    };
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    const target = step?.target ? findVisible(step.target) : null;
    if (target) observer.observe(target);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
    };
  }, [open, measure, step?.target]);

  function finish() {
    setOpen(false);
    void markTourDoneAction().catch(() => {});
    // Remove replay state without initiating a second navigation that can race
    // the final "Browse jobs" / "Refer contacts" link.
    const url = new URL(window.location.href);
    if (url.searchParams.has("tour")) {
      url.searchParams.delete("tour");
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }

  if (!open || !step) return null;

  const pad = 8;
  const spot = step.target && rect
    ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
    : null;
  const isLast = i === all.length - 1;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="App tour" onKeyDown={(event) => { if (event.key === "Escape") finish(); }}>
      {spot ? (
        <div
          className="absolute rounded-[18px] pointer-events-none"
          style={{ ...spot, boxShadow: "0 0 0 100vmax rgba(5, 12, 9, 0.62)", outline: "2px solid #36DC86" }}
        />
      ) : (
        <div className="absolute inset-0 bg-[rgba(5,12,9,0.62)]" />
      )}

      <div
        ref={cardRef}
        className="absolute inset-x-4 bottom-[calc(max(env(safe-area-inset-bottom),12px)+80px)] mx-auto max-w-sm max-h-[60dvh] overflow-y-auto rounded-[20px] bg-white p-5 shadow-pass"
      >
        <button type="button" onClick={finish} aria-label="Skip tour" className="absolute right-1 top-1 h-11 w-11 grid place-items-center text-ecrn-secondary">
          <X className="w-4 h-4" />
        </button>
        <p className="t-eyebrow">
          {i + 1} of {all.length}
        </p>
        <h2 className="mt-1 font-display text-[20px] font-semibold text-ecrn-ink pr-6">{step.title}</h2>
        <p className="mt-1.5 text-[14.5px] leading-[21px] text-ecrn-secondary">{step.body}</p>

        {isLast ? (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/referrals/import" onClick={finish}>
              <Button fullWidth size="sm">Refer contacts</Button>
            </Link>
            <Link href="/jobs" onClick={finish}>
              <Button fullWidth size="sm" variant="soft">Browse jobs</Button>
            </Link>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex gap-1.5" aria-hidden>
              {all.map((_, k) => (
                <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-5 bg-ecrn-green" : "w-1.5 bg-ecrn-line"}`} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {i === 0 ? (
                <button type="button" onClick={finish} className="text-[14px] font-medium text-ecrn-secondary px-2 py-2">
                  Skip
                </button>
              ) : (
                <button type="button" onClick={() => setI(i - 1)} className="text-[14px] font-medium text-ecrn-secondary px-2 py-2">
                  Back
                </button>
              )}
              <Button size="sm" onClick={() => setI(i + 1)}>
                {i === 0 ? "Show me" : "Next"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
