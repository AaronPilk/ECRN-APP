import "@/components/site/inner/inner.css";
import { ArrowRight } from "lucide-react";
import { Page } from "@/components/ui/Page";
import { JobsBrowser } from "@/components/jobs/JobsBrowser";
import { ArrowLink, CtaLink, FinalCta, PageHero } from "@/components/site/Blocks";
import { JsonLd } from "@/components/site/SiteChrome";
import { Band, Crumbs, DeltaNote } from "@/components/site/inner/Kit";
import { listPublicJobs } from "@/lib/data/repository";
import { getCurrentProfile } from "@/lib/auth/session";
import { breadcrumbJsonLd, pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Electrical Construction Jobs Near You | ECRN",
  description:
    "Open electrical construction jobs for PMs, estimators, superintendents and engineers. Search near you or by city, apply in one tap, or refer someone.",
  path: "/jobs",
});

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Jobs", path: "/jobs" },
];

export default async function JobsPage() {
  const [jobs, profile] = await Promise.all([listPublicJobs(), getCurrentProfile()]);
  const origin =
    profile?.locationLat != null && profile?.locationLng != null
      ? {
          lat: profile.locationLat,
          lng: profile.locationLng,
          label: [profile.locationCity, profile.locationState].filter(Boolean).join(", ") || "your city",
        }
      : null;

  // Members see the board inside the app shell, in the app's own look.
  if (profile) {
    return (
      <Page wide={!profile}>
        <JobsBrowser jobs={jobs} detailBase="/jobs" showReferral initialOrigin={origin} heading="Open jobs" />
      </Page>
    );
  }

  const count = jobs.length;
  const intro =
    count > 0
      ? `${count} open role${count === 1 ? "" : "s"} recruited by Delta Construction Partners. Apply in one tap with a free ECRN account, or refer someone you know and earn up to $10,000 if they're hired.`
      : "Roles recruited by Delta Construction Partners appear here as they open. Apply in one tap with a free ECRN account, or refer someone you know and earn up to $10,000 if they're hired.";

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <PageHero eyebrow="Open roles" title="Electrical construction jobs" image="crew-on-lift" intro={<p>{intro}</p>} />

      <Crumbs items={CRUMBS} />

      <Band first labelledBy="jobs-list-title">
        <JobsBrowser variant="site" jobs={jobs} detailBase="/jobs" showReferral initialOrigin={origin} />
      </Band>

      {/* For people who know someone better suited than they are, then who does the recruiting. */}
      <Band tone="white" className="border-t border-ecrn-line" labelledBy="refer-title">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-6">
          <div className="site-card flex flex-col rounded-[24px] p-6 sm:p-8">
            <h2 id="refer-title" className="inner-h2-sm">
              Know someone for one of these roles?
            </h2>
            <p className="inner-body mt-3">
              Refer them from your phone&apos;s contacts. If Delta places them and they complete the guarantee period, you can earn up to
              $10,000, depending on the role.
            </p>
            <CtaLink href="/signup" className="mt-6 w-full sm:w-auto sm:self-start">
              Start referring <ArrowRight aria-hidden className="h-4 w-4" />
            </CtaLink>
            <ArrowLink href="/referral-rewards" className="mt-2 self-start">
              How referral rewards work
            </ArrowLink>
          </div>
          <DeltaNote />
        </div>
      </Band>

      <FinalCta />
    </>
  );
}
