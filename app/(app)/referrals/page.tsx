import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ReferralStatusBadge } from "@/components/referrals/StatusBadge";
import { getCurrentProfile } from "@/lib/auth/mock";
import { listReferralsByReferrerEnriched } from "@/lib/data/repository";
import { Plus, Users } from "lucide-react";

interface PageProps {
  searchParams?: { status?: string };
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "in_process", label: "In process" },
  { key: "placed", label: "Placed" },
] as const;

export default async function ReferralsPage({ searchParams }: PageProps) {
  const profile = (await getCurrentProfile())!;
  const items = await listReferralsByReferrerEnriched(profile.id);

  const filterKey = (searchParams?.status as (typeof FILTERS)[number]["key"]) ?? "all";

  const filtered = items.filter(({ candidate }) => {
    const s = candidate.status;
    if (filterKey === "all") return true;
    if (filterKey === "active")
      return !["rejected", "inactive", "not_qualified"].includes(s);
    if (filterKey === "in_process")
      return ["contacted", "qualified", "submitted_to_job", "interviewing", "offer_stage"].includes(s);
    if (filterKey === "placed")
      return ["placed", "payout_pending", "payout_approved", "payout_paid"].includes(s);
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ecrn-ink">
            My referrals
          </h1>
          <p className="mt-1 text-slate-500">
            {items.length} {items.length === 1 ? "referral" : "referrals"} in your network.
          </p>
        </div>
        <Link href="/referrals/new">
          <Button size="sm" variant="primary" className="shrink-0">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add referral</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
        {FILTERS.map((f) => {
          const active = filterKey === f.key;
          const href = f.key === "all" ? "/referrals" : `/referrals?status=${f.key}`;
          return (
            <Link
              key={f.key}
              href={href}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors ${
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

      {filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 grid place-items-center mb-4">
            <Users className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-ecrn-ink">
            {items.length === 0 ? "No referrals yet" : "No referrals match this filter"}
          </h3>
          <p className="mt-1.5 text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            {items.length === 0
              ? "Add the people you know in the construction industry. We&apos;ll track them through to placement."
              : "Try a different filter to see more of your network."}
          </p>
          {items.length === 0 && (
            <Link href="/referrals/new" className="inline-block mt-5">
              <Button variant="dark" size="md">
                <Plus className="w-4 h-4" /> Add your first referral
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ referral, candidate }) => (
            <Link key={referral.id} href={`/referrals/${referral.id}`}>
              <Card className="hover:shadow-float hover:border-ecrn-green/40 transition-all">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[15px] font-semibold text-ecrn-ink">
                          {candidate.firstName} {candidate.lastName}
                        </h3>
                        <ReferralStatusBadge status={candidate.status} />
                        {!referral.isPrimary && (
                          <span className="text-[10px] uppercase tracking-wide text-amber-700 font-medium">
                            Duplicate attempt
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-slate-500 truncate">
                        {candidate.currentJobTitle ?? "—"}
                        {candidate.locationCity && (
                          <>
                            {" · "}
                            {candidate.locationCity}
                            {candidate.locationState && `, ${candidate.locationState}`}
                          </>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Referred {formatRelative(referral.createdAt)}
                      </p>
                    </div>
                    <div className="text-slate-300 text-lg shrink-0">›</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const days = Math.floor((now - then) / (1000 * 60 * 60 * 24));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} ${Math.floor(days / 7) === 1 ? "week" : "weeks"} ago`;
  return `${Math.floor(days / 30)} ${Math.floor(days / 30) === 1 ? "month" : "months"} ago`;
}
