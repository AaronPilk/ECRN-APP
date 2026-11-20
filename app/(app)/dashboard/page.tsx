import Link from "next/link";
import { BookUser, ChevronRight, FileText, MapPin, Plus, Search, Share2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Page, SectionHeader, EarningsPass, EmptyState } from "@/components/ui/Page";
import { ApplicationStatusBadge } from "@/components/referrals/StatusBadge";
import { ProductTour } from "@/components/tour/ProductTour";
import { getCurrentProfile } from "@/lib/auth/session";
import {
  getReferralPartnerDashboardStats,
  listApplicationsByApplicantEnriched,
  listPayoutsByReferrer,
  listPublicJobs,
} from "@/lib/data/repository";
import { formatCents, isHighPriority, jobLocation, jobPayout, jobSalary, milesBetween } from "@/lib/jobs";
import type { Job, Profile } from "@/types";

/** Same discipline first, then closest, then priority. */
function rankJobs(jobs: Job[], p: Profile): (Job & { miles: number | null })[] {
  const words = (p.discipline ?? "").toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3);
  return jobs
    .map((j) => ({
      ...j,
      miles:
        p.locationLat != null && p.locationLng != null && j.locationLat != null && j.locationLng != null
          ? milesBetween(p.locationLat, p.locationLng, j.locationLat, j.locationLng)
          : null,
    }))
    .sort((a, b) => {
      const s = (j: Job & { miles: number | null }) =>
        (words.some((w) => `${j.title} ${j.trade ?? ""}`.toLowerCase().includes(w)) ? 0 : 10000) +
        (j.miles ?? 5000) -
        (isHighPriority(j) ? 50 : 0);
      return s(a) - s(b);
    });
}

/**
 * One home for every member. Anyone can find a job, apply, or refer; the
 * order of the sections follows what they told us they're here for.
 */
