import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AddToHomeScreenGuide } from "@/components/onboarding/AddToHomeScreenGuide";
import { getCurrentProfile } from "@/lib/auth/mock";
import { listPublicJobs, listApplicationsByApplicant } from "@/lib/data/repository";
import { Briefcase, FileText, User } from "lucide-react";

export default async function CandidateDashboard() {
  const profile = (await getCurrentProfile())!;
  const jobs = (await listPublicJobs()).slice(0, 3);
  const apps = await listApplicationsByApplicant(profile.id);

  const profileComplete = profile.firstName && profile.lastName && profile.email;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div>
        <p className="text-xs font-medium tracking-[0.18em] uppercase text-slate-500">Candidate</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-ecrn-ink">
          Welcome, {profile.firstName ?? "there"}
        </h1>
        <p className="mt-1 text-slate-500">
          Browse confidential roles at top construction firms.
        </p>
      </div>

      <AddToHomeScreenGuide />

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Applications" value={apps.length} icon={<FileText className="w-4 h-4" />} />
        <StatCard label="Open jobs" value={jobs.length} icon={<Briefcase className="w-4 h-4" />} />
        <StatCard
          label="Profile"
          value={profileComplete ? "Ready" : "Setup"}
          icon={<User className="w-4 h-4" />}
        />
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold tracking-tight text-ecrn-ink">
            Suggested roles
          </h2>
          <Link href="/candidate/jobs" className="text-sm font-medium hover:underline">
            See all →
          </Link>
        </div>
        <div className="space-y-3">
          {jobs.map((j) => (
            <Card key={j.id}>
              <CardContent className="flex items-start justify-between gap-4 py-4">
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold text-ecrn-ink">{j.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {[j.locationCity, j.locationState].filter(Boolean).join(", ")} ·{" "}
                    {j.compensationDisplay ?? "Competitive"}
                  </p>
                </div>
                <Link href={`/jobs/${j.id}`}>
                  <Button size="sm" variant="secondary">
                    View
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-xl font-bold text-ecrn-ink">{value}</div>
    </Card>
  );
}
