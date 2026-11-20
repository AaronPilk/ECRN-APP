import Link from "next/link";
import { ChevronRight, CircleCheck, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { Page, PageTitle, EmptyState } from "@/components/ui/Page";
import { ApplicationStatusBadge } from "@/components/referrals/StatusBadge";
import { getCurrentProfile } from "@/lib/auth/session";
import { listPublicJobs, listApplicationsByApplicantEnriched } from "@/lib/data/repository";
import { isHighPriority, jobLocation, jobSalary, milesBetween } from "@/lib/jobs";
import type { Job, Profile } from "@/types";

/** Rank roles: same discipline first, then closest to the member, then priority. */
function rankJobs(jobs: Job[], p: Profile): Job[] {
  const words = (p.discipline ?? "").toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3);
  const score = (j: Job) => {
    const t = `${j.title} ${j.trade ?? ""}`.toLowerCase();
    const match = words.some((w) => t.includes(w)) ? 0 : 1;
    const dist =
      p.locationLat != null && p.locationLng != null && j.locationLat != null && j.locationLng != null
        ? milesBetween(p.locationLat, p.locationLng, j.locationLat, j.locationLng)
        : 5000;
    return match * 10000 + dist - (isHighPriority(j) ? 50 : 0);
  };
  return [...jobs].sort((a, b) => score(a) - score(b));
}

export default async function CandidateDashboard() {
  const profile = (await getCurrentProfile())!;
  const [jobs, apps] = await Promise.all([listPublicJobs(), listApplicationsByApplicantEnriched(profile.id)]);
  const ranked = rankJobs(jobs, profile);
  const [top, ...more] = ranked;
  const hasResume = Boolean(profile.resumePath);
  const active = apps.filter((a) => !["rejected", "withdrawn", "hired"].includes(a.application.status));

  return (
    <Page>
      <PageTitle eyebrow="Job seeker" title="My dashboard">
        <p className="mt-2 flex items-center gap-1.5 text-[14px] text-ecrn-secondary">
          {[profile.firstName, profile.lastName].filter(Boolean).join(" ")}
          <span aria-hidden>·</span>
          {hasResume ? (
            <span className="inline-flex items-center gap-1">
              <CircleCheck className="w-4 h-4 text-ecrn-green-text" /> Profile ready
            </span>
          ) : (
            <Link href="/candidate/profile#resume" className="text-ecrn-green-text font-medium">
              Add your resume
            </Link>
          )}
        </p>
      </PageTitle>

      {profile.careerStatus === "open_to_offers" && (
        <div className="flex gap-3 rounded-[16px] bg-delta-surface px-4 py-3">
          <ShieldCheck className="w-5 h-5 text-cobalt shrink-0 mt-0.5" />
          <p className="text-[13.5px] text-navy">
            <span className="font-semibold">Confidential mode is on.</span> Only Delta recruiters see that you&apos;re open to
            a move. Your current employer never will.
          </p>
        </div>
      )}

      {!hasResume && (
        <Link href="/candidate/profile#resume" className="flex items-center gap-3 rounded-[16px] border border-ecrn-line bg-white px-4 py-3">
          <span className="w-9 h-9 rounded-full bg-ecrn-action-surface grid place-items-center">
            <Sparkles className="w-4 h-4 text-ecrn-green-text" />
          </span>
          <span className="flex-1">
            <span className="block text-[15px] font-semibold text-ecrn-ink">Upload or build your resume</span>
            <span className="block text-[12.5px] text-ecrn-secondary">Recruiters move faster when it&apos;s on file. About 2 minutes.</span>
          </span>
          <ChevronRight className="w-4 h-4 text-ecrn-secondary" />
        </Link>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="t-section">Suggested roles</h2>
          <Link href="/candidate/jobs" className="inline-flex items-center text-[14px] font-medium text-ecrn-green-text">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {!top ? (
          <EmptyState title="No open roles right now" body="We'll surface roles here as they open." />
        ) : (
          <>
            <Link
              href={`/jobs/${top.id}`}
              className="block rounded-[22px] overflow-hidden text-white shadow-pass"
              style={{ background: "linear-gradient(150deg,#14472F 0%,#0C2F1F 70%,#0A100C 100%)" }}
            >
              <div className="p-5">
                {isHighPriority(top) && (
                  <p className="font-mono text-[11px] text-[#91F9B3] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-ecrn-green" /> High priority
                  </p>
                )}
                <h3 className="font-display mt-2 text-[24px] leading-[26px] font-semibold tracking-tight">{top.title}</h3>
                <p className="mt-2 text-[13.5px] text-white/80">{jobLocation(top)}</p>
              </div>
              <div className="flex items-center justify-between gap-3 px-5 py-3 bg-black/25">
                <div>
                  <div className="t-money text-[18px] font-semibold text-[#91F9B3]">{jobSalary(top)?.replace(/\s*\+.*$/, "") ?? "Competitive"}</div>
                  {jobSalary(top)?.includes("+") && (
                    <div className="text-[11.5px] text-white/70">Plus {jobSalary(top)!.split("+").slice(1).join("+").trim()}</div>
                  )}
                </div>
                <span className="rounded-[12px] bg-gradient-to-b from-ecrn-action-bright to-ecrn-green text-ecrn-action-ink text-[14px] font-semibold px-4 py-2.5 inline-flex items-center gap-1">
                  View role <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
            <ul className="mt-1 divide-y divide-ecrn-line">
              {more.slice(0, 3).map((j) => (
                <li key={j.id}>
                  <Link href={`/jobs/${j.id}`} className="flex items-center gap-3 py-3.5">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[16px] font-semibold text-ecrn-ink">{j.title}</h3>
                      <p className="t-meta">
                        {jobLocation(j)}
                        {jobSalary(j) ? ` · ${jobSalary(j)}` : ""}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-ecrn-green-text" />
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="t-section">My applications</h2>
          <span className="text-[13px] text-ecrn-secondary">{active.length} active</span>
        </div>
        {apps.length === 0 ? (
          <p className="text-[14px] text-ecrn-secondary">You haven&apos;t applied to anything yet.</p>
        ) : (
          <div className="space-y-2">
            {apps.slice(0, 3).map(({ application, job }) => (
              <Link
                key={application.id}
                href={`/candidate/applications/${application.id}`}
                className="flex items-center gap-3 group-surface px-4 py-3"
              >
                <span className="w-9 h-9 rounded-[10px] bg-ecrn-paper border border-ecrn-line grid place-items-center">
                  <FileText className="w-4 h-4 text-ecrn-secondary" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-semibold text-ecrn-ink truncate">{job?.title ?? "Application"}</div>
                  <div className="text-[12.5px] text-ecrn-secondary">
                    Applied {new Date(application.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
                <ApplicationStatusBadge status={application.status} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </Page>
  );
}
