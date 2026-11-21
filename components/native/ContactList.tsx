"use client";

import { memo, useLayoutEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ImportedContact } from "@/app/(app)/referrals/actions";

export interface ContactRow extends ImportedContact {
  key: string;
  display: string;
}

const ROW_HEIGHT = 72;
const OVERSCAN = 8;

/** Keep large phone address books out of the DOM while searching all contacts. */
export const ContactList = memo(function ContactList({
  rows,
  selected,
  onToggle,
}: {
  rows: ContactRow[];
  selected: Set<string>;
  onToggle: (key: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [range, setRange] = useState({ start: 0, end: 32 });

  useLayoutEffect(() => {
    let frame = 0;
    function measure() {
      frame = 0;
      if (!container.current) return;
      const top = container.current.getBoundingClientRect().top;
      const start = Math.max(0, Math.min(rows.length - 1, Math.floor(-top / ROW_HEIGHT) - OVERSCAN));
      const end = Math.min(rows.length, Math.max(start + 1, Math.ceil((window.innerHeight - top) / ROW_HEIGHT) + OVERSCAN));
      setRange((old) => old.start === start && old.end === end ? old : { start, end });
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(measure);
    }
    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [rows.length]);

  if (!rows.length) return <p className="group-surface p-5 text-[14px] text-ecrn-secondary">No contacts match.</p>;

  return (
    <div
      ref={container}
      role="listbox"
      aria-label="Contacts"
      aria-multiselectable="true"
      className="group-surface relative"
      style={{ height: rows.length * ROW_HEIGHT }}
    >
      {rows.slice(range.start, range.end).map((row, offset) => {
        const on = selected.has(row.key);
        const hasPhone = (row.phone ?? "").replace(/\D/g, "").length >= 10;
        return (
          <button
            key={row.key}
            type="button"
            role="option"
            aria-selected={on}
            aria-setsize={rows.length}
            aria-posinset={range.start + offset + 1}
            onClick={() => onToggle(row.key)}
            className="absolute inset-x-0 w-full flex items-center gap-3 px-4 text-left border-b border-ecrn-line active:bg-ecrn-paper"
            style={{ top: (range.start + offset) * ROW_HEIGHT, height: ROW_HEIGHT }}
          >
            <span aria-hidden="true" className={cn("w-6 h-6 shrink-0 rounded-full border-2 grid place-items-center", on ? "bg-ecrn-green border-ecrn-green text-ecrn-action-ink" : "border-ecrn-line")}>
              {on && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15.5px] font-medium text-ecrn-ink truncate">{row.display}</span>
              <span className="block text-[12.5px] text-ecrn-secondary truncate">
                {[row.currentJobTitle, row.company].filter(Boolean).join(" · ") || row.phone || row.email}
              </span>
            </span>
            {!hasPhone && <span className="text-[11px] text-amber-700 shrink-0">No phone</span>}
          </button>
        );
      })}
    </div>
  );
});
