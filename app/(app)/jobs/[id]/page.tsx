import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getJobById } from "@/lib/data/repository";

interface PageProps {
  params: { id: string };
}

export default async function JobDetailPage({ params }: PageProps) {
  const maybeJob = await getJobById(params.id);
  if (!maybeJob) notFound();
  const job = maybeJob;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <div>
        <Link href="/jobs" className="text-sm text-slate-500 hover:text-delta-ink">
          ← All open roles
        </Link>
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-delta-ink">
          {job.title}
        </h1>
        <p className="mt-1 text-slate-500">
          {job.companyName ?? "Confidential client"} ·{" "}
          {[job.locationCity, job.locationState].filter(Boolean).join(", ")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {job.urgency === "critical" && <Badge variant="red">Urgent</Badge>}
          {job.urgency === "high" && <Badge variant="amber">High priority</Badge>}
          {job.trade && <Badge variant="neutral">{job.trade}</Badge>}
          {job.jobType && <Badge variant="neutral">{job.jobType}</Badge>}
        </div>
      </div>

      <Card>
        <CardContent className="py-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              About the role
            </h2>
            <p className="mt-2 text-[15px] text-delta-ink whitespace-pre-line leading-relaxed">
              {job.description}
            </p>
          </div>
          {job.requirements && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Requirements
              </h2>
              <p className="mt-2 text-[15px] text-delta-ink whitespace-pre-line leading-relaxed">
                {job.requirements}
              </p>
            </div>
          )}
          <div className="grid sm:grid-cols-2 gap-3 pt-2">
            <Detail label="Compensation" value={job.compensationDisplay ?? "Competitive"} />
            <Detail label="Referral payout" value={job.referralPayoutDisplay ?? "—"} />
          </div>
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-3">
        <Link href={`/referrals/new?jobId=${job.id}`} className="block">
          <Button variant="dark" fullWidth size="lg">
            Refer someone for this role
          </Button>
        </Link>
        <Link href={`/candidate/apply?jobId=${job.id}`} className="block">
          <Button variant="secondary" fullWidth size="lg">
            Apply directly
          </Button>
        </Link>
      </div>

      <p className="text-xs text-slate-500 text-center">
        Apply / Refer actions ship in Batch 3. The buttons route to placeholder pages today.
      </p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-[15px] font-semibold text-delta-ink">{value}</div>
    </div>
  );
}
