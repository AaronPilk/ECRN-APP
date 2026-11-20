import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Small building blocks used only by the admin dashboard. Server-component
 * safe (no hooks). Charts shared with other screens live in ../charts.tsx.
 */

const num = (n: number) => n.toLocaleString("en-US");

/** Column spans inside the dashboard grid (1 col on phones, 2 at lg, 3 at xl). */
export const span = {
  /** Two columns wide. */
  wide: "lg:col-span-2",
  /** The whole row. */
  full: "lg:col-span-2 xl:col-span-3",
  /** Whole row on a 2-column grid, a single column on the 3-column grid. */
  lgWide: "lg:col-span-2 xl:col-span-1",
} as const;

/** Heading row that starts a new group of panels. */
export function SectionHeading({ id, title, note }: { id: string; title: string; note?: ReactNode }) {
  return (
    <div id={id} className="col-span-full scroll-mt-6 mt-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-ecrn-line pb-2">
      <h2 className="font-display text-[20px] font-semibold tracking-[-0.02em] text-ecrn-ink">{title}</h2>
      {note && <p className="text-[12.5px] text-ecrn-secondary">{note}</p>}
    </div>
  );
}

/** "View all" style link for a panel's top-right corner. */
export function PanelLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 font-medium text-ecrn-green-text hover:underline whitespace-nowrap">
      {children}
      <ArrowRight className="w-3.5 h-3.5" aria-hidden />
    </Link>
  );
}

/** Small label above a chart inside a panel that holds more than one. */
export function SubHeading({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn("t-eyebrow mb-2.5", className)}>{children}</h3>;
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="text-[13px] text-ecrn-secondary">{children}</p>;
}

