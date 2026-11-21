import "@/components/site/inner/inner.css";
import { ArrowDown, ArrowRight, BookUser, Briefcase, Lock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ArrowLink, Container, CtaLink, FaqList, FinalCta, Island, PageHero } from "@/components/site/Blocks";
import { JsonLd } from "@/components/site/SiteChrome";
import { Reveal, ScrollLine, ScrollLineStep } from "@/components/site/motion";
import { Band, Crumbs, DeltaNote, Heading, IslandBody, PhotoFrame, StepList } from "@/components/site/inner/Kit";
import { FAQS, breadcrumbJsonLd, faqJsonLd, pageMeta } from "@/lib/site";

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

/** Photos sit in the step column: the screen minus the island inset, marker and gap on phones. */
const STEP_PHOTO_SIZES = "(min-width: 1024px) 540px, (min-width: 640px) calc(100vw - 140px), calc(100vw - 104px)";

const PATHS: { href: string; icon: LucideIcon; title: string; line: string }[] = [
  { href: "#refer", icon: BookUser, title: "Refer someone", line: "From a name to a payout" },
  { href: "#apply", icon: Briefcase, title: "Find a job", line: "From sign-up to an offer" },
];

const SEEKER_STEPS = [
  { title: "Make a free account", body: "It takes about a minute: what you do, your experience, and where you're based." },
  { title: "See jobs near you", body: "Open roles sorted by distance from you, or from any city you're thinking of moving to." },
  { title: "Apply in one tap", body: "Upload a resume once, or build one with us. After that, every application is one tap." },
  { title: "Delta's recruiters follow up", body: "They contact you, not your employer, and take it from there." },
];

