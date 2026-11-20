import { Page } from "@/components/ui/Page";
import { JobsBrowser } from "@/components/jobs/JobsBrowser";
import { JsonLd } from "@/components/site/SiteChrome";
import { listPublicJobs } from "@/lib/data/repository";
import { getCurrentProfile } from "@/lib/auth/session";
import { breadcrumbJsonLd, pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Electrical Construction Jobs Near You | ECRN",
  description:
    "Open electrical construction jobs for PMs, estimators, superintendents and engineers. Search near you or by city, apply in one tap, or refer someone.",
  path: "/jobs",
});

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

  return (
    <Page wide={!profile}>
      {!profile && <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Jobs", path: "/jobs" }])} />}
      <JobsBrowser
        jobs={jobs}
        detailBase="/jobs"
        showReferral
        initialOrigin={origin}
        heading={profile ? "Open jobs" : "Electrical construction jobs"}
        intro={
          profile
            ? undefined
            : `${jobs.length} open roles recruited by Delta Construction Partners. Apply in one tap with a free ECRN account, or refer someone you know and earn up to $10,000 if they're hired.`
        }
      />
    </Page>
  );
}
