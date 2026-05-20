"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Smartphone, X } from "lucide-react";

const DISMISS_KEY = "ecrn_a2hs_dismissed";

/**
 * "Add to Home Screen" guide. Renders as a dismissible banner on the
 * dashboards. We don't try to detect iOS/Android perfectly — we just
 * show both sets of instructions and let the user follow whichever
 * matches their phone.
 *
 * Once dismissed, we set a localStorage flag so it doesn't come back
 * unless the user clears storage or re-opens via /help.
 */
export function AddToHomeScreenGuide({ persistent = false }: { persistent?: boolean }) {
  const [open, setOpen] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    // Already installed → don't show
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS Safari
      window.navigator.standalone === true;
    setStandalone(isStandalone);

    if (!isStandalone && (persistent || !localStorage.getItem(DISMISS_KEY))) {
      setOpen(true);
    }
  }, [persistent]);

  if (standalone || !open) return null;

  const dismiss = () => {
    if (!persistent) localStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  };

  return (
    <Card className="p-5 relative border-amber-200/60 bg-amber-50/40">
      {!persistent && (
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-delta-ink hover:bg-white/60"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 shrink-0 rounded-2xl bg-delta-navy text-white grid place-items-center">
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-delta-ink">
            Add ECRN to your home screen
          </h3>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed">
            Get app-like access with one tap. Works offline for browsing.
          </p>

          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            <Instructions
              title="iPhone (Safari)"
              steps={[
                "Tap the Share icon",
                "Scroll down and tap “Add to Home Screen”",
                "Tap Add",
              ]}
            />
            <Instructions
              title="Android (Chrome)"
              steps={[
                "Tap the ⋮ menu",
                "Tap “Add to Home screen”",
                "Confirm Install",
              ]}
            />
          </div>

          {!persistent && (
            <div className="mt-4">
              <Button size="sm" variant="ghost" onClick={dismiss}>
                Maybe later
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function Instructions({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div className="rounded-xl border border-amber-200/60 bg-white p-3.5">
      <div className="text-xs font-semibold tracking-wide uppercase text-amber-900">{title}</div>
      <ol className="mt-2 space-y-1.5 text-sm text-slate-700">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-amber-700 font-semibold tabular-nums">{i + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
