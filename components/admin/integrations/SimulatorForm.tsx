"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { simulateEventAction } from "@/app/(app)/admin/sync/actions";
import type { SimulateResult } from "@/lib/integrations/samples";

export interface SimulatorSample {
  key: string;
  type: string;
  label: string;
  description: string;
  json: string;
}

const STATUS_STYLE: Record<string, string> = {
  applied: "bg-ecrn-selected text-ecrn-green-text",
  ignored: "bg-slate-100 text-slate-700",
  duplicate: "bg-slate-100 text-slate-700",
  failed: "bg-red-50 text-red-700",
  error: "bg-red-50 text-red-700",
};

/**
 * Pick a sample Bullhorn event, edit the JSON if you like, and apply it. The
 * server runs it through the same handlers as a live webhook event.
 */
export function SimulatorForm({ samples }: { samples: SimulatorSample[] }) {
  const [key, setKey] = useState(samples[0]?.key ?? "");
  const [text, setText] = useState(samples[0]?.json ?? "");
  const [result, setResult] = useState<SimulateResult | null>(null);
  const [pending, start] = useTransition();
  const sample = samples.find((s) => s.key === key) ?? null;

  function pick(nextKey: string) {
    const next = samples.find((s) => s.key === nextKey);
    setKey(nextKey);
    setText(next?.json ?? "");
    setResult(null);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div className="space-y-3">
        <div>
          <label htmlFor="sim-sample" className="block text-[12.5px] font-medium text-ecrn-ink mb-1.5">
            Sample event
          </label>
          <select
            id="sim-sample"
            value={key}
            onChange={(e) => pick(e.target.value)}
            className="w-full h-11 px-3.5 rounded-[12px] bg-white border border-ecrn-line text-[14.5px] text-ecrn-ink focus:outline-none focus:border-ecrn-green focus:ring-2 focus:ring-ecrn-green/20"
          >
            {samples.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label} ({s.type})
              </option>
            ))}
          </select>
          {sample && <p className="mt-1.5 text-[12.5px] leading-relaxed text-ecrn-secondary">{sample.description}</p>}
        </div>

        <div>
          <label htmlFor="sim-json" className="block text-[12.5px] font-medium text-ecrn-ink mb-1.5">
            Event JSON
          </label>
          <textarea
            id="sim-json"
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
            className="w-full min-h-[340px] px-3.5 py-3 rounded-[12px] resize-y bg-white border border-ecrn-line font-mono text-[12.5px] leading-[1.6] text-ecrn-ink focus:outline-none focus:border-ecrn-green focus:ring-2 focus:ring-ecrn-green/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            loading={pending}
            disabled={!text.trim()}
            onClick={() =>
              start(async () => {
                try {
                  setResult(await simulateEventAction(text));
                } catch {
                  setResult({ ok: false, message: "That did not work. Try again.", events: [] });
                }
              })
            }
          >
            Apply event
          </Button>
          <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => pick(key)}>
            Reset sample
          </Button>
        </div>
      </div>

      <div aria-live="polite">
        <p className="text-[12.5px] font-medium text-ecrn-ink mb-1.5">Result</p>
        {!result ? (
          <div className="rounded-[12px] border border-dashed border-ecrn-line px-4 py-8 text-center text-[13px] text-ecrn-secondary">
            Apply an event to see what ECRN did with it.
          </div>
        ) : (
          <div className="space-y-3">
            {result.message && (
              <div className={`rounded-[12px] px-3.5 py-2.5 text-[13px] ${result.ok ? "bg-ecrn-action-surface text-ecrn-green-text" : "bg-red-50 text-red-800"}`}>
                {result.message}
              </div>
            )}
            {result.events.map((e, i) => (
              <div key={i} className="rounded-[12px] border border-ecrn-line bg-white p-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex px-2 py-0.5 rounded-[6px] text-[11.5px] font-medium ${STATUS_STYLE[e.status] ?? STATUS_STYLE.ignored}`}>
                    {e.status}
                  </span>
                  <span className="font-mono text-[12px] text-ecrn-secondary">{e.type}</span>
                </div>
                <p className="mt-2 text-[13.5px] text-ecrn-ink">{e.summary}</p>
                {e.error && <p className="mt-1 text-[12.5px] text-red-700">{e.error}</p>}
                {e.notes.length > 0 && (
                  <ul className="mt-2 space-y-1 text-[12.5px] text-amber-800">
                    {e.notes.map((n, j) => (
                      <li key={j}>{n}</li>
                    ))}
                  </ul>
                )}
                {e.detail && (
                  <pre className="mt-2 max-h-[260px] overflow-auto rounded-[10px] border border-ecrn-line bg-ecrn-paper p-3 font-mono text-[11.5px] leading-[1.55] text-ecrn-ink">
                    {e.detail}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
