import Link from "next/link";
import { Briefcase, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Page, PageTitle, EmptyState } from "@/components/ui/Page";
import { ApplicationStatusBadge } from "@/components/referrals/StatusBadge";
import { getCurrentProfile } from "@/lib/auth/session";
import { listApplicationsByApplicantEnriched } from "@/lib/data/repository";
import { jobLocation } from "@/lib/jobs";
import type { ApplicationStatus, Job } from "@/types";

const CLOSED: ApplicationStatus[] = ["hired", "rejected", "withdrawn"];

/** A client name is only ever shown when the job is marked "company public". */
function clientLabel(job: Pick<Job, "companyName" | "isCompanyPublic">): string {
  return job.isCompanyPublic && job.companyName ? job.companyName : "Confidential client";
}

function appliedOn(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function CandidateApplicationsPage() {
  const profile = (await getCurrentProfile())!;
  const apps = await listApplicationsByApplicantEnriched(profile.id);
  const inReview = apps.filter(({ application }) => !CLOSED.includes(application.status)).length;

  return (
    <Page>
      <PageTitle
        eyebrow="Your job search"
        title="My applications"
        subtitle={
          apps.length === 0
            ? "Roles you apply to show up here, with where each one stands."
            : `${inReview} in review with Delta`
        }
      />

      <Link href="/jobs" className="block">
        <Button fullWidth>
          <Briefcase className="w-4 h-4" /> Browse jobs
        </Button>
      </Link>

      <section>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-[18px] font-semibold text-ecrn-ink">Applied roles</h2>
          <span className="t-eyebrow">{apps.length} total</span>
        </div>

        {apps.length === 0 ? (
          <EmptyState
            title="No applications yet"
            body="Browse open roles and apply directly. Your information stays confidential until you say otherwise."
            action={
              <Link href="/jobs">
                <Button size="sm">See open jobs</Button>
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-ecrn-line border-b border-ecrn-line">
            {apps.map(({ application, job }) => {
              const where = jobLocation(job);
              return (
                <li key={application.id}>
                  <Link href={`/candidate/applications/${application.id}`} className="flex items-center gap-3 py-3.5">
                    <span className="w-10 h-10 shrink-0 rounded-[10px] bg-white border border-ecrn-line grid place-items-center">
                      <FileText className="w-4 h-4 text-ecrn-secondary" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-[16px] font-semibold text-ecrn-ink truncate">{job.title}</h3>
                        <ApplicationStatusBadge status={application.status} />
                      </div>
                      <p className="text-[12.5px] text-ecrn-secondary truncate">
                        {[clientLabel(job), where].filter(Boolean).join(" · ")}
                      </p>
                      <p className="mt-0.5 t-eyebrow">Applied {appliedOn(application.createdAt)}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Page>
  );
}
