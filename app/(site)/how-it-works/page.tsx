import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs, Container, CtaLink, Eyebrow, FaqList, FinalCta, PageHero } from "@/components/site/Blocks";
import { JsonLd } from "@/components/site/SiteChrome";
import { FAQS, STEPS, breadcrumbJsonLd, faqJsonLd, pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "How ECRN Works: Refer, Apply, Get Hired or Paid | ECRN",
  description:
    "How ECRN works: join free, refer people from your contacts or apply to electrical construction jobs, and Delta Construction Partners handles the rest.",
  path: "/how-it-works",
});

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "How it works", path: "/how-it-works" },
];
const PAGE_FAQS = [FAQS[3], FAQS[2], FAQS[6], FAQS[9]];

export default function HowItWorksPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <JsonLd data={faqJsonLd(PAGE_FAQS)} />
      <PageHero
        eyebrow="How it works"
        title="How ECRN works"
        intro={
          <p>
            Join free, then refer people you know or apply to open roles. Delta Construction Partners&apos; recruiters handle vetting,
            interviews, and placement, and you earn up to $10,000 when your referral is hired and completes the guarantee period.
          </p>
        }
      >
        <CtaLink href="/signup">Sign up free</CtaLink>
      </PageHero>

      <Container className="py-6">
        <Breadcrumbs items={CRUMBS} />
      </Container>

      <section className="pb-16">
        <Container>
          <ol className="grid gap-5 md:grid-cols-2">
            {STEPS.map((s) => (
              <li key={s.n} className="rounded-[20px] border border-ecrn-line bg-white p-7">
                <span className="font-mono text-[13px] text-ecrn-green-text">Step {s.n}</span>
                <h2 className="mt-2 font-display text-[26px] font-semibold text-ecrn-ink">{s.title}</h2>
                <p className="mt-2 text-[16px] leading-relaxed text-ecrn-secondary">{s.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="py-16 bg-white border-y border-ecrn-line">
        <Container className="grid gap-12 lg:grid-cols-2">
          <div>
            <Eyebrow>For referrers</Eyebrow>
            <h2 className="mt-3 font-display text-[32px] leading-tight font-semibold tracking-[-0.03em] text-ecrn-ink">How do I refer someone?</h2>
            <p className="mt-3 text-[16.5px] leading-relaxed text-ecrn-secondary">
              In the ECRN app, tap <strong>Refer from my contacts</strong> and pick the people you know. ECRN pulls their name, phone,
              email, title, and company from your contacts. A name and phone number are all that&apos;s required. You can also add
              someone by hand or share your personal invite link.
            </p>
            <ul className="mt-5 space-y-2 text-[15.5px] text-ecrn-ink">
              <li>• Only the contacts you select are sent.</li>
              <li>• The first verified referral of a person keeps ownership.</li>
              <li>
                • Track every stage, from first call to placement and payout.{" "}
                <Link href="/referral-rewards" className="text-ecrn-green-text font-medium">
                  See payout tiers
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <Eyebrow>For job seekers</Eyebrow>
            <h2 className="mt-3 font-display text-[32px] leading-tight font-semibold tracking-[-0.03em] text-ecrn-ink">How do I find a job?</h2>
            <p className="mt-3 text-[16.5px] leading-relaxed text-ecrn-secondary">
              Tell us what you do, your experience, and where you&apos;re based. ECRN shows the{" "}
              <Link href="/jobs" className="text-ecrn-green-text font-medium">
                open electrical construction jobs
              </Link>{" "}
              closest to you, or in any city you&apos;re thinking of moving to. Upload a resume once, or build one with us, and every
              application after that is one tap.
            </p>
            <ul className="mt-5 space-y-2 text-[15.5px] text-ecrn-ink">
              <li>• Choose &quot;open to the right move&quot; to look confidentially.</li>
              <li>• Delta&apos;s recruiters contact you, not your employer.</li>
              <li>• You can refer people from the same account.</li>
            </ul>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container className="max-w-4xl">
          <h2 className="mb-8 font-display text-[34px] font-semibold tracking-[-0.03em] text-ecrn-ink">Common questions</h2>
          <FaqList faqs={PAGE_FAQS} />
          <Link href="/faq" className="mt-8 inline-flex items-center gap-1 font-semibold text-ecrn-green-text">
            More answers in the FAQ <ArrowRight className="w-4 h-4" />
          </Link>
        </Container>
      </section>

      <FinalCta />
    </>
  );
}
