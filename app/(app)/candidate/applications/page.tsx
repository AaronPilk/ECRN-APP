import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ApplicationStatusBadge } from "@/components/referrals/StatusBadge";
import { getCurrentProfile } from "@/lib/auth/mock";
import { listApplicationsByApplicantEnriched } from "@/lib/data/repository";
import { Briefcase, FileText } from "lucide-react";

export default async function CandidateApplicationsPage() {
  const profile = (await getCurrentProfile())!;
  const apps = await listApplicationsByApplicantEnriched(profile.id);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ecrn-ink">
            My applications
          </h1>
          <p className="mt-1 text-slate-500">
            {apps.length} application{apps.length === 1 ? "" : "s"}.
          </p>
        </div>
        <Link href="/candidate/jobs">
          <Button size="sm" variant="primary">
            <Briefcase className="w-4 h-4" /> Browse jobs
          </Button>
        </Link>
      </div>

      {apps.length === 0 ? (
        <Card className="p-10 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-100 grid place-items-center mb-4">
            <FileText className="w-6 h-6 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-ecrn-ink">No applications yet</h3>
          <p className="mt-1.5 text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Browse open roles and apply directly. Your information stays confidential until you
            say otherwise.
          </p>
          <Link href="/candidate/jobs" className="inline-block mt-5">
            <Button variant="dark" size="md">
              See open jobs
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {apps.map(({ application, job }) => (
            <Link key={application.id} href={`/candidate/applications/${application.id}`}>
              <Card className="hover:shadow-float hover:border-ecrn-green/40 transition-all">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[15px] font-semibold text-ecrn-ink">
                          {job.title}
                        </h3>
                        <ApplicationStatusBadge status={application.status} />
                      </div>
                      <p className="mt-1 text-sm text-slate-500 truncate">
                        {job.companyName ?? "Confidential client"} ·{" "}
                        {[job.locationCity, job.locationState].filter(Boolean).join(", ")}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Applied {application.createdAt.slice(0, 10)}
                      </p>
                    </div>
                    <div className="text-slate-300 text-lg shrink-0">›</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