export default async function MemberHome({ searchParams }: { searchParams: Promise<{ tour?: string }> }) {
  const sp = await searchParams;
  const profile = (await getCurrentProfile())!;
  const [stats, jobs, payouts, apps] = await Promise.all([
    getReferralPartnerDashboardStats(profile.id),
    listPublicJobs(),
    listPayoutsByReferrer(profile.id),
    listApplicationsByApplicantEnriched(profile.id),
  ]);
  const ranked = rankJobs(jobs, profile);
  const approved = payouts.filter((p) => p.status === "approved").reduce((s, p) => s + p.amountCents, 0);
  const paid = payouts.filter((p) => p.status === "paid").reduce((s, p) => s + p.amountCents, 0);
  const statusLine =
    approved > 0 ? "Approved for payout" : paid > 0 ? "Paid to date" : stats.totalReferrals > 0 ? "Estimated" : "Refer someone to start earning";
  const jobsFirst = profile.intent === "job" || profile.intent === "open";
  const hasResume = Boolean(profile.resumePath || profile.resumeBuilder.generated);
  const showTour = Boolean(sp.tour) || !profile.tourCompletedAt;

  const earnings = (
    <section key="earn" data-tour="earnings" className="space-y-2">
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
      <div data-tour="refer" className="space-y-1 pt-2">
        <Link href="/referrals/import" className="block">
          <Button fullWidth size="lg">
            <BookUser className="w-5 h-5" /> Refer from my contacts
          </Button>
        </Link>
        <div className="grid grid-cols-2">
          <Link href="/referrals/new" className="flex items-center justify-center gap-2 py-3 text-[14px] font-medium text-ecrn-green-text">
            <Plus className="w-4 h-4" /> Add by hand
          </Link>
          <Link href="/profile#invite" className="flex items-center justify-center gap-2 py-3 text-[14px] font-medium text-ecrn-green-text">
            <Share2 className="w-4 h-4" /> Invite others
          </Link>
        </div>
      </div>
    </section>
  );

  const jobsSection = (
    <section key="jobs" data-tour="jobs">
      <SectionHeader title="Jobs for you" href="/jobs" linkLabel={`All ${jobs.length}`} />
      {ranked.length === 0 ? (
        <EmptyState title="No open roles right now" body="Check back soon." />
      ) : (
        <ul className="divide-y divide-ecrn-line border-y border-ecrn-line">
          {ranked.slice(0, 4).map((j) => (
            <li key={j.id}>
              <Link href={`/jobs/${j.id}`} className="flex items-center gap-3 py-3.5">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-[17px] font-semibold leading-snug text-ecrn-ink">{j.title}</h3>
                  <p className="t-meta mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {jobLocation(j)}
                    {j.miles != null ? ` · ${Math.round(j.miles)} mi` : ""}
                  </p>
                  <p className="mt-1 text-[13px] text-ecrn-secondary">
                    {jobSalary(j) && <span className="font-semibold text-ecrn-ink">{jobSalary(j)}</span>}
                    {jobPayout(j) && (
                      <span className="ml-2 text-cobalt">
                        Refer &amp; earn <span className="font-semibold">{jobPayout(j)}</span>
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
      <Link href="/jobs" className="mt-3 flex items-center justify-center gap-2 h-[44px] rounded-[14px] border border-ecrn-line bg-white text-[14.5px] font-medium text-ecrn-ink">
        <Search className="w-4 h-4" /> Find jobs near me or in another city
      </Link>
    </section>
  );

  return (
    <Page>
      {showTour && <ProductTour firstName={profile.firstName} />}

      <div>
        <p className="t-eyebrow mb-2">Welcome{profile.firstName ? `, ${profile.firstName}` : ""}</p>
        <h1 className="t-page">My dashboard</h1>
        <p className="mt-2 text-[15px] text-ecrn-secondary">Find your next role, or refer people you know and earn.</p>
      </div>

      {profile.careerStatus === "open_to_offers" && (
        <div className="flex gap-3 rounded-[16px] bg-delta-surface px-4 py-3">
          <ShieldCheck className="w-5 h-5 text-cobalt shrink-0 mt-0.5" />
          <p className="text-[13.5px] text-navy">
            <span className="font-semibold">Confidential mode is on.</span> Only Delta recruiters see that you&apos;re open to a move.
          </p>
        </div>
      )}

      {!hasResume && profile.intent !== "refer" && (
        <Link
          href="/profile#resume"
          data-tour="profile"
          className="flex items-center gap-3 rounded-[16px] border border-ecrn-line bg-white px-4 py-3"
        >
          <span className="w-9 h-9 rounded-full bg-ecrn-action-surface grid place-items-center">
            <Sparkles className="w-4 h-4 text-ecrn-green-text" />
          </span>
          <span className="flex-1">
            <span className="block text-[15px] font-semibold text-ecrn-ink">Add your resume</span>
            <span className="block text-[12.5px] text-ecrn-secondary">Upload one or build it with us. Then applying is one tap.</span>
          </span>
          <ChevronRight className="w-4 h-4 text-ecrn-secondary" />
        </Link>
      )}

      {jobsFirst ? [jobsSection, earnings] : [earnings, jobsSection]}

      {apps.length > 0 && (
        <section>
          <SectionHeader title="My applications" href="/candidate/applications" linkLabel="All" />
          <div className="space-y-2">
            {apps.slice(0, 3).map(({ application, job }) => (
              <Link key={application.id} href={`/candidate/applications/${application.id}`} className="flex items-center gap-3 group-surface px-4 py-3">
                <span className="w-9 h-9 rounded-[10px] bg-ecrn-paper border border-ecrn-line grid place-items-center">
                  <FileText className="w-4 h-4 text-ecrn-secondary" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-ecrn-ink truncate">{job.title}</div>
                  <div className="text-[12.5px] text-ecrn-secondary">
                    Applied {new Date(application.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
                <ApplicationStatusBadge status={application.status} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </Page>
  );
}
