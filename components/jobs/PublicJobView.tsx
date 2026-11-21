import Link from "next/link";
import { ChevronLeft, MapPin, UserPlus } from "lucide-react";
import type { Job } from "@/types";
import { cn } from "@/lib/utils/cn";
import { ArrowLink, Container, DELTA, DeltaBadge, DeltaMark } from "@/components/site/Blocks";
import { SiteImage } from "@/components/site/SiteImage";
import { Parallax, siteVars } from "@/components/site/motion";
import { DeltaNote } from "@/components/site/inner/Kit";
import { isHighPriority, jobLocation } from "@/lib/jobs";

/** Apply and refer. Both go to sign-up for visitors (a free account is required). */
function Actions({ loginHref, stacked = false }: { loginHref: string; stacked?: boolean }) {
  return (
    <div>
      <div className={stacked ? "grid gap-2" : "grid grid-cols-2 gap-2"}>
        <Link href="/signup" className="inner-action inner-action-dark">
          Apply directly
        </Link>
        <Link href="/signup" className="inner-action inner-action-green">
          {/* Below 380 px the two buttons share 312 px: the label alone fits, the icon would not. */}
          <UserPlus aria-hidden className={cn("h-4 w-4 shrink-0", !stacked && "max-[379px]:hidden")} />
          Refer someone
        </Link>
      </div>
      <p className="mt-0.5 flex flex-wrap items-center justify-center gap-x-1 text-[13px] text-ecrn-secondary">
        Free account required.
        <Link href={loginHref} className="inline-flex min-h-11 items-center px-1 font-semibold text-ecrn-green-text underline underline-offset-2">
          Log in
        </Link>
      </p>
    </div>
  );
}

/**
 * A job as visitors see it on the public site: a dark hero under the glass
 * header, the key facts on a card that overlaps it, the description at a
 * reading size, and the two actions docked to the bottom of the screen on
 * phones (sticky inside the job, so they never cover the footer).
 * Members see the app layout in app/jobs/[id]/page.tsx instead.
 */
