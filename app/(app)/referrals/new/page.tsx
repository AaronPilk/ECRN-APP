import Link from "next/link";
import { BookUser } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { FormMessage } from "@/components/ui/FormMessage";
import { Page, BackLink } from "@/components/ui/Page";
import { GroupField, GroupHeader } from "@/components/ui/GroupField";
import { getJobById } from "@/lib/data/repository";
import { jobPayout } from "@/lib/jobs";
import { submitReferralAction } from "../actions";

interface PageProps {
  searchParams: Promise<{ jobId?: string; error?: string }>;
}

export default async function NewReferralPage(props: PageProps) {
  const sp = await props.searchParams;
  const job = sp?.jobId ? await getJobById(sp.jobId) : null;

  return (
    <Page className="pb-36">
      <div>
        <BackLink href="/referrals" label="My referrals" />
        <h1 className="t-page mt-3">Add a referral</h1>
        <p className="mt-2 text-[15px] text-ecrn-secondary">Introduce an electrical construction professional to Delta.</p>
      </div>

      {job && (
        <div className="rounded-[16px] bg-ecrn-reward-tint px-4 py-3">
          <p className="t-eyebrow !text-cobalt">Referring to</p>
          <p className="mt-0.5 font-display text-[16px] font-semibold text-navy">{job.title}</p>
          {jobPayout(job) && <p className="text-[13px] text-cobalt">Est. referral payout {jobPayout(job)}</p>}
        </div>
      )}

      <Link
        href="/referrals/import"
        className="flex items-center gap-3 rounded-[16px] bg-ecrn-action-surface px-4 py-3 text-ecrn-green-text"
      >
        <BookUser className="w-5 h-5" />
        <span className="text-[14.5px] font-medium">Faster: pick people from your contacts</span>
      </Link>

      <FormMessage error={sp.error} />

      <form id="referral-form" action={submitReferralAction} className="space-y-6">
        {sp.jobId && <input type="hidden" name="jobId" value={sp.jobId} />}

        <section>
          <GroupHeader title="Their name" required />
          <div className="group-surface">
            <GroupField label="First name" name="firstName" required placeholder="e.g. Alex" autoComplete="off" autoCapitalize="words" />
            <GroupField label="Last name" name="lastName" placeholder="e.g. Morgan" autoComplete="off" autoCapitalize="words" />
          </div>
        </section>

        <section>
          <GroupHeader title="Contact details" hint="A phone number is required so Delta can reach them." />
          <div className="group-surface">
            <GroupField label="Phone" name="phone" type="tel" inputMode="tel" required placeholder="(555) 555-0123" />
            <GroupField label="Email" name="email" type="email" inputMode="email" placeholder="name@example.com" autoCapitalize="none" />
            <GroupField label="LinkedIn URL" name="linkedinUrl" type="url" placeholder="linkedin.com/in/…" autoCapitalize="none" />
          </div>
          <p className="mt-2 text-[12.5px] text-ecrn-secondary">A LinkedIn profile helps Delta identify duplicates.</p>
        </section>

        <section>
          <GroupHeader title="Work" />
          <div className="group-surface">
            <GroupField label="Job title" name="currentJobTitle" placeholder="e.g. Electrical PM" />
            <GroupField label="Company" name="currentCompany" placeholder="Where they work now" />
            <GroupField label="Years" name="yearsExperience" inputMode="numeric" placeholder="e.g. 8" />
            <GroupField label="City" name="locationCity" placeholder="Tampa" />
            <GroupField label="State" name="locationState" placeholder="FL" maxLength={2} autoCapitalize="characters" />
          </div>
        </section>

        <section>
          <GroupHeader title="Notes for Delta" />
          <Textarea name="notes" rows={3} placeholder="How do you know them? Are they open to a move?" />
        </section>

        <p className="text-[12.5px] text-ecrn-secondary leading-relaxed">
          If someone already referred this person, the first referrer keeps ownership and Delta reviews your submission.
        </p>
      </form>

      {/* Submit docked above the tab bar */}
      <div className="fixed lg:static inset-x-0 bottom-[calc(64px+max(env(safe-area-inset-bottom),0.75rem))] z-30 bg-ecrn-paper/95 backdrop-blur border-t border-ecrn-line lg:border-0">
        <div className="max-w-3xl mx-auto px-[22px] py-3">
          <Button form="referral-form" type="submit" fullWidth size="lg">
            Submit referral
          </Button>
        </div>
      </div>
    </Page>
  );
}
