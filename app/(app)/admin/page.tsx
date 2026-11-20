import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { DEFAULT_RANGE, RANGE_OPTIONS, getAdminAnalytics, parseRange, pctChange, type AdminAnalytics, type RangeOption } from "@/lib/admin/analytics";
import { AdminHeader, AdminPage, FilterTabs, Notice, StatCard, fmtMoney, fmtNum, fmtPct } from "@/components/admin/ui";
import { AttentionStrip } from "@/components/admin/dashboard/parts";
import { GrowthPanels, MemberPanels, TeamPanels } from "@/components/admin/dashboard/people";
import { JobsPanels, PayoutPanels, PipelinePanels } from "@/components/admin/dashboard/work";
import { ActivityPanels, IntegrationPanels } from "@/components/admin/dashboard/system";
import type { Scope } from "@/components/admin/dashboard/labels";

/**
 * Admin overview: the owners' command center. One RPC (`admin_analytics`)
 * returns everything on this page; the range lives in the URL as ?range=.
 */

const SECTIONS = [
  { id: "growth", label: "Growth" },
  { id: "team", label: "Team" },
  { id: "members", label: "Members" },
  { id: "pipeline", label: "Pipeline" },
  { id: "jobs", label: "Jobs" },
  { id: "payouts", label: "Payouts" },
  { id: "integrations", label: "Bullhorn" },
  { id: "activity", label: "Activity" },
];

const rangeHref = (key: string) => (key === DEFAULT_RANGE ? "/admin" : `/admin?range=${key}`);

function scopeFor(range: RangeOption): Scope {
  return range.days == null
    ? { days: null, when: "so far", title: "All time" }
    : { days: range.days, when: `in ${range.phrase}`, title: `Last ${range.label}` };
}