export function PublicJobView({
  job,
  payout,
  salaryMain,
  salaryExtra,
}: {
  job: Job;
  payout: string | null;
  salaryMain?: string;
  salaryExtra?: string;
}) {
  const client = job.isCompanyPublic && job.companyName ? job.companyName : "a confidential client";
  const loginHref = `/login?next=/jobs/${job.id}`;
  const urgent = isHighPriority(job);

  const facts: { label: string; value: string; extra?: string; accent?: boolean }[] = [
    { label: "Annual salary", value: salaryMain ?? "Competitive", extra: salaryExtra },
    ...(payout ? [{ label: "Estimated referral reward", value: payout, accent: true }] : []),
    ...(job.jobType ? [{ label: "Job type", value: job.jobType }] : []),
  ];

  return (
    <>
      <section data-site-hero className="site-tone-dark relative isolate overflow-clip bg-ecrn-black">
        <Parallax from="top" speed={0.2} className="absolute inset-0 -z-20">
          <SiteImage name="hero-jobsite-dusk" fill priority sizes="(max-width: 767px) 160vw, 100vw" />
        </Parallax>
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(10,16,12,0.74)_0%,rgba(10,16,12,0.84)_45%,rgba(10,16,12,0.95)_100%)]"
        />
        <Container className="pb-20 pt-[calc(var(--site-header-total)+0.75rem)] sm:pb-24 sm:pt-[calc(var(--site-header-total)+1.5rem)] lg:pb-32">
          <Link
            href="/jobs"
            className="-ml-2.5 inline-flex min-h-11 items-center gap-1 rounded-full px-2.5 font-display text-[15px] font-medium text-white/[0.86] active:opacity-60"
          >
            <ChevronLeft aria-hidden className="h-4 w-4" /> All open roles
          </Link>
          <div className="mt-5">
            <DeltaBadge href="/about" className="site-enter" />
          </div>
          {urgent ? (
            <p className="site-enter mt-7 flex items-center gap-2 font-display text-[13px] font-semibold text-[#91F9B3]" style={siteVars({ i: 1 })}>
              <span aria-hidden className="site-live-dot" />
              {job.urgency === "critical" ? "Urgent" : "High priority"}
            </p>
          ) : null}
          <h1 className={cn("site-display-2 site-enter max-w-3xl", urgent ? "mt-3" : "mt-7")} style={siteVars({ i: 2 })}>
            {job.title}
          </h1>
          <p className="site-enter mt-4 flex items-start gap-1.5 text-[16px] leading-snug text-white/[0.86]" style={siteVars({ i: 3 })}>
            <MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {jobLocation(job)}
              {job.jobType ? ` · ${job.jobType}` : ""}
            </span>
          </p>
        </Container>
      </section>

      <div className="site-tone-light bg-ecrn-paper">
        <Container className="pb-14 sm:pb-20 lg:pb-24">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">
            {/* Key facts: first on phones (a sheet over the hero), the sticky right column on desktop. */}
            <aside
              aria-label="Key facts"
              className="relative z-[1] -mt-12 lg:sticky lg:top-[calc(var(--site-header-total)+1.5rem)] lg:col-start-2 lg:row-start-1 lg:-mt-24 lg:self-start"
            >
              <div className="site-card rounded-[24px] p-5 sm:p-6">
                <dl>
                  {facts.map((f, i) => (
                    <div key={f.label} className={cn("flex items-baseline justify-between gap-4 py-3.5", i > 0 && "border-t border-ecrn-line", i === 0 && "pt-1")}>
                      <dt className="text-[14.5px] leading-snug text-ecrn-secondary">{f.label}</dt>
                      <dd className="text-right">
                        <span className={cn("font-display text-[19px] font-semibold tracking-[-0.02em] tabular-nums", f.accent ? "text-cobalt" : "text-ecrn-ink")}>
                          {f.value}
                        </span>
                        {f.extra ? <span className="block text-[13px] text-ecrn-secondary">+ {f.extra}</span> : null}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-2 flex items-start gap-3 rounded-[16px] bg-delta-surface px-4 py-3.5">
                  <DeltaMark className="mt-0.5 h-5" />
                  <p className="text-[14px] leading-snug text-navy/80">
                    <span className="block font-display text-[15px] font-semibold text-navy">{DELTA.name}</span>
                    Recruiting for {client}
                  </p>
                </div>
                <div className="mt-5 hidden lg:block">
                  <Actions loginHref={loginHref} stacked />
                </div>
              </div>
            </aside>

            <div className="min-w-0 lg:col-start-1 lg:row-start-1 lg:pt-14">
              {job.description ? (
                <section aria-labelledby="role-title">
                  <h2 id="role-title" className="inner-h2-sm">
                    About the role
                  </h2>
                  <p className="mt-3 whitespace-pre-line text-pretty text-[17px] leading-[1.65] text-[#3A4841]">{job.description}</p>
                </section>
              ) : null}
              {job.requirements ? (
                <section aria-labelledby="req-title" className={job.description ? "mt-10" : undefined}>
                  <h2 id="req-title" className="inner-h2-sm">
                    Requirements
                  </h2>
                  <p className="mt-3 whitespace-pre-line text-pretty text-[17px] leading-[1.65] text-[#3A4841]">{job.requirements}</p>
                </section>
              ) : null}

              <div className="site-card mt-10 rounded-[24px] p-5 sm:p-6">
                <h2 className="font-display text-[19px] font-semibold leading-snug tracking-[-0.02em] text-ecrn-ink">Know someone for this role?</h2>
                <p className="mt-1.5 text-pretty text-[15.5px] leading-[1.55] text-ecrn-secondary">
                  Refer them from your phone&apos;s contacts. If Delta places them and they complete the guarantee period, you earn the
                  referral reward, confirmed in writing before payout.
                </p>
                <ArrowLink href="/referral-rewards" className="mt-1">
                  How referral rewards work
                </ArrowLink>
              </div>
            </div>
          </div>

          <DeltaNote className="mt-14 sm:mt-20" />
        </Container>

        {/* Phones: the actions stay in reach while reading and park at the end of the job. */}
        <div className="sticky bottom-0 z-30 border-t border-ecrn-line bg-ecrn-paper/90 backdrop-blur-xl backdrop-saturate-150 lg:hidden">
          <Container className="pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-3">
            <Actions loginHref={loginHref} />
          </Container>
        </div>
      </div>
    </>
  );
}
