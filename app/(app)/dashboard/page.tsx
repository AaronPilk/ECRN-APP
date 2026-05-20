import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AddToHomeScreenGuide } from "@/components/onboarding/AddToHomeScreenGuide";
import { getCurrentProfile } from "@/lib/auth/mock";
import {
  getReferralPartnerDashboardStats,
  listPublicJobs,
} from "@/lib/data/repository";
import { Plus, Briefcase, Share2 } from "lucide-react";

/**
 * Referral partner dashboard.
 *
 * Batch 1 ships the scaffold: greeting, stats grid (zeroed out for a brand
 * new account), open-jobs preview, and primary CTAs. Real referral CRUD
 * comes in Batch 2.
 */
export default async function ReferralPartnerDashboard() {
  // Layout already verified profile — non-null here
  const profile = (await getCurrentProfile())!;
  const stats = await getReferralPartnerDashboardStats(profile.id);
  const jobs = (await listPublicJobs()).slice(0, 3);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div>
        <p className="text-xs font-medium tracking-[0.18em] uppercase text-slate-500">
          Referral Partner
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-delta-ink">
          Hey {profile.firstName ?? "there"} 👋
        </h1>
        <p className="mt-1 text-slate-500">
          Your network in construction has value. Let&apos;s put it to work.
        </p>
      </div>

      <AddToHomeScreenGuide />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total referrals" value={stats.totalReferrals} />
        <StatCard label="Active" value={stats.activeReferrals} />
        <StatCard label="Placements" value={stats.placements} />
        <StatCard
          label="Estimated earnings"
          value={formatCents(stats.estimatedEarningsCents)}
        />
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-3 gap-3">
        <ActionCard
          icon={<Plus className="w-5 h-5" />}
          title="Add a referral"
          body="Upload someone you know in the trade."
          href="/referrals/new"
          accent
        />
        <ActionCard
          icon={<Briefcase className="w-5 h-5" />}
          title="Browse open jobs"
          body={`${stats.openJobsCount} roles available right now.`}
          href="/jobs"
        />
        <ActionCard
          icon={<Share2 className="w-5 h-5" />}
          title="Invite others"
          body="Share your ambassador link."
          href="/profile#invite"
        />
      </div>

      {/* Open jobs preview */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold tracking-tight text-delta-ink">Open jobs</h2>
          <Link
            href="/jobs"
            className="text-sm font-medium text-delta-ink hover:underline"
          >
            See all →
          </Link>
        </div>
        <div className="space-y-3">
          {jobs.length === 0 && (
            <Card>
              <CardContent>
                <p className="text-sm text-slate-500">No open roles right now. Check back soon.</p>
              </CardContent>
            </Card>
          )}
          {jobs.map((j) => (
            <Card key={j.id} className="hover:shadow-float transition-shadow">
              <CardContent className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-[15px] font-semibold text-delta-ink truncate">{j.title}</h3>
                    {j.urgency === "critical" && <Badge variant="red">Urgent</Badge>}
                    {j.urgency === "high" && <Badge variant="amber">High priority</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {[j.locationCity, j.locationState].filter(Boolean).join(", ")} ·{" "}
                    {j.compensationDisplay ?? "Competitive"}
                  </p>
                  {j.referralPayoutDisplay && (
                    <p className="mt-1 text-xs text-emerald-700 font-medium">
                      Referral payout: {j.referralPayoutDisplay}
                    </p>
                  )}
                </div>
                <Link href={`/jobs/${j.id}`} className="shrink-0">
                  <Button size="sm" variant="secondary">
                    View
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <BuildPhaseNotice />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-delta-ink">{value}</div>
    </Card>
  );
}

function ActionCard({
  icon,
  title,
  body,
  href,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  href: string;
  accent?: boolean;
}) {
  return (
    <Link href={href}>
      <Card
        className={`h-full p-5 hover:shadow-float transition-all ${
          accent ? "bg-delta-navy text-white border-delta-navy" : ""
        }`}
      >
        <div
          className={`w-9 h-9 rounded-xl grid place-items-center ${
            accent ? "bg-ecrn-amber text-delta-ink" : "bg-slate-100 text-delta-ink"
          }`}
        >
          {icon}
        </div>
        <h3 className={`mt-3 text-[15px] font-semibold ${accent ? "text-white" : "text-delta-ink"}`}>
          {title}
        </h3>
        <p className={`mt-1 text-sm ${accent ? "text-slate-300" : "text-slate-500"}`}>{body}</p>
      </Card>
    </Link>
  );
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function BuildPhaseNotice() {
  return (
    <Card className="p-4 border-dashed border-slate-300 bg-slate-50/60">
      <p className="text-xs text-slate-600 leading-relaxed">
        <strong className="text-delta-ink">Batch 1 of 8 shipped.</strong> Account creation,
        role-based navigation, the app shell and the PWA scaffold are live. Batches 2+ will fill in
        the actual referral creation, job application, admin CRUD, and payout ledger flows on top
        of this foundation.
      </p>
    </Card>
  );
}
