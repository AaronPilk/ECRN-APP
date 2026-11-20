import Link from "next/link";
import { redirect } from "next/navigation";
import { Page, BackLink } from "@/components/ui/Page";
import { Button } from "@/components/ui/Button";
import { ResumeView } from "@/components/profile/ResumeView";
import { PrintButton } from "@/components/profile/PrintButton";
import { getCurrentProfile } from "@/lib/auth/session";
import type { GeneratedResume } from "@/lib/resume";

interface PageProps {
  searchParams: Promise<{ built?: string }>;
}

export default async function MyResumePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const profile = (await getCurrentProfile())!;
  const r = profile.resumeBuilder.generated as GeneratedResume | undefined;
  if (!r) redirect("/candidate/resume/build");

  return (
    <Page>
      <div className="print:hidden">
        <BackLink href="/candidate/profile#resume" label="Profile" />
        {sp.built && (
          <div className="mt-3 rounded-[14px] bg-ecrn-action-surface px-4 py-3 text-[14px] text-ecrn-green-text">
            Your resume is ready and on file with Delta&apos;s recruiters.
          </div>
        )}
      </div>
      <ResumeView r={r} />
      <div className="grid grid-cols-2 gap-2 print:hidden">
        <Link href="/candidate/resume/build">
          <Button variant="secondary" fullWidth>
            Edit answers
          </Button>
        </Link>
        <PrintButton />
      </div>
    </Page>
  );
}
