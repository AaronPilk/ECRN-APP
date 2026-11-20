import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Shared building blocks for every admin screen (desktop-first).
 * Server-component safe: no hooks, no client code.
 */

export function AdminPage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("max-w-[1400px] mx-auto px-4 sm:px-8 py-7 space-y-6", className)}>{children}</div>;
}

export function AdminHeader({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="t-eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="font-display text-[30px] leading-[34px] font-semibold tracking-[-0.03em] text-ecrn-ink">{title}</h1>
        {subtitle && <p className="mt-1.5 text-[14.5px] text-ecrn-secondary max-w-3xl">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** White card with an optional title row. Use for charts, tables, and forms. */
export function Panel({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  subtitle?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("bg-white rounded-[16px] border border-ecrn-line", className)}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 px-5 pt-4 pb-1">
          <div className="min-w-0">
            {title && <h2 className="font-display text-[16px] font-semibold text-ecrn-ink">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[12.5px] text-ecrn-secondary">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0 text-[13px]">{action}</div>}
        </header>
      )}
      <div className={cn("px-5 pb-5 pt-3", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Headline number. `delta` is a percent change vs the previous period. */
export function StatCard({
  label,
  value,
  hint,
  delta,
  href,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  delta?: number | null;
  href?: string;
  tone?: "default" | "green" | "cobalt" | "amber" | "red";
}) {
  const toneClass = {
    default: "text-ecrn-ink",
    green: "text-ecrn-green-text",
    cobalt: "text-cobalt",
    amber: "text-amber-700",
    red: "text-red-700",
  }[tone];
  const body = (
    <div className={cn("h-full bg-white rounded-[16px] border border-ecrn-line px-4 py-3.5", href && "hover:border-ecrn-green transition-colors")}>
      <div className="text-[12px] font-medium text-ecrn-secondary">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className={cn("font-display text-[28px] leading-none font-semibold tabular-nums tracking-[-0.03em]", toneClass)}>{value}</span>
        {delta != null && Number.isFinite(delta) && (
          <span className={cn("inline-flex items-center text-[12px] font-medium", delta >= 0 ? "text-ecrn-green-text" : "text-red-700")}>
            {delta >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {Math.abs(Math.round(delta))}%
          </span>
        )}
      </div>
      {hint && <div className="mt-1 text-[12px] text-ecrn-secondary">{hint}</div>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

/** Table shell: pass header labels, render <tr> rows as children. */
export function DataTable({
  head,
  children,
  empty,
  className,
}: {
  head: ReactNode[];
  children: ReactNode;
  empty?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto rounded-[16px] border border-ecrn-line bg-white", className)}>
      <table className="w-full text-left text-[13.5px]">
        <thead className="bg-ecrn-paper text-[11.5px] uppercase tracking-wide text-ecrn-secondary">
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col" className="px-4 py-2.5 font-medium whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ecrn-line">{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

export const tdClass = "px-4 py-3 align-top";

export function EmptyState({ title, body, action }: { title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="px-6 py-10 text-center">
      <p className="font-display text-[16px] font-semibold text-ecrn-ink">{title}</p>
      {body && <p className="mt-1 text-[13.5px] text-ecrn-secondary max-w-md mx-auto">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Link-based filter tabs (state lives in the URL). */
export function FilterTabs({ tabs }: { tabs: { label: string; href: string; active: boolean; count?: number }[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tabs.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={cn(
            "h-[34px] px-3.5 rounded-full border text-[13px] font-medium inline-flex items-center gap-1.5",
            t.active ? "bg-ecrn-green-text text-white border-ecrn-green-text" : "bg-white text-ecrn-secondary border-ecrn-line hover:text-ecrn-ink"
          )}
        >
          {t.label}
          {t.count != null && <span className={cn("tabular-nums", t.active ? "text-white/80" : "text-ecrn-secondary/70")}>{t.count}</span>}
        </Link>
      ))}
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "blue" | "cobalt" | "amber" | "red" | "dark";
}) {
  const cls = {
    neutral: "bg-slate-100 text-slate-700",
    green: "bg-ecrn-selected text-ecrn-green-text",
    blue: "bg-delta-surface text-cobalt",
    cobalt: "bg-cobalt text-white",
    amber: "bg-amber-50 text-amber-800",
    red: "bg-red-50 text-red-700",
    dark: "bg-ecrn-black text-white",
  }[tone];
  return <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[11.5px] font-medium whitespace-nowrap", cls)}>{children}</span>;
}

/** Banner for "not connected yet" / informational states. */
export function Notice({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "amber" | "green" }) {
  const cls = { blue: "bg-delta-surface text-navy", amber: "bg-amber-50 text-amber-900", green: "bg-ecrn-action-surface text-ecrn-green-text" }[tone];
  return <div className={cn("rounded-[14px] px-4 py-3 text-[13.5px] leading-relaxed", cls)}>{children}</div>;
}

// ── formatting helpers ───────────────────────────────────────────────

export const fmtNum = (n: number | null | undefined) => (n ?? 0).toLocaleString("en-US");
export const fmtMoney = (cents: number | null | undefined) => `$${Math.round((cents ?? 0) / 100).toLocaleString("en-US")}`;
export const fmtPct = (num: number, den: number) => (den > 0 ? `${Math.round((num / den) * 100)}%` : "—");
export const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
export const fmtDateTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";
export function relTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return fmtDate(iso);
}
export const titleCase = (s: string | null | undefined) =>
  (s ?? "").replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
