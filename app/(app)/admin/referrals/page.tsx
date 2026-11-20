import Link from "next/link";
import { Download, Search } from "lucide-react";
import {
  AdminHeader,
  AdminPage,
  DataTable,
  EmptyState,
  FilterTabs,
  Notice,
  Panel,
  Pill,
  StatCard,
  fmtDate,
  fmtNum,
  fmtPct,
  tdClass,
} from "@/components/admin/ui";
import { Donut } from "@/components/admin/charts";
import { Button } from "@/components/ui/Button";
import { ReferralStatusBadge } from "@/components/referrals/StatusBadge";
import { getStaffMap, staffName } from "@/lib/admin/staff";
import { requireAdmin } from "@/lib/auth/session";
import { listAllReferralsEnriched, type ReferralEnriched } from "@/lib/data/repository";
import type { Profile, Referral, ReferralStatus, Staff } from "@/types";
import { reassignPrimaryReferrerAction } from "../actions";

interface PageProps {
  searchParams: Promise<{ filter?: string; q?: string }>;
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "review", label: "Needs review" },
  { key: "duplicates", label: "All duplicates" },
  { key: "primary", label: "Primary only" },
  { key: "active", label: "Active pipeline" },
  { key: "placed", label: "Placed" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

const ACTIVE: ReferralStatus[] = ["new", "contacted", "qualified", "submitted_to_job", "interviewing", "offer_stage"];
const PLACED: ReferralStatus[] = ["placed", "payout_pending", "payout_approved", "payout_paid"];

/** Rows rendered at once. The CSV export always has everything. */
const MAX_ROWS = 300;

const needsReview = (r: ReferralEnriched) => r.referral.duplicateStatus === "pending_review";

function matches(row: ReferralEnriched, filter: FilterKey): boolean {
  const { referral, candidate } = row;
  switch (filter) {
    case "review":
      return needsReview(row);
    case "duplicates":
      return needsReview(row) || !referral.isPrimary;
    case "primary":
      return referral.isPrimary;
    case "active":
      return referral.isPrimary && ACTIVE.includes(candidate.status);
    case "placed":
      return referral.isPrimary && PLACED.includes(candidate.status);
    default:
      return true;
  }
}

function memberName(p: Profile | null): string {
  if (!p) return "Unknown member";
  return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || p.email;
}

/** Who gets credit for the person, in plain words. */
function credit(referral: Referral): { label: string; tone: "green" | "blue" | "amber" | "neutral" } {
  if (referral.duplicateStatus === "pending_review") return { label: "Needs review", tone: "amber" };
  if (referral.isPrimary) {
    return referral.duplicateStatus === "overridden_primary"
      ? { label: "Primary, reassigned", tone: "blue" }
      : { label: "Primary", tone: "green" };
  }
  if (referral.duplicateStatus === "confirmed_duplicate") return { label: "Duplicate", tone: "neutral" };
  return { label: "Not credited", tone: "neutral" };
}

function StaffCell({ id, staff }: { id: string | null; staff: Map<string, Staff> }) {
  if (!id) return <span className="text-ecrn-secondary/70">Unassigned</span>;
  return <span className="text-ecrn-ink">{staffName(staff.get(id))}</span>;
}

export default async function AdminReferralsPage(props: PageProps) {
  await requireAdmin();
  const sp = await props.searchParams;
  const [all, staff] = await Promise.all([listAllReferralsEnriched(), getStaffMap()]);

  const filter: FilterKey = FILTERS.some((f) => f.key === sp.filter) ? (sp.filter as FilterKey) : "all";
  const q = (sp.q ?? "").trim().toLowerCase();

  const searched = q
    ? all.filter(({ candidate, referrer }) =>
        [
          `${candidate.firstName} ${candidate.lastName}`,
          candidate.email,
          candidate.phone,
          candidate.currentJobTitle,
          referrer ? memberName(referrer) : null,
          referrer?.email,
        ].some((v) => v && v.toLowerCase().includes(q))
      )
    : all;
  const rows = searched.filter((r) => matches(r, filter));
  const shown = rows.slice(0, MAX_ROWS);

  // The member currently credited with each person, for the duplicate review.
  const creditedByCandidate = new Map<string, Profile | null>();
  for (const r of all) if (r.referral.isPrimary) creditedByCandidate.set(r.candidate.id, r.referrer);

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = all.filter((r) => new Date(r.referral.createdAt).getTime() >= weekAgo).length;
  const reviewCount = all.filter(needsReview).length;
  const primaryCount = all.filter((r) => r.referral.isPrimary).length;
  const activeCount = all.filter((r) => matches(r, "active")).length;
  const placedCount = all.filter((r) => matches(r, "placed")).length;
  const referringMembers = new Set(all.map((r) => r.referral.referrerUserId)).size;

  // Chart data. Stages count each person once (their primary referral).
  const stageCount = (statuses: ReferralStatus[]) =>
    all.filter((r) => r.referral.isPrimary && statuses.includes(r.candidate.status)).length;
  const bySource = new Map<string, number>();
  for (const r of all) {
    const label = sourceLabel(r.referral.referralSource);
    bySource.set(label, (bySource.get(label) ?? 0) + 1);
  }
  const sourceSlices = [...bySource.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);

  const hrefFor = (key: FilterKey) => {
    const params = new URLSearchParams();
    if (key !== "all") params.set("filter", key);
    if (q) params.set("q", sp.q!.trim());
    const qs = params.toString();
    return qs ? `/admin/referrals?${qs}` : "/admin/referrals";
  };

  return (
    <AdminPage>
      <AdminHeader
        eyebrow="Pipeline"
        title="Referrals"
        subtitle="Every person a member has referred, who sent them, and which account manager and recruiter own them."
        actions={
          <a
            href="/admin/export/referrals"
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-[12px] border border-ecrn-line bg-white text-sm font-medium text-ecrn-ink hover:bg-ecrn-paper"
          >
            <Download className="w-4 h-4" /> Export CSV
          </a>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Referrals" value={fmtNum(all.length)} hint={`${fmtNum(thisWeek)} in the last 7 days`} />
        <StatCard
          label="Needs review"
          value={fmtNum(reviewCount)}
          hint="Possible duplicates"
          tone={reviewCount > 0 ? "amber" : "default"}
          href="/admin/referrals?filter=review"
        />
        <StatCard
          label="Active pipeline"
          value={fmtNum(activeCount)}
          hint="New through offer stage"
          tone="cobalt"
          href="/admin/referrals?filter=active"
        />
        <StatCard
          label="Placed"
          value={fmtNum(placedCount)}
          hint={primaryCount > 0 ? `${fmtPct(placedCount, primaryCount)} of people referred` : "No referrals yet"}
          tone="green"
          href="/admin/referrals?filter=placed"
        />
        <StatCard label="Referring members" value={fmtNum(referringMembers)} hint="Sent at least one referral" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Where referred people stand" subtitle="One slice per person, by the stage they are in now">
          <Donut
            data={[
              { label: "New", value: stageCount(["submitted", "new"]), color: "#94A3B8" },
              {
                label: "In process",
                value: stageCount(["contacted", "qualified", "submitted_to_job", "interviewing", "offer_stage"]),
                color: "#0655CE",
              },
              { label: "Placed", value: placedCount, color: "#16C172" },
              { label: "Not moving forward", value: stageCount(["not_qualified", "rejected", "inactive"]), color: "#EF4444" },
            ]}
            centerLabel={primaryCount === 1 ? "person" : "people"}
            emptyLabel="No referrals yet"
          />
        </Panel>
        <Panel title="How referrals came in" subtitle="Every referral, including duplicates">
          <Donut
            data={sourceSlices}
            centerLabel={all.length === 1 ? "referral" : "referrals"}
            emptyLabel="No referrals yet"
          />
        </Panel>
      </div>

      {reviewCount > 0 && filter !== "review" && (
        <Notice tone="amber">
          {reviewCount === 1 ? "1 referral looks" : `${fmtNum(reviewCount)} referrals look`} like someone already in the
          network. The first referrer keeps the credit unless you change it.{" "}
          <Link href="/admin/referrals?filter=review" className="font-medium underline underline-offset-2">
            Review now
          </Link>
        </Notice>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          tabs={FILTERS.map((f) => ({
            label: f.label,
            href: hrefFor(f.key),
            active: filter === f.key,
            count: searched.filter((r) => matches(r, f.key)).length,
          }))}
        />
        <form method="get" action="/admin/referrals" className="flex items-center gap-2">
          {filter !== "all" && <input type="hidden" name="filter" value={filter} />}
          <div className="relative">
            <Search className="w-4 h-4 text-ecrn-secondary absolute left-3 top-1/2 -translate-y-1/2" aria-hidden />
            <input
              type="search"
              name="q"
              defaultValue={sp.q ?? ""}
              placeholder="Search name, email, referrer"
              aria-label="Search referrals"
              className="h-9 w-[240px] max-w-full pl-9 pr-3 rounded-[12px] bg-white border border-ecrn-line text-[13.5px] text-ecrn-ink placeholder:text-ecrn-secondary/60 focus:outline-none focus:border-ecrn-green focus:ring-2 focus:ring-ecrn-green/20"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary">
            Search
          </Button>
          {q && (
            <Link
              href={filter === "all" ? "/admin/referrals" : `/admin/referrals?filter=${filter}`}
              className="text-[13px] text-ecrn-secondary hover:text-ecrn-ink"
            >
              Clear
            </Link>
          )}
        </form>
      </div>

      <DataTable
        head={["Candidate", "Referred by", "Status", "Credit", "Account manager", "Recruiter", "Source", "Submitted", "Review"]}
        empty={
          rows.length === 0 ? (
            all.length === 0 ? (
              <EmptyState
                title="No referrals yet"
                body="When a member refers someone, the referral shows up here with who sent it and who owns the candidate."
              />
            ) : (
              <EmptyState
                title="Nothing in this view"
                body={q ? "No referral matches that search. Try a different name or clear the search." : "No referral matches this filter right now."}
                action={
                  <Link href="/admin/referrals" className="text-[13.5px] font-medium text-ecrn-green-text hover:underline">
                    Show all referrals
                  </Link>
                }
              />
            )
          ) : undefined
        }
      >
        {shown.map((row) => {
          const { referral, candidate, referrer } = row;
          const c = credit(referral);
          // A primary referral follows the candidate; a duplicate keeps its own status.
          const status = referral.isPrimary ? candidate.status : referral.status;
          const credited = creditedByCandidate.get(candidate.id);
          const reason = typeof referral.metadata.duplicate_reason === "string" ? referral.metadata.duplicate_reason : null;
          return (
            <tr key={referral.id} className="hover:bg-ecrn-paper/60">
              <td className={tdClass}>
                <Link href={`/admin/candidates/${candidate.id}`} className="font-medium text-ecrn-ink hover:text-ecrn-green-text">
                  {candidate.firstName} {candidate.lastName}
                </Link>
                <div className="text-[12px] text-ecrn-secondary truncate max-w-[240px]">
                  {candidate.currentJobTitle ?? candidate.email ?? candidate.phone ?? "No details yet"}
                </div>
              </td>
              <td className={tdClass}>
                <div className="text-ecrn-ink">{memberName(referrer)}</div>
                {referrer?.email && memberName(referrer) !== referrer.email && (
                  <div className="text-[12px] text-ecrn-secondary truncate max-w-[220px]">{referrer.email}</div>
                )}
              </td>
              <td className={tdClass}>
                <ReferralStatusBadge status={status} />
              </td>
              <td className={tdClass}>
                <Pill tone={c.tone}>{c.label}</Pill>
              </td>
              <td className={`${tdClass} whitespace-nowrap`}>
                <StaffCell id={candidate.accountManagerId} staff={staff} />
              </td>
              <td className={`${tdClass} whitespace-nowrap`}>
                <StaffCell id={candidate.recruiterId} staff={staff} />
              </td>
              <td className={`${tdClass} text-ecrn-secondary whitespace-nowrap`}>{sourceLabel(referral.referralSource)}</td>
              <td className={`${tdClass} text-ecrn-secondary whitespace-nowrap`}>{fmtDate(referral.createdAt)}</td>
              <td className={tdClass}>
                {needsReview(row) ? (
                  <div className="min-w-[200px] space-y-1.5">
                    <p className="text-[12px] text-ecrn-secondary">
                      {reason ? `Matched on ${reason.replace(/_/g, " + ")}. ` : ""}
                      Credited now: {credited ? memberName(credited) : "nobody"}.
                    </p>
                    <div className="flex items-center gap-2">
                      <form action={reassignPrimaryReferrerAction}>
                        <input type="hidden" name="candidateId" value={candidate.id} />
                        <input type="hidden" name="referrerProfileId" value={referral.referrerUserId} />
                        <Button type="submit" size="sm" variant="secondary" className="h-8 px-3 text-[12.5px]">
                          Make primary
                        </Button>
                      </form>
                      <Link
                        href={`/admin/candidates/${candidate.id}`}
                        className="text-[12.5px] font-medium text-ecrn-green-text hover:underline"
                      >
                        Open candidate
                      </Link>
                    </div>
                  </div>
                ) : (
                  <span className="text-ecrn-secondary/60">—</span>
                )}
              </td>
            </tr>
          );
        })}
      </DataTable>

      {rows.length > shown.length && (
        <p className="text-[12.5px] text-ecrn-secondary">
          Showing the newest {fmtNum(shown.length)} of {fmtNum(rows.length)}. Search or filter to narrow the list, or export the CSV for everything.
        </p>
      )}
    </AdminPage>
  );
}

function sourceLabel(source: string | null): string {
  switch (source) {
    case "contacts":
      return "Contact import";
    case "job_link":
      return "Job link";
    case "manual":
    case null:
      return "Added by hand";
    default:
      return source.replace(/_/g, " ");
  }
}
