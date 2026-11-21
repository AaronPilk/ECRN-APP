import "@/components/site/inner/inner.css";
import { ArrowRight } from "lucide-react";
import { CtaLink, PageHero } from "@/components/site/Blocks";
import { Band, DeltaNote, Heading, StepList } from "@/components/site/inner/Kit";

export const metadata = { title: "Thanks", robots: { index: false, follow: true } };

const NEXT_STEPS = [
  { title: "Delta's recruiting team reads it", body: "Your request is with Delta Construction Partners' recruiters now." },
  { title: "A recruiter reaches out", body: "A Delta recruiter contacts you to talk through the role." },
  { title: "You meet vetted candidates", body: "You interview people Delta's recruiters have already vetted, sourced through industry referrals." },
];

export default function HireThanksPage() {
  return (
    <>
      <PageHero
        eyebrow="Request sent"
        title="We've got it."
        image="office-overlook-night"
        intro={
          <p>
            Your hiring need is in front of Delta Construction Partners&apos; recruiting team. Someone will reach out shortly.
          </p>
        }
      >
        <CtaLink href="/" className="w-full sm:w-auto">
          Back to home <ArrowRight aria-hidden className="h-4 w-4" />
        </CtaLink>
        <CtaLink href="/about" variant="ghost" className="w-full sm:w-auto">
          About ECRN and Delta
        </CtaLink>
      </PageHero>

      <Band labelledBy="next-title">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <Heading id="next-title" title="What happens next" />
          <StepList steps={NEXT_STEPS} />
        </div>
        <DeltaNote className="mt-14 sm:mt-20" />
      </Band>
    </>
  );
}
