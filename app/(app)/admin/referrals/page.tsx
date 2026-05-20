import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ReferralStatusBadge } from "@/components/referrals/StatusBadge";
import { getCurrentProfile } from "@/lib/auth/mock";
import { listAllReferralsEnriched } from "@/lib/data/repository";
import { Download } from "lucide-react";

interface PageProps {
  searchParams?: { filter?: string };
}

const FILTERS = [
  { key: "all", label: "All referrals" },
  { key: "duplicates", label: "Duplicate review" },
  { key: "primary", label: "Primary only" },
  { key: "active", label: "Active pipeline" },
  { key: "placed", label: "Placed" },
];

export default async function AdminReferralsPage({ searchParams }: PageProps) {
  const profile = (await getCurrentProfile())!;
  if (profile.role !== "admin") redirect("/dashboard");

  const all = await listAllReferralsEnriched();
  const filterKey = searchParams?.filter ?? "all";

  const rows = all.filter(({ referral, candidate }) => {
    if (filterKey === "duplicates")
      return referral.duplicateStatus === "pending_review" || !referral.isPrimary;
    if (filterKey === "primary") return referral.isPrimary;
    if (filterKey === "active")
      return ["new", "contacted", "qualified", "submitted_to_job", "interviewing", "offer_stage"].includes(
        candidate.status
      );
    if (filterKey === "placed")
      return ["placed", "payout_pending", "payout_approved", "payout_paid"].includes(
        candidate.status
      );
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ecrn-ink">
            Referrals
          </h1>
          <p className="mt-1 text-slate-500">
            {rows.length} referral{rows.length === 1 ? "" : "s"} in this view.
          </p>
        </div>
        <Link href="/admin/export/referrals">
          <Button variant="secondary" size="sm">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
        {FILTERS.map((f) => {
          const active = filterKey === f.key;
          const href = f.key === "all" ? "/admin/referrals" : `/admin/referrals?filter=${f.key}`;
          return (
            <Link
              key={f.key}
              href={href}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? "bg-ecrn-black text-white border-ecrn-black"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <Card className="p-10 text-center text-slate-500">
          No referrals match this view.
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200/60">
                <tr>
                  <th className="px-4 py-3">Candidate</th>
                  <th className="px-4 py-3">Referrer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 hidden md:table-cell">Primary?</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Source</th>
                  <th className="px-4 py-3 hidden md:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ referral, candidate, referrer }) => (
                  <tr
                    key={referral.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/candidates/${candidate.id}`}
                        className="font-semibold text-ecrn-ink hover:text-ecrn-green"
                      >
                        {candidate.firstName} {candidate.lastName}
                      </Link>
                      <div className="text-xs text-slate-500 truncate max-w-[260px]">
                        {candidate.currentJobTitle ?? candidate.email ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {referrer
                        ? `${referrer.firstName ?? ""} ${referrer.lastName ?? ""}`.trim() ||
                          referrer.email
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <ReferralStatusBadge status={referral.status} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {referral.isPrimary ? (
                        <span className="text-xs text-emerald-700 font-medium">Primary</span>
                      ) : (
                        <span className="text-xs text-amber-700 font-medium">
                          Duplicate attempt
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-700 capitalize">
                      {referral.referralSource?.replace(/_/g, " ") ?? "manual"}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-500 text-xs">
                      {referral.createdAt.slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
