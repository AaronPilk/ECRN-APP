import Link from "next/link";
import { Plus, BookUser, Share2, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Page, PageTitle, SectionHeader, EarningsPass, EmptyState } from "@/components/ui/Page";
import { getCurrentProfile } from "@/lib/auth/session";
import { getReferralPartnerDashboardStats, listPublicJobs, listPayoutsByReferrer } from "@/lib/data/repository";
import { formatCents, jobLocation, jobPayout, jobSalary } from "@/lib/jobs";

/** Referral partner home (rev 03 "My dashboard"). */
export default async function ReferralPartnerDashboard() {
  const profile = (await getCurrentProfile())!;
  const [stats, jobs, payouts] = await Promise.all([
    getReferralPartnerDashboardStats(profile.id),
    listPublicJobs(),
    listPayoutsByReferrer(profile.id),
  ]);
  const approved = payouts.filter((p) => p.status === "approved").reduce((s, p) => s + p.amountCents, 0);
  const paid = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amountCents, 0);
  const statusLine =
    approved > 0 ? "Approved for payout" : paid > 0 ? "Paid to date" : stats.placements > 0 ? "Estimated" : "Refer someone to start earning";

  return (
    <Page>
      <PageTitle eyebrow="Referral partner" title="My dashboard" />

      <EarningsPass
        label="Referral earnings"
        amount={formatCents(stats.estimatedEarningsCents)}
        status={statusLine}
        stats={[
          { label: "Referrals", value: stats.totalReferrals },
          { label: "Active", value: stats.activeReferrals },
          { label: "Placements", value: stats.placements },
        ]}
      />

      <div className="space-y-2">
        <Link href="/referrals/new" className="block">
          <Button fullWidth size="lg">
            <Plus className="w-5 h-5" /> Add a referral
          </Button>
        </Link>
        <div className="grid grid-cols-2">
          <Link href="/referrals/import" className="flex items-center justify-center gap-2 py-3 text-[14px] font-medium text-ecrn-green-text">
            <BookUser className="w-4 h-4" /> From contacts
          </Link>
          <Link href="/profile#invite" className="flex items-center justify-center gap-2 py-3 text-[14px] font-medium text-ecrn-green-text">
            <Share2 className="w-4 h-4" /> Invite others
          </Link>
        </div>
      </div>

      <section className="border-t border-ecrn-line pt-5">
        <SectionHeader title="Open jobs" href="/jobs" linkLabel={`View all ${jobs.length}`} />
        {jobs.length === 0 ? (
          <EmptyState title="No open roles right now" body="Check back soon." />
        ) : (
          <ul className="divide-y divide-ecrn-line">
            {jobs.slice(0, 4).map((j) => (
              <li key={j.id}>
                <Link href={`/jobs/${j.id}`} className="flex items-center gap-3 py-3.5">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-[17px] font-semibold leading-snug text-ecrn-ink">{j.title}</h3>
                    <p className="t-meta mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {jobLocation(j)}
                      {j.jobType ? ` · ${j.jobType}` : ""}
                    </p>
                    <p className="mt-1 text-[13px] text-ecrn-secondary">
                      {jobSalary(j) && (
                        <>
                          Salary <span className="font-semibold text-ecrn-ink">{jobSalary(j)}</span>
                        </>
                      )}
                      {jobPayout(j) && (
                        <span className="ml-2 text-cobalt">
                          Est. referral <span className="font-semibold">{jobPayout(j)}</span>
                        </span>
                      )}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ecrn-secondary shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Page>
  );
}
