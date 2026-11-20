import { Breadcrumbs, Container, CtaLink, Eyebrow, FinalCta, PageHero } from "@/components/site/Blocks";
import { JsonLd } from "@/components/site/SiteChrome";
import { breadcrumbJsonLd, pageMeta } from "@/lib/site";

export const metadata = pageMeta({
  title: "About ECRN: A Delta Construction Partners Initiative | ECRN",
  description:
    "ECRN is the Electrical Construction Referral Network, built by Delta Construction Partners to reward the connections electrical pros already have.",
  path: "/about",
});

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <PageHero
        eyebrow="About ECRN"
        title="A platform that formalizes what you already do"
        intro={
          <p>
            ECRN is the Electrical Construction Referral Network, an initiative of Delta Construction Partners. It rewards electrical
            construction professionals for the connections they&apos;ve built over their careers and helps them find their own next role.
          </p>
        }
      />
      <Container className="py-6">
        <Breadcrumbs items={CRUMBS} />
      </Container>

      <section className="pb-16">
        <Container className="max-w-4xl space-y-6 text-[17px] leading-relaxed text-ecrn-secondary">
          <h2 className="font-display text-[32px] font-semibold tracking-[-0.03em] text-ecrn-ink">Why ECRN exists</h2>
          <p>
            Ask any electrical construction expert where the best hires come from and they&apos;ll tell you: industry referrals. You&apos;ve
            invested years building relationships in the most dynamic construction vertical of all. ECRN puts those connections to work
            and pays you for them.
          </p>
          <div className="grid sm:grid-cols-2 gap-5 pt-4">
            <div className="rounded-[18px] border border-ecrn-line bg-white p-6">
              <Eyebrow>Our mission</Eyebrow>
              <p className="mt-2 font-display text-[21px] font-semibold text-ecrn-ink leading-snug">
                To provide a platform that powers connections between elite electrical construction professionals.
              </p>
            </div>
            <div className="rounded-[18px] border border-ecrn-line bg-white p-6">
              <Eyebrow>Our vision</Eyebrow>
              <p className="mt-2 font-display text-[21px] font-semibold text-ecrn-ink leading-snug">
                To revolutionize the way the electrical construction industry attracts, recruits, and retains top talent.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16 bg-white border-y border-ecrn-line">
        <Container className="max-w-4xl space-y-5 text-[17px] leading-relaxed text-ecrn-secondary">
          <h2 className="font-display text-[32px] font-semibold tracking-[-0.03em] text-ecrn-ink">Powered by Delta Construction Partners</h2>
          <p>
            Delta Construction Partners has built relationships with the best in the construction industry since 2008. Its dedicated
            team of 30+ recruiters and long-standing national contractor relationships guide every referral in the network to its next
            opportunity, handling vetting, coordination, and follow-up.
          </p>
          <p>
            Recruiters work every ECRN referral and application directly, so members don&apos;t need any recruiting experience. Contractors
            looking for talent can{" "}
            <a href="/hire" className="text-ecrn-green-text font-medium">
              tell Delta what they need
            </a>
            .
          </p>
          <div className="pt-2">
            <CtaLink href="/signup">Join the network</CtaLink>
          </div>
        </Container>
      </section>

      <FinalCta />
    </>
  );
}
