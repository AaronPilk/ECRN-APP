import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Lightweight charts for the admin: plain SVG/CSS, rendered on the server.
 * No chart library, no client JavaScript, and they print cleanly.
 * Hovering any segment/bar shows a native tooltip with the exact number.
 */

export const CHART_COLORS = [
  "#16C172", "#0655CE", "#00244B", "#5BA8FF", "#07653E", "#F59E0B", "#36DC86", "#BCDFFF", "#94A3B8", "#EF4444",
];

export interface Slice {
  label: string;
  value: number;
  color?: string;
}

const pct = (v: number, total: number) => (total > 0 ? `${Math.round((v / total) * 100)}%` : "0%");

export function Legend({ data, total, className }: { data: Slice[]; total?: number; className?: string }) {
  const sum = total ?? data.reduce((s, d) => s + d.value, 0);
  return (
    <ul className={cn("space-y-1.5 text-[13px] min-w-0", className)}>
      {data.map((d, i) => (
        <li key={d.label} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-[3px] shrink-0" style={{ background: d.color ?? CHART_COLORS[i % CHART_COLORS.length] }} />
          <span className="text-ecrn-ink truncate">{d.label}</span>
          <span className="ml-auto pl-3 tabular-nums text-ecrn-secondary whitespace-nowrap">
            {d.value.toLocaleString("en-US")} · {pct(d.value, sum)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Pie / donut chart with a legend. */
export function Donut({
  data,
  size = 164,
  thickness = 24,
  centerValue,
  centerLabel,
  emptyLabel = "No data yet",
}: {
  data: Slice[];
  size?: number;
  thickness?: number;
  centerValue?: ReactNode;
  centerLabel?: string;
  emptyLabel?: string;
}) {
  const rows = data.filter((d) => d.value > 0);
  const total = rows.reduce((s, d) => s + d.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const segs = rows.reduce<{ d: Slice; len: number; offset: number; color: string }[]>((acc, d, i) => {
    const len = (d.value / total) * c;
    const offset = acc.length ? acc[acc.length - 1].offset + acc[acc.length - 1].len : 0;
    acc.push({ d, len, offset, color: d.color ?? CHART_COLORS[data.indexOf(d) % CHART_COLORS.length] ?? CHART_COLORS[i % CHART_COLORS.length] });
    return acc;
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={centerLabel ?? "Chart"} className="shrink-0">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E9EDE8" strokeWidth={thickness} />
        {segs.map((s) => (
          <circle
            key={s.d.label}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={thickness}
            strokeDasharray={`${Math.max(s.len - 1.5, 0.5)} ${c}`}
            strokeDashoffset={-s.offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          >
            <title>{`${s.d.label}: ${s.d.value.toLocaleString("en-US")} (${pct(s.d.value, total)})`}</title>
          </circle>
        ))}
        <text x="50%" y={centerLabel ? "47%" : "52%"} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.19} fontWeight={600} fill="#101A14" style={{ fontFamily: "var(--font-geist-sans)" }}>
          {centerValue ?? total.toLocaleString("en-US")}
        </text>
        {centerLabel && (
          <text x="50%" y="63%" textAnchor="middle" fontSize={11} fill="#506158">
            {centerLabel}
          </text>
        )}
      </svg>
      {total > 0 ? (
        <Legend data={rows.map((d) => ({ ...d, color: d.color ?? CHART_COLORS[data.indexOf(d) % CHART_COLORS.length] }))} total={total} className="flex-1 min-w-[170px]" />
      ) : (
        <p className="text-[13px] text-ecrn-secondary">{emptyLabel}</p>
      )}
    </div>
  );
}

/** Ranked horizontal bars (leaderboards, top lists). */
export function BarList({
  data,
  color = "#16C172",
  valueFormat = (n: number) => n.toLocaleString("en-US"),
  max,
  emptyLabel = "No data yet",
  limit,
}: {
  data: { label: string; value: number; sub?: string; href?: string; color?: string }[];
  color?: string;
  valueFormat?: (n: number) => string;
  max?: number;
  emptyLabel?: string;
  limit?: number;
}) {
  const rows = (limit ? data.slice(0, limit) : data).filter((d) => d.label);
  const top = max ?? Math.max(1, ...rows.map((d) => d.value));
  if (!rows.length) return <p className="text-[13px] text-ecrn-secondary">{emptyLabel}</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((d) => {
        const inner = (
          <>
            <div className="flex items-baseline justify-between gap-3 text-[13px]">
              <span className="text-ecrn-ink truncate">
                {d.label}
                {d.sub && <span className="ml-1.5 text-ecrn-secondary">{d.sub}</span>}
              </span>
              <span className="tabular-nums font-medium text-ecrn-ink whitespace-nowrap">{valueFormat(d.value)}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-[#E9EDE8] overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.max((d.value / top) * 100, d.value > 0 ? 2 : 0)}%`, background: d.color ?? color }} />
            </div>
          </>
        );
        return (
          <li key={d.label}>
            {d.href ? (
              <Link href={d.href} className="block hover:opacity-80">
                {inner}
              </Link>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Vertical bars over time. `value2` stacks on top (e.g. a second series). */
export function ColumnChart({
  data,
  height = 180,
  color = "#16C172",
  color2 = "#0655CE",
  series,
  emptyLabel = "No data in this period",
}: {
  data: { label: string; value: number; value2?: number }[];
  height?: number;
  color?: string;
  color2?: string;
  /** Legend names for value / value2. */
  series?: [string, string?];
  emptyLabel?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value + (d.value2 ?? 0)));
  const every = Math.max(1, Math.ceil(data.length / 8));
  const hasData = data.some((d) => d.value + (d.value2 ?? 0) > 0);
  return (
    <div>
      {series && (
        <div className="mb-3 flex gap-4 text-[12px] text-ecrn-secondary">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: color }} /> {series[0]}
          </span>
          {series[1] && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: color2 }} /> {series[1]}
            </span>
          )}
        </div>
      )}
      <div className="relative">
        <div className="flex items-end gap-[3px] border-b border-ecrn-line" style={{ height }}>
          {data.map((d, i) => (
            <div key={i} className="flex-1 min-w-0 h-full flex flex-col justify-end" title={`${d.label}: ${d.value.toLocaleString("en-US")}${d.value2 != null ? ` + ${d.value2.toLocaleString("en-US")}` : ""}`}>
              {d.value2 ? <div className="rounded-t-[3px]" style={{ height: `${(d.value2 / max) * 100}%`, background: color2 }} /> : null}
              <div className={d.value2 ? "" : "rounded-t-[3px]"} style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 2 : 0, background: color }} />
            </div>
          ))}
        </div>
        {!hasData && <p className="absolute inset-0 grid place-items-center text-[13px] text-ecrn-secondary">{emptyLabel}</p>}
        <span className="absolute left-0 top-0 text-[10.5px] tabular-nums text-ecrn-secondary/80">{hasData ? max.toLocaleString("en-US") : ""}</span>
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

/** Step-by-step funnel with conversion from the previous step. */
export function Funnel({ steps, color = "#0655CE" }: { steps: { label: string; value: number; href?: string }[]; color?: string }) {
  const top = Math.max(1, steps[0]?.value ?? 1);
  return (
    <ol className="space-y-2">
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].value : null;
        return (
          <li key={s.label} className="grid grid-cols-[minmax(110px,170px)_1fr_auto] items-center gap-3 text-[13px]">
            <span className="text-ecrn-ink truncate">{s.href ? <Link href={s.href} className="hover:underline">{s.label}</Link> : s.label}</span>
            <div className="h-6 rounded-[6px] bg-[#EEF2EE] overflow-hidden">
              <div className="h-full rounded-[6px]" style={{ width: `${Math.max((s.value / top) * 100, s.value > 0 ? 1.5 : 0)}%`, background: color, opacity: 1 - i * (0.55 / Math.max(steps.length, 1)) }} />
            </div>
            <span className="tabular-nums whitespace-nowrap text-right min-w-[84px]">
              <span className="font-medium text-ecrn-ink">{s.value.toLocaleString("en-US")}</span>
              {prev != null && <span className="ml-1.5 text-ecrn-secondary">{pct(s.value, prev)}</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** One 100% bar split into segments, with a legend. */
export function StackedBar({ data, emptyLabel = "No data yet" }: { data: Slice[]; emptyLabel?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <p className="text-[13px] text-ecrn-secondary">{emptyLabel}</p>;
  return (
    <div>
      <div className="flex h-3.5 rounded-full overflow-hidden bg-[#E9EDE8]">
        {data.map((d, i) =>
          d.value > 0 ? (
            <div key={d.label} title={`${d.label}: ${d.value.toLocaleString("en-US")} (${pct(d.value, total)})`} style={{ width: `${(d.value / total) * 100}%`, background: d.color ?? CHART_COLORS[i % CHART_COLORS.length] }} />
          ) : null
        )}
      </div>
      <Legend data={data.map((d, i) => ({ ...d, color: d.color ?? CHART_COLORS[i % CHART_COLORS.length] }))} total={total} className="mt-3" />
    </div>
  );
}

/** Tiny trend line for stat cards and table rows. */
export function Sparkline({ values, width = 96, height = 28, color = "#16C172" }: { values: number[]; width?: number; height?: number; color?: string }) {
  if (values.length < 2) return <svg width={width} height={height} aria-hidden />;
  const max = Math.max(1, ...values);
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => `${(i * step).toFixed(1)},${(height - 2 - (v / max) * (height - 4)).toFixed(1)}`).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <polyline points={`0,${height} ${pts} ${width},${height}`} fill={color} opacity={0.12} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/** Label + value rows for small breakdowns. */
export function KeyValues({ rows }: { rows: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="divide-y divide-ecrn-line text-[13.5px]">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4 py-2">
          <dt className="text-ecrn-secondary">{r.label}</dt>
          <dd className="font-medium text-ecrn-ink tabular-nums text-right">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
