import { Breadcrumbs, Container, FaqList, FinalCta, PageHero } from "@/components/site/Blocks";
import { JsonLd } from "@/components/site/SiteChrome";
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

export default function FaqPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <JsonLd data={faqJsonLd(FAQS)} />
      <PageHero
        eyebrow="FAQ"
        title="Questions worth asking"
        intro={
          <p>
            ECRN is free to join. You can earn up to $10,000 when a referral is hired, or use it to find your own next role. Here are the
            answers to what people ask most.
          </p>
        }
      />
      <Container className="py-6">
        <Breadcrumbs items={CRUMBS} />
      </Container>
      <section className="pb-16">
        <Container className="max-w-4xl">
          <FaqList faqs={FAQS} />
        </Container>
      </section>
      <FinalCta />
    </>
  );
}
