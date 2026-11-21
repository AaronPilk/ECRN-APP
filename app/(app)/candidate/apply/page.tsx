import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CircleCheck, FileText, Lock } from "lucide-react";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Textarea } from "@/components/ui/Input";
import { FormMessage } from "@/components/ui/FormMessage";
import { Page, BackLink } from "@/components/ui/Page";
import { GroupField } from "@/components/ui/GroupField";
import { getCurrentProfile } from "@/lib/auth/session";
import { getJobById } from "@/lib/data/repository";
import { jobLocation } from "@/lib/jobs";
import { applyAction } from "../actions";

interface PageProps {
  searchParams: Promise<{ jobId?: string; error?: string }>;
}

/**
 * Apply with your ECRN profile: everything we already know is sent with the
 * application, so most members only tap Submit.
 */
export default async function ApplyPage(props: PageProps) {
  const sp = await props.searchParams;
  if (!sp.jobId) redirect("/jobs");
  const [profile, job] = await Promise.all([getCurrentProfile(), getJobById(sp.jobId)]);
  if (!job) notFound();
  const p = profile!;
  const hasResume = Boolean(p.resumePath || p.resumeBuilder.generated);
  const needsName = !p.firstName || !p.lastName;
  const needsPhone = !p.phone;

  return (
    <Page className="pb-36">
      <div>
        <BackLink href={`/jobs/${job.id}`} label="Back to role" />
        <p className="t-eyebrow mt-4">Apply</p>
        <h1 className="t-page mt-1 !text-[34px] !leading-[37px]">{job.title}</h1>
        <p className="mt-2 text-[14.5px] text-ecrn-secondary">{jobLocation(job)}</p>
      </div>

      <FormMessage error={sp.error} />

      <form id="apply-form" action={applyAction} className="space-y-5">
        <input type="hidden" name="jobId" value={job.id} />
        {!needsName && (
          <>
            <input type="hidden" name="firstName" value={p.firstName ?? ""} />
            <input type="hidden" name="lastName" value={p.lastName ?? ""} />
          </>
        )}
        {!needsPhone && <input type="hidden" name="phone" value={p.phone ?? ""} />}
        <input type="hidden" name="locationCity" value={p.locationCity ?? ""} />
        <input type="hidden" name="locationState" value={p.locationState ?? ""} />
        <input type="hidden" name="currentJobTitle" value={p.discipline ?? ""} />

        <section>
          <h2 className="font-display text-[18px] font-semibold text-ecrn-ink mb-2">Sent with your application</h2>
          <div className="group-surface">
            <div className="group-row">
              <span className="text-[15px] text-ecrn-secondary">Name</span>
              <span className="text-[15px] text-ecrn-ink">{[p.firstName, p.lastName].filter(Boolean).join(" ") || "—"}</span>
            </div>
            <div className="group-row">
              <span className="text-[15px] text-ecrn-secondary">Email</span>
              <span className="text-[15px] text-ecrn-ink truncate">{p.email}</span>
            </div>
            {p.phone && (
              <div className="group-row">
                <span className="text-[15px] text-ecrn-secondary">Phone</span>
                <span className="text-[15px] text-ecrn-ink">{p.phone}</span>
              </div>
            )}
            <div className="group-row">
              <span className="text-[15px] text-ecrn-secondary">Resume</span>
              {hasResume ? (
                <span className="inline-flex items-center gap-1 text-[15px] text-ecrn-green-text">
                  <CircleCheck className="w-4 h-4" /> On file
                </span>
              ) : (
                <Link href="/profile#resume" className="text-[15px] font-medium text-ecrn-green-text">
                  Add one
                </Link>
              )}
            </div>
          </div>
          {!hasResume && (
            <p className="mt-2 flex items-start gap-2 text-[12.5px] text-ecrn-secondary">
              <FileText className="w-4 h-4 shrink-0" /> You can apply without one. A recruiter may ask for it later.
            </p>
          )}
        </section>

        {(needsName || needsPhone) && (
          <section>
            <h2 className="font-display text-[18px] font-semibold text-ecrn-ink mb-2">A couple of details</h2>
            <div className="group-surface">
              {needsName && (
                <>
                  <GroupField label="First name" name="firstName" required defaultValue={p.firstName ?? ""} />
                  <GroupField label="Last name" name="lastName" required defaultValue={p.lastName ?? ""} />
                </>
              )}
              {needsPhone && <GroupField label="Phone" name="phone" type="tel" inputMode="tel" required placeholder="(555) 555-0123" />}
            </div>
          </section>
        )}

        <section>
          <h2 className="font-display text-[18px] font-semibold text-ecrn-ink mb-2">Optional</h2>
          <div className="group-surface mb-3">
            <GroupField label="LinkedIn" name="linkedinUrl" type="url" placeholder="linkedin.com/in/…" defaultValue={p.linkedinUrl ?? ""} autoCapitalize="none" />
          </div>
          <Textarea name="notes" rows={3} placeholder="Anything Delta should know? e.g. available in two weeks" />
        </section>

        {p.careerStatus === "open_to_offers" && (
          <p className="flex items-start gap-2 text-[12.5px] text-navy">
            <Lock className="w-4 h-4 shrink-0 text-cobalt" /> Confidential: Delta won&apos;t contact your current employer.
          </p>
        )}

      <div className="fixed lg:static inset-x-0 bottom-[calc(64px+max(env(safe-area-inset-bottom),0.75rem))] z-30 bg-ecrn-paper/95 backdrop-blur border-t border-ecrn-line lg:border-0">
        <div className="max-w-3xl mx-auto px-[22px] py-3">
          <SubmitButton pendingLabel="Submitting…" fullWidth size="lg" variant="deep">
            Submit application
          </SubmitButton>
        </div>
      </div>
      </form>
    </Page>
  );
}