/** Compact number tile for use inside a panel. */
export function MiniStat({
  label,
  value,
  hint,
  href,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  href?: string;
  tone?: "default" | "green" | "amber" | "red";
}) {
  const toneClass = { default: "text-ecrn-ink", green: "text-ecrn-green-text", amber: "text-amber-700", red: "text-red-700" }[tone];
  const body = (
    <div className={cn("h-full rounded-[12px] border border-ecrn-line px-3.5 py-2.5", href && "hover:border-ecrn-green transition-colors")}>
      <div className="text-[11.5px] leading-tight text-ecrn-secondary">{label}</div>
      <div className={cn("mt-1 font-display text-[21px] leading-none font-semibold tabular-nums tracking-[-0.02em]", toneClass)}>{value}</div>
      {hint && <div className="mt-1 text-[11.5px] leading-tight text-ecrn-secondary">{hint}</div>}
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

// ── Needs attention ──────────────────────────────────────────────────

export interface AttentionItem {
  label: string;
  count: number;
  href: string;
}

/** Live to-do counts. Items at zero are hidden; all zero shows a calm line. */
export function AttentionStrip({ items }: { items: AttentionItem[] }) {
  const open = items.filter((i) => i.count > 0);
  if (!open.length) {
    return (
      <section aria-label="Needs attention" className="flex items-center gap-2.5 rounded-[16px] border border-ecrn-line bg-white px-5 py-3.5 text-[13.5px] text-ecrn-secondary">
        <CheckCircle2 className="w-[18px] h-[18px] shrink-0 text-ecrn-green" aria-hidden />
        <p>
          <span className="font-medium text-ecrn-ink">Nothing needs attention.</span> No one is waiting on routing, approvals or reviews.
        </p>
      </section>
    );
  }
  return (
    <section aria-label="Needs attention" className="rounded-[16px] border border-amber-200 bg-amber-50/70 px-4 py-3.5 sm:px-5">
      <h2 className="flex items-center gap-2 text-[13px] font-semibold text-amber-900">
        <AlertTriangle className="w-4 h-4" aria-hidden />
        Needs attention
      </h2>
      <ul className="mt-2.5 flex flex-wrap gap-2">
        {open.map((i) => (
          <li key={i.label} className="flex-1 min-w-[210px]">
            <Link
              href={i.href}
              className="group flex h-full items-center gap-3 rounded-[12px] border border-amber-200 bg-white px-3.5 py-2.5 transition-colors hover:border-amber-400"
            >
              <span className="font-display text-[22px] leading-none font-semibold tabular-nums tracking-[-0.02em] text-ecrn-ink">{num(i.count)}</span>
              <span className="text-[13px] leading-tight text-ecrn-ink">{i.label}</span>
              <ArrowRight className="ml-auto w-4 h-4 shrink-0 text-ecrn-secondary transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── Charts the shared kit doesn't have ───────────────────────────────

/** Columns over time with any number of stacked series (the shared ColumnChart stops at two). */
export function StackedColumns({
  data,
  series,
  height = 190,
  emptyLabel = "No data in this period",
}: {
  data: { label: string; values: number[] }[];
  series: { name: string; color: string }[];
  height?: number;
  emptyLabel?: string;
}) {
  const totals = data.map((d) => d.values.reduce((s, v) => s + v, 0));
  const max = Math.max(1, ...totals);
  const every = Math.max(1, Math.ceil(data.length / 8));
  const hasData = totals.some((t) => t > 0);
  const seriesTotals = series.map((_, j) => data.reduce((s, d) => s + (d.values[j] ?? 0), 0));
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ecrn-secondary">
        {series.map((s, j) => (
          <span key={s.name} className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: s.color }} />
            {s.name}
            <span className="font-medium tabular-nums text-ecrn-ink">{num(seriesTotals[j])}</span>
          </span>
        ))}
      </div>
      <div className="relative">
        <div className="flex items-end gap-[3px] border-b border-ecrn-line" style={{ height }}>
          {data.map((d, i) => {
            const top = d.values.reduce((last, v, j) => (v > 0 ? j : last), -1);
            return (
              <div
                key={i}
                className="flex-1 min-w-0 h-full flex flex-col-reverse justify-start"
                title={`${d.label}: ${series.map((s, j) => `${s.name} ${num(d.values[j] ?? 0)}`).join(", ")}`}
              >
                {series.map((s, j) => {
                  const v = d.values[j] ?? 0;
                  if (v <= 0) return null;
                  return (
                    <div
                      key={s.name}
                      className={j === top ? "rounded-t-[3px]" : undefined}
                      style={{ height: `${(v / max) * 100}%`, minHeight: 2, background: s.color }}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
        {!hasData && <p className="absolute inset-0 grid place-items-center text-[13px] text-ecrn-secondary">{emptyLabel}</p>}
        <span className="absolute left-0 top-0 text-[10.5px] tabular-nums text-ecrn-secondary/80">{hasData ? num(max) : ""}</span>
      </div>
      <div className="mt-1.5 flex gap-[3px]">
        {data.map((d, i) => (
          <div key={i} className="flex-1 min-w-0 text-center text-[10.5px] text-ecrn-secondary whitespace-nowrap overflow-visible">
            {i % every === 0 ? d.label : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Funnel where every step is shown as a share of the first step. Use it when
 * steps are not strictly one-after-another (someone can refer a friend without
 * adding a résumé), so "percent of the previous step" would mislead.
 */
export function ShareFunnel({
  steps,
  color = "#16C172",
  shareLabel = "of accounts",
  emptyLabel = "No data yet",
}: {
  steps: { label: string; value: number }[];
  color?: string;
  shareLabel?: string;
  emptyLabel?: string;
}) {
  const top = steps[0]?.value ?? 0;
  if (top <= 0) return <EmptyNote>{emptyLabel}</EmptyNote>;
  return (
    <ol className="space-y-2.5">
      {steps.map((s, i) => (
        <li key={s.label} className="grid grid-cols-[minmax(112px,190px)_1fr_auto] items-center gap-3 text-[13px]">
          <span className="leading-tight text-ecrn-ink">{s.label}</span>
          <div className="h-6 rounded-[6px] bg-[#EEF2EE] overflow-hidden">
            <div
              className="h-full rounded-[6px]"
              style={{
                width: `${Math.min(100, Math.max((s.value / top) * 100, s.value > 0 ? 1.5 : 0))}%`,
                background: color,
                opacity: 1 - i * (0.55 / Math.max(steps.length, 1)),
              }}
            />
          </div>
          <span className="min-w-[64px] whitespace-nowrap text-right tabular-nums">
            <span className="font-medium text-ecrn-ink">{num(s.value)}</span>
            {i > 0 && <span className="ml-1.5 text-ecrn-secondary">{Math.round((s.value / top) * 100)}%</span>}
          </span>
        </li>
      ))}
      <li className="text-[11.5px] text-ecrn-secondary">Percentages are the share {shareLabel}.</li>
    </ol>
  );
}

/**
 * One 100% bar with its legend laid out in columns. Same idea as the shared
 * StackedBar, for breakdowns with many parts (15 pipeline stages) where a
 * single-column legend would run far down the page. Parts at zero are left out.
 */
export function SplitBar({
  data,
  columns = "sm:grid-cols-2 xl:grid-cols-3",
  emptyLabel = "No data yet",
}: {
  data: { label: string; value: number; color: string }[];
  /** Tailwind grid-cols classes for the legend. */
  columns?: string;
  emptyLabel?: string;
}) {
  const rows = data.filter((d) => d.value > 0);
  const total = rows.reduce((s, d) => s + d.value, 0);
  if (!total) return <EmptyNote>{emptyLabel}</EmptyNote>;
  const share = (v: number) => `${Math.round((v / total) * 100)}%`;
  return (
    <div>
      <div className="flex h-3.5 overflow-hidden rounded-full bg-[#E9EDE8]">
        {rows.map((d) => (
          <div key={d.label} title={`${d.label}: ${num(d.value)} (${share(d.value)})`} style={{ width: `${(d.value / total) * 100}%`, background: d.color }} />
        ))}
      </div>
      <ul className={cn("mt-3 grid gap-x-8 gap-y-1.5 text-[13px]", columns)}>
        {rows.map((d) => (
          <li key={d.label} className="flex min-w-0 items-center gap-2">
            <span className="w-2.5 h-2.5 shrink-0 rounded-[3px]" style={{ background: d.color }} />
            <span className="truncate text-ecrn-ink">{d.label}</span>
            <span className="ml-auto whitespace-nowrap pl-3 tabular-nums text-ecrn-secondary">
              {num(d.value)} · {share(d.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One bar split by amount, with a row per status showing how many and how much. */
export function MoneyBreakdown({
  rows,
  formatMoney,
  emptyLabel = "No payouts yet",
}: {
  rows: { label: string; count: number; cents: number; color: string }[];
  formatMoney: (cents: number) => string;
  emptyLabel?: string;
}) {
  const totalCount = rows.reduce((s, r) => s + r.count, 0);
  const totalCents = rows.reduce((s, r) => s + r.cents, 0);
  if (!totalCount) return <EmptyNote>{emptyLabel}</EmptyNote>;
  return (
    <div>
      <div className="flex h-3.5 overflow-hidden rounded-full bg-[#E9EDE8]">
        {rows.map((r) =>
          r.cents > 0 && totalCents > 0 ? (
            <div key={r.label} title={`${r.label}: ${formatMoney(r.cents)}`} style={{ width: `${(r.cents / totalCents) * 100}%`, background: r.color }} />
          ) : null
        )}
      </div>
      <ul className="mt-3 space-y-1.5 text-[13px]">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 shrink-0 rounded-[3px]" style={{ background: r.color }} />
            <span className="truncate text-ecrn-ink">{r.label}</span>
            <span className="ml-auto whitespace-nowrap pl-3 tabular-nums text-ecrn-secondary">
              {num(r.count)} · <span className="font-medium text-ecrn-ink">{formatMoney(r.cents)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Borderless table for use inside a Panel (the shared DataTable brings its own card). */
export function PanelTable({ head, children, minWidth = 640 }: { head: { label: ReactNode; right?: boolean; title?: string }[]; children: ReactNode; minWidth?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[13px]" style={{ minWidth }}>
        <thead className="border-y border-ecrn-line bg-ecrn-paper text-[11px] uppercase tracking-wide text-ecrn-secondary">
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col" title={h.title} className={cn("px-3 py-2 font-medium whitespace-nowrap first:pl-5 last:pr-5", h.right && "text-right")}>
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ecrn-line">{children}</tbody>
      </table>
    </div>
  );
}

export const cell = "px-3 py-2.5 align-middle first:pl-5 last:pr-5";
export const cellNum = `${cell} text-right tabular-nums`;

/** A number in a table: muted when zero so the eye lands on what matters. */
export function Num({ n, strong }: { n: number; strong?: boolean }) {
  return <span className={cn(n === 0 ? "text-ecrn-secondary/60" : strong ? "font-semibold text-ecrn-ink" : "text-ecrn-ink")}>{num(n)}</span>;
}