/** "Oct 22 to Nov 20" in the reporting time zone (years added when the range crosses one). */
function dateSpan(a: AdminAnalytics): string | null {
  if (!a.range.from) return null;
  const from = new Date(a.range.from);
  const to = new Date(a.generated_at);
  const zone = a.range.timezone;
  const year = (d: Date) => d.toLocaleDateString("en-US", { timeZone: zone, year: "numeric" });
  const fmt = (d: Date, withYear: boolean) =>
    d.toLocaleDateString("en-US", { timeZone: zone, month: "short", day: "numeric", ...(withYear ? { year: "numeric" as const } : {}) });
  const crossesYear = year(from) !== year(to);
  return `${fmt(from, crossesYear)} to ${fmt(to, crossesYear)}`;
}

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ range?: string | string[] }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const range = parseRange(sp.range);
  const scope = scopeFor(range);
  const tabs = <FilterTabs tabs={RANGE_OPTIONS.map((r) => ({ label: r.label, href: rangeHref(r.key), active: r.key === range.key }))} />;

  const result = await getAdminAnalytics(range.days);

  if (!result.ok) {
    return (
      <AdminPage>
        <AdminHeader eyebrow="Delta operations" title="Dashboard" subtitle="Everything happening in ECRN, Staffing Referrals and Bullhorn." actions={tabs} />
        <Notice tone="amber">
          <p className="font-medium">The dashboard numbers could not be loaded.</p>
          <p className="mt-1">
            If this is a new environment, apply the database migration <code>0010_admin_analytics.sql</code> and reload.
          </p>
          <p className="mt-1 text-[12.5px] opacity-80">Details: {result.error}</p>
        </Notice>
      </AdminPage>
    );
  }

  const a = result.data;
  const k = a.kpis;
  const days = a.range.days;
  const dates = dateSpan(a);

  // "12 in the 30 days before", so the change badge has its number next to it.
  const versus = (previous: number | null, total: number | null, asMoney = false): ReactNode => {
    const f = asMoney ? fmtMoney : fmtNum;
    if (days == null) return "All time";
    if (previous != null) return `${f(previous)} in the ${days} days before`;
    return total != null ? `${f(total)} all time` : undefined;
  };
  // Long dollar amounts get a slightly smaller face so the change badge still fits beside them.
  const money = (cents: number) => {
    const s = fmtMoney(cents);
    return s.length > 7 ? <span className="text-[23px]">{s}</span> : s;
  };

  return (
    <AdminPage>
      <AdminHeader
        eyebrow="Delta operations"
        title="Dashboard"
        subtitle={
          dates && days != null
            ? `Everything happening in ECRN, Staffing Referrals and Bullhorn. Showing ${dates}, compared with the ${days} days before.`
            : "Everything happening in ECRN, Staffing Referrals and Bullhorn, since day one."
        }
        actions={tabs}
      />

      <AttentionStrip
        items={[
          { label: "unassigned people", count: a.attention.unassigned_people, href: "/admin/routing" },
          { label: "jobs without an owner", count: a.attention.jobs_without_owner, href: "/admin/jobs" },
          { label: "payouts to approve", count: a.attention.payouts_to_approve, href: "/admin/payouts" },
          { label: "duplicates to review", count: a.attention.duplicates_to_review, href: "/admin/referrals" },
          { label: "failed sync events", count: a.attention.failed_sync_events, href: "/admin/sync" },
          { label: "applications to review", count: a.attention.applications_to_review, href: "/admin/applications" },
          { label: "new hiring requests", count: a.attention.hiring_requests_waiting, href: "/admin/companies" },
        ]}
      />

      <section aria-label="Headline numbers" className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <StatCard label="New members" value={fmtNum(k.new_members.value)} delta={pctChange(k.new_members)} hint={versus(k.new_members.previous, null)} href="/admin/members" tone="green" />
        <StatCard
          label="Total members"
          value={fmtNum(k.total_members.value)}
          delta={pctChange(k.total_members)}
          hint={k.total_members.previous != null ? `${fmtNum(k.total_members.previous)} when this period began` : "Every member account"}
          href="/admin/members"
        />
        <StatCard label="New candidates" value={fmtNum(k.new_candidates.value)} delta={pctChange(k.new_candidates)} hint={versus(k.new_candidates.previous, k.new_candidates.total)} href="/admin/candidates" />
        <StatCard label="Referrals submitted" value={fmtNum(k.referrals.value)} delta={pctChange(k.referrals)} hint={versus(k.referrals.previous, k.referrals.total)} href="/admin/referrals" />
        <StatCard label="Applications" value={fmtNum(k.applications.value)} delta={pctChange(k.applications)} hint={versus(k.applications.previous, k.applications.total)} href="/admin/applications" />
        <StatCard label="Placements" value={fmtNum(k.placements.value)} delta={pctChange(k.placements)} hint={versus(k.placements.previous, k.placements.total)} href="/admin/candidates" tone="green" />
        <div className="col-span-2 sm:col-span-1 [&>a]:block [&>a]:h-full">
          <StatCard
            label="Payouts owed"
            value={money(k.payouts_owed_cents.value)}
            delta={pctChange(k.payouts_owed_cents)}
            hint={`${fmtMoney(a.payouts.pending_cents)} to approve, ${fmtMoney(a.payouts.approved_cents)} approved`}
            href="/admin/payouts"
            tone={k.payouts_owed_cents.value > 0 ? "amber" : "default"}
          />
        </div>
        <div className="col-span-2 sm:col-span-1 [&>a]:block [&>a]:h-full">
          <StatCard
            label="Payouts paid"
            value={money(k.payouts_paid_cents.value)}
            delta={pctChange(k.payouts_paid_cents)}
            hint={versus(k.payouts_paid_cents.previous, k.payouts_paid_cents.total, true)}
            href="/admin/payouts"
          />
        </div>
        <StatCard
          label="Open jobs"
          value={fmtNum(k.open_jobs.value)}
          hint={days != null ? `${fmtNum(k.open_jobs.opened)} added ${scope.when}` : `${fmtNum(k.open_jobs.total)} jobs in total`}
          href="/admin/jobs"
          tone="cobalt"
        />
        <StatCard label="Active members" value={fmtNum(k.active_members.value)} hint={k.total_members.value > 0 ? `${fmtPct(k.active_members.value, k.total_members.value)} of members, last 7 days` : "Seen in the last 7 days"} href="/admin/members" />
      </section>

      <nav aria-label="Jump to a section" className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px]">
        <span className="t-eyebrow">Jump to</span>
        {SECTIONS.map((s) => (
          <a key={s.id} href={`#${s.id}`} className="text-ecrn-secondary hover:text-ecrn-ink hover:underline">
            {s.label}
          </a>
        ))}
      </nav>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3 [&>div:first-child]:mt-0">
        <GrowthPanels a={a} scope={scope} />
        <TeamPanels a={a} scope={scope} />
        <MemberPanels a={a} scope={scope} />
        <PipelinePanels a={a} scope={scope} />
        <JobsPanels a={a} scope={scope} />
        <PayoutPanels a={a} />
        <IntegrationPanels a={a} scope={scope} />
        <ActivityPanels a={a} />
      </div>
    </AdminPage>
  );
}
