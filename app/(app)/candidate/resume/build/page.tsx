import { Page, BackLink, PageTitle } from "@/components/ui/Page";
import { ResumeBuilder } from "@/components/profile/ResumeBuilder";
import { requireProfile } from "@/lib/auth/session";
import type { ResumeAnswers } from "@/lib/resume";

export default async function ResumeBuilderPage() {
  const profile = await requireProfile();
  const answers = profile.resumeBuilder.answers as ResumeAnswers | undefined;

  return (
    <Page>
      <BackLink href="/profile#resume" label="Profile" />
      <PageTitle title="Build your resume" subtitle="Answer a few questions. Your progress saves as you go." />
      <ResumeBuilder initial={answers ?? {}} />
    </Page>
  );
}
