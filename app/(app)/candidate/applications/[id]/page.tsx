import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Page, BackLink, NavyPanel } from "@/components/ui/Page";
import { jobLocation } from "@/lib/jobs";
import { Button } from "@/components/ui/Button";
import { ApplicationStatusBadge } from "@/components/referrals/StatusBadge";
import { getCurrentProfile } from "@/lib/auth/session";
import {
  getApplicationById,
  getJobById,
  listActivityForEntity,
} from "@/lib/data/repository";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ welcome?: string }>;
}

export default async function ApplicationDetailPage(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const profile = (await getCurrentProfile())!;
  const application = await getApplicationById(params.id);
  if (!application) notFound();
  if (application.applicantUserId !== profile.id && profile.role !== "admin") {
    redirect("/candidate/applications");
  }

  const [job, activity] = await Promise.all([
    getJobById(application.jobId),
    listActivityForEntity("job_application", application.id),
  ]);
  if (!job) notFound();

  // Build the review history: activity log entries plus the submission itself.
  const history = [
    ...activity.map((a) => ({
      id: a.id,
      label: humanize(a.action, (a.metadata as Record<string, unknown>)?.to as string | undefined),
      at: a.createdAt,
    })),
    { id: "submitted", label: "Application submitted", at: application.createdAt },
  ]
    .filter((h, i, arr) => arr.findIndex((x) => x.label === h.label && x.at === h.at) === i)
    .sort((a, b) => b.at.localeCompare(a.at));

  return (
    <Page>
      {searchParams?.welcome && (
        <div className="px-4 py-3 rounded-[14px] text-[14px] bg-ecrn-action-surface text-ecrn-green-text">
          Application submitted. Delta&apos;s team has it. Expect to hear back within a few business days.
        </div>
      )}

      <div>
        <BackLink href="/candidate/applications" label="My applications" />
        <p className="t-eyebrow mt-4">Application</p>
        <h1 className="t-page mt-1">{job.title}</h1>
        <p className="mt-2 text-[14.5px] text-ecrn-secondary">
          {job.isCompanyPublic && job.companyName ? job.companyName : "Confidential client"}
          <br />
          {jobLocation(job)}
        </p>
      </div>

      <NavyPanel>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[18px] font-semibold">Application activity</h2>
          <ApplicationStatusBadge status={application.status} />
        </div>
        <ol className="mt-4 relative ml-1.5 border-l border-white/30 space-y-4 pl-5">
          {history.map((h, i) => (
            <li key={h.id} className="relative">
              <span
                className={`absolute -left-[1.62rem] top-1 w-3 h-3 rounded-full border-2 border-white ${i === 0 ? "bg-white ring-4 ring-white/20" : "bg-transparent"}`}
              />
              <div className="text-[15px] font-semibold">{h.label}</div>
              <div className="text-[12.5px] text-white/70">{formatWhen(h.at)}</div>
            </li>
          ))}
        </ol>
      </NavyPanel>

      <section>
        <h2 className="t-section !text-[20px]">Your submission</h2>
        <dl className="mt-1 divide-y divide-ecrn-line border-b border-ecrn-line text-[14.5px]">
          {application.linkedinUrl && (
            <div className="flex items-center justify-between py-3">
              <dt className="text-ecrn-secondary">LinkedIn</dt>
              <dd>
                <a href={application.linkedinUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-ecrn-green-text">
                  View profile ↗
                </a>
              </dd>
            </div>
          )}
          {application.resumeUrl && (
            <div className="flex items-center justify-between py-3">
              <dt className="text-ecrn-secondary">Resume</dt>
              <dd>
                <a href={application.resumeUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-ecrn-green-text">
                  View resume ↗
                </a>
              </dd>
            </div>
          )}
        </dl>
        {application.notes && (
          <div className="mt-3">
            <p className="text-[12.5px] text-ecrn-secondary">Your notes to Delta</p>
            <p className="mt-1 text-[16px] text-ecrn-ink whitespace-pre-line">{application.notes}</p>
          </div>
        )}
        <Link href={`/jobs/${job.id}`} className="block mt-5">
          <Button fullWidth size="lg">
            View the role ›
          </Button>
        </Link>
      </section>
    </Page>
  );
}

function humanize(action: string, to?: string): string {
  if (action === "status_changed" && to) {
    const map: Record<string, string> = {
      reviewing: "Under review",
      interviewing: "Interviewing",
      offer: "Offer extended",
      hired: "Hired",
      rejected: "Not moving forward",
      withdrawn: "Withdrawn",
    };
    return map[to] ?? to;
  }
  if (action === "application_submitted" || action === "applied") return "Application submitted";
  return action.replace(/_/g, " ").replace(/^\w/, (m) => m.toUpperCase());
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}
