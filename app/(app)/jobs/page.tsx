import { Page } from "@/components/ui/Page";
import { JobsBrowser } from "@/components/jobs/JobsBrowser";
import { listPublicJobs } from "@/lib/data/repository";
import { getCurrentProfile } from "@/lib/auth/session";

export default async function JobsPage() {
  const [jobs, profile] = await Promise.all([listPublicJobs(), getCurrentProfile()]);
  const isCandidate = profile?.role === "candidate";
  const origin =
    profile?.locationLat != null && profile?.locationLng != null
      ? {
          lat: profile.locationLat,
          lng: profile.locationLng,
          label: [profile.locationCity, profile.locationState].filter(Boolean).join(", ") || "your city",
        }
      : null;

  return (
    <Page>
      <JobsBrowser
        jobs={jobs}
        detailBase="/jobs"
        showReferral={!isCandidate || profile?.intent === "both"}
        initialOrigin={origin}
      />
    </Page>
  );
}
