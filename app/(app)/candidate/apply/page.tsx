import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { getCurrentProfile } from "@/lib/auth/mock";
import { getJobById } from "@/lib/data/repository";
import { applyAction } from "../actions";

interface PageProps {
  searchParams?: { jobId?: string };
}

export default async function ApplyPage({ searchParams }: PageProps) {
  const profile = (await getCurrentProfile())!;
  const jobId = searchParams?.jobId;
  if (!jobId) {
    // Without a jobId there's nothing to apply to — bounce them to the jobs list.
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-center">
        <p className="text-slate-500">Which role would you like to apply to?</p>
        <Link href="/candidate/jobs" className="inline-block mt-3">
          <Button size="sm" variant="dark">
            Browse jobs
          </Button>
        </Link>
      </div>
    );
  }

  const job = await getJobById(jobId);
  if (!job) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <Link href={`/jobs/${job.id}`} className="text-sm text-slate-500 hover:text-ecrn-ink">
        ← Back to role
      </Link>

      <div>
        <p className="text-xs font-semibold tracking-[0.18em] uppercase text-ecrn-green">
          Applying to
        </p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-ecrn-ink">
          {job.title}
        </h1>
        <p className="mt-1 text-slate-500">
          {job.companyName ?? "Confidential client"} ·{" "}
          {[job.locationCity, job.locationState].filter(Boolean).join(", ")}
        </p>
      </div>

      <Card>
        <CardContent className="py-6">
          <form action={applyAction} className="space-y-5">
            <input type="hidden" name="jobId" value={job.id} />

            <Section title="Your information">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">First name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    required
                    defaultValue={profile.firstName ?? ""}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    required
                    defaultValue={profile.lastName ?? ""}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    defaultValue={profile.email}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={profile.phone ?? ""}
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mt-3">
                <div>
                  <Label htmlFor="locationCity">City</Label>
                  <Input
                    id="locationCity"
                    name="locationCity"
                    defaultValue={profile.locationCity ?? ""}
                  />
                </div>
                <div>
                  <Label htmlFor="locationState">State</Label>
                  <Input
                    id="locationState"
                    name="locationState"
                    defaultValue={profile.locationState ?? ""}
                  />
                </div>
              </div>
            </Section>

            <Section title="Your background">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="currentJobTitle">Current title</Label>
                  <Input id="currentJobTitle" name="currentJobTitle" />
                </div>
                <div>
                  <Label htmlFor="trade">Trade</Label>
                  <Input id="trade" name="trade" placeholder="e.g. electrical" />
                </div>
              </div>
              <div className="mt-3">
                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                <Input
                  id="linkedinUrl"
                  name="linkedinUrl"
                  type="url"
                  placeholder="https://www.linkedin.com/in/..."
                  defaultValue={profile.linkedinUrl ?? ""}
                />
              </div>
              <div className="mt-3">
                <Label htmlFor="resumeUrl">Resume URL (Google Drive, Dropbox, etc.)</Label>
                <Input id="resumeUrl" name="resumeUrl" type="url" />
                <p className="mt-1.5 text-xs text-slate-500">
                  Resume file upload comes in a later batch — for now share a link.
                </p>
              </div>
            </Section>

            <Section title="Anything else?">
              <Textarea
                id="notes"
                name="notes"
                rows={4}
                placeholder="Why this role catches your eye, your availability, comp expectations…"
              />
            </Section>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Button type="submit" variant="dark" size="lg" fullWidth>
                Submit application
              </Button>
              <Link href={`/jobs/${job.id}`} className="sm:w-auto">
                <Button type="button" variant="ghost" size="lg" fullWidth>
                  Cancel
                </Button>
              </Link>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your application goes directly to Delta&apos;s recruiting team. Your information is
              confidential and only shared with the hiring company after you approve.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 mb-3">
        {title}
      </h2>
      {children}
    </div>
  );
}
