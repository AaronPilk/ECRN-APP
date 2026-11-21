import "@/components/site/inner/inner.css";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ArrowLink, CtaLink, FaqList, FinalCta, Island, PageHero } from "@/components/site/Blocks";
import { JsonLd } from "@/components/site/SiteChrome";
import { Reveal } from "@/components/site/motion";
import { Band, Crumbs, DeltaNote, Heading, IslandBody } from "@/components/site/inner/Kit";
import { ExampleStatement, PayoutTimeline, RewardLadder } from "@/components/site/inner/Rewards";
import { FAQS, breadcrumbJsonLd, faqJsonLd, pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "Referral Rewards: Up to $10,000 per Hire | ECRN",
  description:
    "ECRN referral payouts by role: up to $2,500 for field positions, $5,000 for field leadership, $7,500 for office roles, and $10,000 for executives.",
  path: "/referral-rewards",
});

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Referral rewards", path: "/referral-rewards" },
];
const PAGE_FAQS = [FAQS[1], FAQS[2], FAQS[9], FAQS[7]];

/** The conditions that sit under the ladder (program terms, April 2026). */
const CONDITIONS = [
  {
    title: "Estimates, confirmed in writing",
    body: "Every figure is an estimate of up to that amount, not a guarantee. Delta Construction Partners decides the final amount and confirms it in writing before your payout is processed.",
  },
  { title: "No cap", body: "There is no limit on how many people you can refer." },
  { title: "First referral keeps it", body: "If two people refer the same person, the first verified referral on record keeps ownership." },
];

export default function RewardsPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <JsonLd data={faqJsonLd(PAGE_FAQS)} />
      <PageHero
        eyebrow="Referral compensation"
        title="Referral rewards: up to $10,000 per hire"
        image="handshake-site"
        intro={
          <p>
            ECRN pays up to $10,000 when someone you refer is placed with a Delta Construction Partners client and completes the
            guarantee period. The amount depends on the level of the role, from up to $2,500 for field positions to up to $10,000 for
            executive leadership.
          </p>
        }
      >
        <CtaLink href="/signup" className="w-full sm:w-auto">
          Start referring <ArrowRight aria-hidden className="h-4 w-4" />
        </CtaLink>
        <CtaLink href="#when" variant="ghost" className="w-full sm:w-auto">
          When you get paid
        </CtaLink>
      </PageHero>

      <Crumbs items={CRUMBS} />

      {/* The ladder: heading and conditions on the left, the four rungs on the right (phones: heading, rungs, conditions). */}
      <Band first labelledBy="tiers-title">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-12">
          <Reveal className="lg:col-start-1 lg:row-start-1">
            <Heading
              id="tiers-title"
              title="Payout tiers by role"
              intro="Find the job your referral would be hired into. Its tier sets the most that referral can pay you."
            />
          </Reveal>
          <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <RewardLadder />
          </div>
          <Reveal className="lg:col-start-1 lg:row-start-2">
            <ul className="border-t border-[color:var(--site-rule)]">
              {CONDITIONS.map((c) => (
                <li key={c.title} className="border-b border-[color:var(--site-rule)] py-4">
                  <p className="font-display text-[15.5px] font-semibold tracking-[-0.01em] text-ecrn-ink">{c.title}</p>
                  <p className="mt-1 text-pretty text-[15px] leading-[1.55] text-ecrn-secondary">{c.body}</p>
                </li>
              ))}
            </ul>
            <Link href="/terms#program" className="inner-tlink mt-2 text-[15px]">
              Read the program terms
            </Link>
          </Reveal>
        </div>
      </Band>

      {/* When you get paid: the timeline, with the guarantee period drawn to scale. */}
      <Island id="when">
        <IslandBody>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-8">
            <Reveal className="lg:col-start-1 lg:row-start-1">
              <Heading
                id="when-title"
                title="When do I get paid?"
                intro="After your referral is placed with a Delta client and completes the guarantee period, typically 90 days from their start date. That period is most of the wait."
              />
            </Reveal>
            <Reveal className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
              <PayoutTimeline />
            </Reveal>
            <Reveal className="lg:col-start-1 lg:row-start-2">
              <div className="rounded-[18px] bg-white/[0.06] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]">
                <p className="font-display text-[15.5px] font-semibold text-white">Taxes</p>
                <p className="mt-1 text-pretty text-[15px] leading-[1.55] text-white/[0.78]">
                  Referral rewards may be taxable income. Delta issues a Form 1099 where required by law.
                </p>
                <Link href="/terms#program" className="inner-tlink text-[15px]">
                  Program terms
                </Link>
              </div>
            </Reveal>
          </div>
        </IslandBody>
      </Island>

      {/* What a payout looks like, then who pays it. */}
      <Band labelledBy="example-title">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16">
          <Reveal>
            <Heading
              id="example-title"
              title="What a payout looks like"
              intro="Say you refer a foreman you've worked with and Delta places them. Once the guarantee period is complete, your reward reads like this."
            />
          </Reveal>
          <Reveal index={1}>
            <ExampleStatement className="max-w-[34rem]" />
          </Reveal>
        </div>
        <Reveal className="mt-14 sm:mt-20">
          <DeltaNote />
        </Reveal>
      </Band>

      <Band tone="white" labelledBy="payout-faq" className="border-t border-ecrn-line">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-4">
          <Heading id="payout-faq" title="Payout questions" className="lg:col-start-1 lg:row-start-1" />
          <FaqList faqs={PAGE_FAQS} className="lg:col-start-2 lg:row-span-2 lg:row-start-1" />
          <ArrowLink href="/faq" className="-mt-4 lg:col-start-1 lg:row-start-2 lg:mt-0 lg:self-start">
            All questions
          </ArrowLink>
        </div>
      </Band>

      <FinalCta />
    </>
  );
}