export default function HowItWorksPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <JsonLd data={faqJsonLd(PAGE_FAQS)} />
      <PageHero
        eyebrow="How it works"
        title="How ECRN works"
        image="foreman-plans"
        intro={
          <p>
            Join free, then refer people you know or apply to open roles. Delta Construction Partners&apos; recruiters handle vetting,
            interviews, and placement, and you earn up to $10,000 when your referral is hired and completes the guarantee period.
          </p>
        }
      >
        <CtaLink href="/signup" className="w-full sm:w-auto">
          Sign up free <ArrowRight aria-hidden className="h-4 w-4" />
        </CtaLink>
      </PageHero>

      <Crumbs items={CRUMBS} />

      {/* Two paths, one account: jump straight to yours. */}
      <section aria-label="Choose a path" className="site-tone-light bg-ecrn-paper pb-14 pt-6 sm:pb-16 sm:pt-10">
        <Container>
          <p className="max-w-xl text-pretty text-[16px] leading-[1.6] text-ecrn-secondary">
            Every ECRN member can do both, from one account. Pick where to start.
          </p>
          <nav aria-label="Two ways to use ECRN" className="mt-5 grid grid-cols-2 gap-3 sm:max-w-xl">
            {PATHS.map((p) => {
              const Icon = p.icon;
              return (
                <a key={p.href} href={p.href} className="site-card site-lift flex min-h-[8.5rem] flex-col rounded-[20px] p-4 sm:p-5">
                  <Icon aria-hidden className="h-5 w-5 text-cobalt" />
                  <span className="mt-auto pt-4 font-display text-[17px] font-semibold leading-tight tracking-[-0.015em] text-ecrn-ink">{p.title}</span>
                  <span className="mt-1 flex items-end justify-between gap-2 text-[13.5px] leading-snug text-ecrn-secondary">
                    {p.line}
                    <ArrowDown aria-hidden className="h-4 w-4 shrink-0 text-ecrn-ink" />
                  </span>
                </a>
              );
            })}
          </nav>
        </Container>
      </section>

      {/* One referral, walked from a name to a payout. The current runs down the conduit as you read. */}
      <Island id="refer">
        <IslandBody>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <div className="lg:sticky lg:top-[calc(var(--site-header-total)+3rem)] lg:self-start">
              <Reveal>
                <Heading
                  kicker="If you're referring"
                  title="One referral, from a name to a payout"
                  intro="What happens after you send someone's name, step by step."
                />
              </Reveal>
            </div>
            <ScrollLine>
              <ScrollLineStep marker="01">
                <h3 className="inner-h3">You send a name</h3>
                <p className="inner-body mt-2">
                  Tap refer in ECRN and pick someone from your phone&apos;s contacts, or type their name and phone number. Only the people you
                  pick are sent.
                </p>
                <PhotoFrame image="cover-refer-someone" sizes={STEP_PHOTO_SIZES} className="mt-5" />
              </ScrollLineStep>
              <ScrollLineStep marker="02">
                <h3 className="inner-h3">A Delta recruiter calls them</h3>
                <p className="inner-body mt-2">
                  One of Delta Construction Partners&apos; 30+ recruiters reaches out and handles the vetting. You don&apos;t need any recruiting
                  experience.
                </p>
              </ScrollLineStep>
              <ScrollLineStep marker="03">
                <h3 className="inner-h3">They interview and get hired</h3>
                <p className="inner-body mt-2">
                  Delta sets up the interviews with its contractor clients and handles the follow-up. When your referral is hired, Delta places
                  them.
                </p>
                <PhotoFrame image="cover-referral-bonuses" sizes={STEP_PHOTO_SIZES} className="mt-5" />
              </ScrollLineStep>
              <ScrollLineStep marker="04">
                <h3 className="inner-h3">They work the guarantee period</h3>
                <p className="inner-body mt-2">
                  It typically runs 90 days from their start date. You can see where your referral stands in the app the whole way.
                </p>
                <PhotoFrame image="crew-on-lift" sizes={STEP_PHOTO_SIZES} className="mt-5" />
              </ScrollLineStep>
              <ScrollLineStep marker="05">
                <h3 className="inner-h3">You get paid</h3>
                <p className="inner-body mt-2">
                  Delta confirms your reward in writing, up to $10,000 depending on the role, and processes your payout.
                </p>
                <ArrowLink href="/referral-rewards" className="mt-2">
                  See payout tiers and timing
                </ArrowLink>
              </ScrollLineStep>
            </ScrollLine>
          </div>
        </IslandBody>
      </Island>

      {/* The job seeker's path (phones: heading, photo, steps, privacy). */}
      <Band id="apply" labelledBy="apply-title">
        <div className="grid gap-8 lg:grid-cols-2 lg:grid-rows-[auto_auto_1fr] lg:gap-x-16 lg:gap-y-10">
          <Reveal className="lg:col-start-1 lg:row-start-1">
            <Heading
              id="apply-title"
              kicker="If you're looking for work"
              title="How do I find a job?"
              intro="Tell us what you do and where you're based. Delta's recruiters do the legwork from there."
            />
          </Reveal>
          <Reveal className="lg:col-start-2 lg:row-span-3 lg:row-start-1">
            <PhotoFrame image="cover-confidential-search" ratio="4 / 3" sizes="(min-width: 1024px) 560px, calc(100vw - 40px)" />
          </Reveal>
          <Reveal className="lg:col-start-1 lg:row-start-2">
            <StepList steps={SEEKER_STEPS} />
          </Reveal>
          <Reveal className="lg:col-start-1 lg:row-start-3">
            <div className="site-card flex gap-3 rounded-[20px] p-5">
              <Lock aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-cobalt" />
              <div>
                <p className="font-display text-[16px] font-semibold leading-snug text-ecrn-ink">Employed? Look privately.</p>
                <p className="mt-1 text-pretty text-[15px] leading-[1.55] text-ecrn-secondary">
                  When you sign up, choose &ldquo;I&apos;m open to the right move.&rdquo; Only Delta&apos;s recruiters see it, and your current
                  employer is never contacted.
                </p>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <CtaLink href="/jobs" variant="dark" className="w-full sm:w-auto">
                Browse open jobs
              </CtaLink>
              <CtaLink href="/signup" variant="light" className="w-full sm:w-auto">
                Sign up free
              </CtaLink>
            </div>
          </Reveal>
        </div>
        <Reveal className="mt-14 sm:mt-20">
          <DeltaNote />
        </Reveal>
      </Band>

      <Band tone="white" labelledBy="hiw-faq" className="border-t border-ecrn-line">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-4">
          <Heading id="hiw-faq" title="Common questions" className="lg:col-start-1 lg:row-start-1" />
          <FaqList faqs={PAGE_FAQS} className="lg:col-start-2 lg:row-span-2 lg:row-start-1" />
          <ArrowLink href="/faq" className="-mt-4 lg:col-start-1 lg:row-start-2 lg:mt-0 lg:self-start">
            More answers in the FAQ
          </ArrowLink>
        </div>
      </Band>

      <FinalCta />
    </>
  );
}
