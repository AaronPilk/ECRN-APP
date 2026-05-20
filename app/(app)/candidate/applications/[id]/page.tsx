import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ApplicationStatusBadge } from "@/components/referrals/StatusBadge";
import { getCurrentProfile } from "@/lib/auth/mock";
import {
  getApplicationById,
  getJobById,
  listActivityForEntity,
} from "@/lib/data/repository";

interface PageProps {
  params: { id: string };
  searchParams?: { welcome?: string };
}

export default async function ApplicationDetailPage({ params, searchParams }: PageProps) {
  const profile = (await getCurrentProfile())!;
  const application = await getApplicationById(params.id);
  if (!application) notFound();
  if (application.applicantUserId !== profile.id && profile.role !== "admin") {
    redirect("/candidate/applications");
  }

  const job = await getJobById(application.jobId);
  if (!job) notFound();
  const activity = await listActivityForEntity("job_application", application.id);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      {searchParams?.welcome && (
        <div className="p-3.5 rounded-xl text-sm border leading-relaxed bg-emerald-50 border-emerald-200/60 text-emerald-900">
          Application submitted. Delta&apos;s team has it — expect to hear back within a few
          business days.
        </div>
      )}

      <Link href="/candidate/applications" className="text-sm text-slate-500 hover:text-ecrn-ink">
        ← My applications
      </Link>

      <Card>
        <CardContent className="py-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500 font-medium">
                Application
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-ecrn-ink">{job.title}</h1>
              <p className="mt-1 text-slate-500">
                {job.companyName ?? "Confidential client"} ·{" "}
                {[job.locationCity, job.locationState].filter(Boolean).join(", ")}
              </p>
            </div>
            <ApplicationStatusBadge status={application.status} />
          </div>

          <div className="mt-5 grid sm:grid-cols-2 gap-3 text-sm">
            {application.linkedinUrl && (
              <Row label="LinkedIn">
                <a
                  href={application.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ecrn-green hover:underline truncate inline-block max-w-full"
                >
                  {application.linkedinUrl.replace(/^https?:\/\/(www\.)?/, "")}
                </a>
              </Row>
            )}
            {application.resumeUrl && (
              <Row label="Resume">
                <a
                  href={application.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ecrn-green hover:underline truncate inline-block max-w-full"
                >
                  View resume →
                </a>
              </Row>
            )}
            <Row label="Submitted">
              <span className="text-ecrn-ink">{application.createdAt.slice(0, 10)}</span>
            </Row>
            <Row label="Status">
              <span className="text-ecrn-ink">{application.status}</span>
            </Row>
          </div>

          {application.notes && (
            <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="text-xs uppercase tracking-wide text-slate-500 font-medium">
                Your notes to Delta
              </div>
              <p className="mt-1.5 text-sm text-slate-700 whitespace-pre-line">
                {application.notes}
              </p>
            </div>
          )}

          <div className="mt-5 pt-5 border-t border-slate-100">
            <Link href={`/jobs/${job.id}`}>
              <Button size="sm" variant="secondary">
                View the role
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Activity
          </h2>
          {activity.length === 0 ? (
            <p className="text-sm text-slate-500">
              We&apos;ll log updates here as Delta moves your application through their process.
            </p>
          ) : (
            <ol className="relative border-l border-slate-200 ml-2 space-y-4 pl-5">
              {activity.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[1.45rem] top-1.5 w-2.5 h-2.5 rounded-full bg-ecrn-green ring-4 ring-white" />
                  <div className="text-sm font-medium text-ecrn-ink">
                    {a.action.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{a.createdAt.slice(0, 16).replace("T", " ")}</div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">{label}</div>
      <div className="mt-1 text-sm font-medium truncate">{children}</div>
    </div>
  );
}
