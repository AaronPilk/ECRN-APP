import Link from "next/link";
import { Breadcrumbs, Container, CtaLink, FaqList, FinalCta, PageHero } from "@/components/site/Blocks";
import { JsonLd } from "@/components/site/SiteChrome";
import { FAQS, TIERS, breadcrumbJsonLd, faqJsonLd, pageMeta } from "@/lib/site";

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

export default function RewardsPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <JsonLd data={faqJsonLd(PAGE_FAQS)} />
      <PageHero
        eyebrow="Referral compensation"
        title="Referral rewards: up to $10,000 per hire"
        intro={
          <p>
            ECRN pays up to $10,000 when someone you refer is placed with a Delta Construction Partners client and completes the
            guarantee period. The amount depends on the level of the role, from up to $2,500 for field positions to up to $10,000 for
            executive leadership.
          </p>
        }
      >
        <CtaLink href="/signup">Start referring</CtaLink>
      </PageHero>

      <Container className="py-6">
        <Breadcrumbs items={CRUMBS} />
      </Container>

      <section className="pb-16">
        <Container>
          <h2 className="font-display text-[32px] font-semibold tracking-[-0.03em] text-ecrn-ink">Payout tiers by role</h2>
          <div className="mt-6 overflow-x-auto rounded-[18px] border border-ecrn-line bg-white">
            <table className="w-full text-left text-[15px]">
              <caption className="sr-only">ECRN referral payout tiers</caption>
              <thead className="bg-ecrn-paper text-[13px] uppercase tracking-wide text-ecrn-secondary">
                <tr>
                  <th scope="col" className="px-5 py-3 font-medium">Tier</th>
                  <th scope="col" className="px-5 py-3 font-medium">Roles</th>
                  <th scope="col" className="px-5 py-3 font-medium">Estimated payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ecrn-line">
                {TIERS.map((t) => (
                  <tr key={t.tier}>
                    <td className="px-5 py-4 align-top">
                      <div className="font-semibold text-ecrn-ink">{t.tier}: {t.name}</div>
                      <div className="text-[13.5px] text-ecrn-secondary">{t.summary}</div>
                    </td>
                    <td className="px-5 py-4 align-top text-ecrn-ink">{t.roles.join(", ")}</td>
                    <td className="px-5 py-4 align-top font-display text-[20px] font-semibold text-cobalt whitespace-nowrap">{t.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[13.5px] text-ecrn-secondary">
            Elite candidates may yield a higher reward. All amounts are estimates; ECRN management makes the final payout decision.
          </p>
        </Container>
      </section>

      <section className="py-16 bg-white border-y border-ecrn-line">
        <Container className="max-w-4xl">
          <h2 className="font-display text-[32px] font-semibold tracking-[-0.03em] text-ecrn-ink">When do I get paid?</h2>
          <ol className="mt-5 space-y-4 text-[16.5px] leading-relaxed text-ecrn-secondary list-decimal pl-5">
            <li>You refer someone through ECRN (from your contacts, by hand, or with your invite link).</li>
            <li>Delta Construction Partners vets them and places them with a client.</li>
            <li>They complete the guarantee period, typically 90 days from their start date.</li>
            <li>Delta confirms the amount in writing and processes your payout.</li>
          </ol>
          <p className="mt-5 text-[15.5px] text-ecrn-secondary">
            Payouts may be taxable income; Delta issues a Form 1099 for $600 or more in a calendar year where required. Full details are in
            the{" "}
            <Link href="/terms#program" className="text-ecrn-green-text font-medium">
              referral program terms
            </Link>
            .
          </p>
        </Container>
      </section>

      <section className="py-16">
        <Container className="max-w-4xl">
          <h2 className="mb-8 font-display text-[32px] font-semibold tracking-[-0.03em] text-ecrn-ink">Payout questions</h2>
          <FaqList faqs={PAGE_FAQS} />
        </Container>
      </section>

      <FinalCta />
    </>
  );
}
