import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getCurrentProfile } from "@/lib/auth/mock";
import {
  getAdminDashboardStats,
  listAllReferralsEnriched,
  listAllApplicationsEnriched,
  listCompanyLeads,
  listDuplicateReferralAttempts,
  listRecentActivity,
} from "@/lib/data/repository";
import {
  AlertTriangle,
  Briefcase,
  Building2,
  DollarSign,
  FileText,
  Users,
} from "lucide-react";

export default async function AdminDashboard() {
  const profile = (await getCurrentProfile())!;
  if (profile.role !== "admin") redirect("/dashboard");

  const stats = await getAdminDashboardStats();
  const recentReferrals = (await listAllReferralsEnriched()).slice(0, 5);
  const recentApps = (await listAllApplicationsEnriched()).slice(0, 5);
  const newLeads = (await listCompanyLeads())
    .filter((l) => l.status === "new")
    .slice(0, 5);
  const duplicates = (await listDuplicateReferralAttempts()).slice(0, 5);
  const activity = await listRecentActivity(15);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div>
        <p className="text-xs font-medium tracking-[0.18em] uppercase text-slate-500">
          Delta operations
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-ecrn-ink">
          Admin overview
        </h1>
        <p className="mt-1 text-slate-500">
          Real-time view of the ECRN network — candidates, jobs, leads, payouts.
        </p>
      </div>

      {/* Hero metric strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          label="Candidates"
          value={stats.candidates}
          delta={`+${stats.candidatesAddedThisWeek} this week`}
          icon={<Users className="w-4 h-4" />}
        />
        <Stat
          label="Referrals"
          value={stats.referrals}
          delta={`+${stats.referralsThisWeek} this week`}
          icon={<FileText className="w-4 h-4" />}
        />
        <Stat
          label="Placements"
          value={stats.placements}
          delta="All-time"
          icon={<Briefcase className="w-4 h-4" />}
        />
        <Stat
          label="Open jobs"
          value={stats.jobsOpen}
          delta={`${stats.applications} apps · ${stats.newApplicationsThisWeek} this week`}
          icon={<Briefcase className="w-4 h-4" />}
        />
      </div>

      {/* Payout bar */}
      <Card className="bg-ecrn-black text-white border-ecrn-black p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-ecrn-green font-semibold">
              Payout ledger
            </p>
            <div className="mt-2 flex items-baseline gap-3 flex-wrap">
              <Money
                label="Pending"
                cents={stats.payoutsPendingCents}
                color="text-amber-300"
              />
              <Money
                label="Approved"
                cents={stats.payoutsApprovedCents}
                color="text-blue-300"
              />
              <Money
                label="Paid"
                cents={stats.payoutsPaidCents}
                color="text-ecrn-green"
              />
            </div>
          </div>
          <Link
            href="/admin/payouts"
            className="text-sm text-ecrn-green hover:underline shrink-0"
          >
            Manage payouts →
          </Link>
        </div>
      </Card>

      {/* Action queues */}
      <div className="grid lg:grid-cols-2 gap-4">
        <QueueCard
          title="Duplicate review"
          icon={<AlertTriangle className="w-4 h-4" />}
          count={stats.duplicateReviewCount}
          tone="amber"
          href="/admin/referrals?filter=duplicates"
          emptyText="No duplicate referrals pending review."
        >
          {duplicates.map((d) => (
            <QueueRow
              key={d.referral.id}
              title={`${d.candidate.firstName} ${d.candidate.lastName}`}
              subtitle={`Attempted by ${
                d.referrer ? `${d.referrer.firstName} ${d.referrer.lastName}` : "Unknown"
              }`}
              date={d.referral.createdAt}
              href={`/admin/candidates/${d.candidate.id}`}
            />
          ))}
        </QueueCard>

        <QueueCard
          title="New company leads"
          icon={<Building2 className="w-4 h-4" />}
          count={stats.companyLeadsNew}
          tone="blue"
          href="/admin/companies"
          emptyText="No new hiring requests in the queue."
        >
          {newLeads.map((l) => (
            <QueueRow
              key={l.id}
              title={l.companyName}
              subtitle={`${l.roleNeeded ?? "—"} · ${l.contactName}`}
              date={l.createdAt}
              href={`/admin/companies/${l.id}`}
            />
          ))}
        </QueueCard>

        <QueueCard
          title="Recent referrals"
          icon={<FileText className="w-4 h-4" />}
          count={stats.referrals}
          tone="green"
          href="/admin/referrals"
          emptyText="No referrals yet."
        >
          {recentReferrals.map((r) => (
            <QueueRow
              key={r.referral.id}
              title={`${r.candidate.firstName} ${r.candidate.lastName}`}
              subtitle={`by ${
                r.referrer ? `${r.referrer.firstName} ${r.referrer.lastName}` : "Unknown"
              } · ${r.candidate.currentJobTitle ?? "—"}`}
              date={r.referral.createdAt}
              href={`/admin/candidates/${r.candidate.id}`}
            />
          ))}
        </QueueCard>

        <QueueCard
          title="Direct applications"
          icon={<FileText className="w-4 h-4" />}
          count={stats.applications}
          tone="neutral"
          href="/admin/referrals?filter=applications"
          emptyText="No direct applications yet."
        >
          {recentApps.map((a) => (
            <QueueRow
              key={a.application.id}
              title={a.candidate ? `${a.candidate.firstName} ${a.candidate.lastName}` : "Applicant"}
              subtitle={`Applied to ${a.job.title}`}
              date={a.application.createdAt}
              href={`/admin/candidates/${a.candidate?.id ?? ""}`}
            />
          ))}
        </QueueCard>
      </div>

      {/* Activity feed */}
      <Card>
        <CardContent className="py-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Recent activity
          </h2>
          {activity.length === 0 ? (
            <p className="text-sm text-slate-500">No activity yet.</p>
          ) : (
            <ol className="relative border-l border-slate-200 ml-2 space-y-3 pl-5">
              {activity.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[1.45rem] top-1.5 w-2.5 h-2.5 rounded-full bg-ecrn-green ring-4 ring-white" />
                  <div className="text-sm text-ecrn-ink">
                    <span className="font-medium">{humanize(a.action)}</span>
                    <span className="text-slate-500">
                      {" "}
                      on {a.entityType.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {new Date(a.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  delta,
  icon,
}: {
  label: string;
  value: number | string;
  delta?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-ecrn-ink">{value}</div>
      {delta && <div className="text-[11px] text-slate-500 mt-0.5">{delta}</div>}
    </Card>
  );
}

function Money({
  label,
  cents,
  color,
}: {
  label: string;
  cents: number;
  color: string;
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-white/50">{label}</div>
      <div className={`text-2xl font-bold tabular-nums ${color}`}>
        ${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}
      </div>
    </div>
  );
}

function QueueCard({
  title,
  icon,
  count,
  tone,
  href,
  emptyText,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  tone: "amber" | "blue" | "green" | "neutral";
  href: string;
  emptyText: string;
  children: React.ReactNode;
}) {
  const rows = Array.isArray(children) ? children : [children];
  const hasRows = rows.flat().filter(Boolean).length > 0;
  return (
    <Card>
      <CardContent className="py-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-ecrn-ink">{title}</h2>
            <Badge variant={tone}>{count}</Badge>
          </div>
          <Link href={href} className="text-xs text-slate-500 hover:text-ecrn-ink">
            View all →
          </Link>
        </div>
        {hasRows ? (
          <div className="space-y-1">{children}</div>
        ) : (
          <p className="text-sm text-slate-500 py-3">{emptyText}</p>
        )}
      </CardContent>
    </Card>
  );
}

function QueueRow({
  title,
  subtitle,
  date,
  href,
}: {
  title: string;
  subtitle: string;
  date: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 px-3 py-2.5 -mx-3 rounded-xl hover:bg-slate-50 transition-colors"
    >
      <div className="min-w-0">
        <div className="text-sm font-medium text-ecrn-ink truncate">{title}</div>
        <div className="text-xs text-slate-500 truncate">{subtitle}</div>
      </div>
      <div className="text-[11px] text-slate-400 shrink-0">{relative(date)}</div>
    </Link>
  );
}

function humanize(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function relative(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "1d";
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}mo`;
}
