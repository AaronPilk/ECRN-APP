import "@/components/site/inner/inner.css";
import Link from "next/link";
import { Mail } from "lucide-react";
import { FaqList, FinalCta, PageHero } from "@/components/site/Blocks";
import { SUPPORT_EMAIL } from "@/components/legal/LegalPage";
import { JsonLd } from "@/components/site/SiteChrome";
import { Band, Crumbs, DeltaNote } from "@/components/site/inner/Kit";
import { FAQS, breadcrumbJsonLd, faqJsonLd, pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "ECRN FAQ: Referral Payouts, Jobs & Joining | ECRN",
  description:
    "Answers about ECRN: how referral payouts work, when you get paid, looking for a job confidentially, what it costs, and who is behind the network.",
  path: "/faq",
});

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "FAQ", path: "/faq" },
];

/** Every question in lib/site.ts, grouped by what people come here to find out. */
const GROUPS = [
  { id: "referrals", title: "Referrals and payouts", faqs: [FAQS[1], FAQS[2], FAQS[9], FAQS[6]] },
  { id: "jobs", title: "Finding a job", faqs: [FAQS[4], FAQS[5]] },
  { id: "about-ecrn", title: "About ECRN", faqs: [FAQS[0], FAQS[3], FAQS[8], FAQS[7]] },
];

/** The structured data lists the questions in the order the page shows them, word for word. */
const PAGE_FAQS = GROUPS.flatMap((g) => g.faqs);

export default function FaqPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <JsonLd data={faqJsonLd(PAGE_FAQS)} />
      <PageHero
        eyebrow="FAQ"
        title="Questions worth asking"
        image="estimating-desk"
        intro={
          <p>
            ECRN is free to join. You can earn up to $10,000 when a referral is hired, or use it to find your own next role. Here are the
            answers to what people ask most.
          </p>
        }
      />

      <Crumbs items={CRUMBS} />

      <Band first>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
          <nav aria-label="FAQ topics" className="lg:sticky lg:top-[calc(var(--site-header-total)+2.5rem)] lg:self-start">
            <p className="font-display text-[14px] font-medium text-ecrn-secondary">Jump to a topic</p>
            <ul className="mt-3 flex flex-wrap gap-2 lg:flex-col lg:gap-1">
              {GROUPS.map((g) => (
                <li key={g.id}>
                  <a
                    href={`#${g.id}`}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 font-display text-[15px] font-semibold text-ecrn-ink shadow-[inset_0_0_0_1px_#D4DBD3] active:scale-[0.97] motion-safe:transition-transform lg:rounded-[14px] lg:bg-transparent lg:px-3 lg:shadow-none"
                  >
                    {g.title}
                    <span className="font-medium tabular-nums text-ecrn-secondary">{g.faqs.length}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="grid gap-14 sm:gap-16">
            {GROUPS.map((g) => (
              <section key={g.id} id={g.id} aria-labelledby={`${g.id}-title`}>
                <h2 id={`${g.id}-title`} className="inner-h2-sm">
                  {g.title}
                </h2>
                <FaqList faqs={g.faqs} open="none" className="mt-5" />
              </section>
            ))}
          </div>
        </div>
      </Band>

      {/* Still stuck: a person, then who that person works for. */}
      <Band tone="white" className="border-t border-ecrn-line" labelledBy="ask-title">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-6">
          <div className="site-card flex flex-col rounded-[24px] p-6 sm:p-8">
            <h2 id="ask-title" className="inner-h2-sm">
              Still have a question?
            </h2>
            <p className="inner-body mt-3">
              Email the Delta Construction Partners team. You&apos;ll hear back within one business day.
            </p>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="site-btn site-btn-dark mt-6 inline-flex w-full sm:w-auto sm:self-start">
              <Mail aria-hidden className="h-4 w-4" />
              <span>Email support</span>
            </a>
            <Link href="/support" className="inner-tlink mt-2 self-start text-[15px]">
              Help and support
            </Link>
          </div>
          <DeltaNote />
        </div>
      </Band>

      <FinalCta />
    </>
  );
}
