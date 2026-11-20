import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { DataTable, Pill, fmtNum, tdClass } from "@/components/admin/ui";
import { Sparkline } from "@/components/admin/charts";
import { STAFF_ROLE_LABEL, staffName } from "@/lib/admin/staff";
import { cn } from "@/lib/utils/cn";
import type { Staff } from "@/types";

/**
 * Server-rendered pieces shared by the Team list and a team member's page.
 * Server components only (lib/admin/staff is server-only).
 */

export interface StaffRowStats {
  directSignups: number;
  networkSignups: number;
  signups: number;
  signups30d: number;
  candidatesAssigned: number;
  candidatesOwned: number;
  placements: number;
  weekly: number[];
}

/**
 * A link that looks like the small Button (a <button> can't sit inside an <a>).
 * `download` renders a plain <a> for file routes such as the CSV exports.
 */
export function LinkButton({
  href,
  variant = "secondary",
  download = false,
  className,
  children,
}: {
  href: string;
  variant?: "primary" | "secondary" | "deep";
  download?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const variants = {
    primary:
      "bg-gradient-to-b from-ecrn-action-bright to-ecrn-green text-ecrn-action-ink border border-[#13B66B] shadow-action hover:brightness-[1.03] active:brightness-95",
    secondary: "bg-white text-ecrn-ink border border-ecrn-line hover:bg-ecrn-paper active:bg-slate-100",
    deep: "bg-ecrn-green-text text-white border border-ecrn-green-text hover:brightness-110 active:brightness-95",
  }[variant];
  const cls = cn(
    "inline-flex items-center justify-center gap-2 h-9 px-3.5 text-sm rounded-[12px] font-medium whitespace-nowrap transition-all duration-150",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ecrn-green focus-visible:ring-offset-2",
    variants,
    className
  );
  if (download) {
    return (
      <a href={href} download className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

export function ActivePill({ active }: { active: boolean }) {
  return active ? <Pill tone="green">Active</Pill> : <Pill tone="amber">Inactive</Pill>;
}

/** Zero is shown quietly so the real numbers stand out. */
export function Num({ value, strong }: { value: number; strong?: boolean }) {
  return (
    <span className={cn("tabular-nums", value > 0 ? (strong ? "font-semibold text-ecrn-ink" : "text-ecrn-ink") : "text-ecrn-secondary/60")}>
      {fmtNum(value)}
    </span>
  );
}

/** Small label + number used in the account manager headers. */
export function MiniStat({ label, value, hint }: { label: string; value: number; hint?: string }) {
  return (
    <div className="min-w-[72px]">
      <dt className="text-[11.5px] text-ecrn-secondary whitespace-nowrap">{label}</dt>
      <dd className="font-display text-[20px] leading-6 font-semibold tabular-nums tracking-[-0.02em] text-ecrn-ink">{fmtNum(value)}</dd>
      {hint && <dd className="text-[11.5px] text-ecrn-secondary whitespace-nowrap">{hint}</dd>}
    </div>
  );
}

/**
 * One row per person: name, code, sign-ups, 12-week trend, workload, status.
 * `flush` drops the outer border so the table can sit inside a card.
 */
export function StaffTable({
  rows,
  statsOf,
  showRole = false,
  flush = false,
}: {
  rows: Staff[];
  statsOf: (id: string) => StaffRowStats;
  /** Show each person's role under their name (mixed lists). */
  showRole?: boolean;
  flush?: boolean;
}) {
  return (
    <DataTable
      className={flush ? "rounded-none border-0 border-t" : undefined}
      // Short labels and fixed minimum widths keep every team's table lined up with the next one.
      head={[
        <span key="name" className="inline-block min-w-[140px]">Name</span>,
        <span key="code" className="inline-block min-w-[70px]">Code</span>,
        <span key="direct" title="Signed up with their own link or code">Direct</span>,
        <span key="network" title="Invited by a member they brought in">Network</span>,
        <span key="d30" title="Sign-ups in the last 30 days">30 days</span>,
        <span key="trend" title="Sign-ups per week, last 12 weeks">12 weeks</span>,
        <span key="cand" title="Assigned to a recruiter, or owned by an account manager or owner">Candidates</span>,
        "Placements",
        <span key="status" className="inline-block min-w-[58px]">Status</span>,
        <span key="open" className="sr-only">Open</span>,
      ]}
    >
      {rows.map((s) => {
        const st = statsOf(s.id);
        const isRecruiter = s.staffRole === "recruiter";
        const candidates = isRecruiter ? st.candidatesAssigned : st.candidatesOwned;
        const sub = [showRole ? STAFF_ROLE_LABEL[s.staffRole] : null, s.title].filter(Boolean).join(" · ");
        return (
          <tr key={s.id} className={cn("hover:bg-ecrn-paper/60", !s.isActive && "opacity-70")}>
            <td className={tdClass}>
              <Link href={`/admin/team/${s.id}`} className="font-medium text-ecrn-ink hover:text-ecrn-green-text hover:underline whitespace-nowrap">
                {staffName(s)}
              </Link>
              {sub && <div className="text-[12.5px] text-ecrn-secondary">{sub}</div>}
            </td>
            <td className={cn(tdClass, "font-mono text-[12.5px] text-ecrn-ink whitespace-nowrap")}>{s.inviteCode}</td>
            <td className={tdClass}>
              <Num value={st.directSignups} strong />
            </td>
            <td className={tdClass}>
              <Num value={st.networkSignups} />
            </td>
            <td className={tdClass}>
              <Num value={st.signups30d} />
            </td>
            <td className={cn(tdClass, "py-2")}>
              <span title={`Sign-ups per week, oldest first: ${st.weekly.join(", ")}`} className="inline-block">
                <Sparkline values={st.weekly} width={84} color={st.signups > 0 ? "#16C172" : "#94A3B8"} />
              </span>
            </td>
            <td className={tdClass}>
              <span title={isRecruiter ? "Assigned to them as recruiter" : "Owned as account manager"}>
                <Num value={candidates} />
              </span>
            </td>
            <td className={tdClass}>
              <Num value={st.placements} />
            </td>
            <td className={tdClass}>
              <ActivePill active={s.isActive} />
            </td>
            <td className={cn(tdClass, "text-right")}>
              <Link
                href={`/admin/team/${s.id}`}
                aria-label={`Open ${staffName(s)}`}
                title={`Open ${staffName(s)}`}
                className="inline-flex items-center justify-center w-7 h-7 -my-1 rounded-full text-ecrn-green-text hover:bg-ecrn-action-surface"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            </td>
          </tr>
        );
      })}
    </DataTable>
  );
}
