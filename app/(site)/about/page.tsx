import "@/components/site/inner/inner.css";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Container, CtaLink, DELTA, DeltaLogo, FinalCta, GlassCard, PageHero } from "@/components/site/Blocks";
import { JsonLd } from "@/components/site/SiteChrome";
import { SiteImage } from "@/components/site/SiteImage";
import { Parallax, Reveal } from "@/components/site/motion";
import { Band, Crumbs, Heading, Spec } from "@/components/site/inner/Kit";
import { aboutPageJsonLd, breadcrumbJsonLd, pageMeta } from "@/lib/site";

const DESCRIPTION =
  "ECRN is the Electrical Construction Referral Network, built by Delta Construction Partners to reward the connections electrical pros already have.";

export const metadata = pageMeta({
  title: "About ECRN: A Delta Construction Partners Initiative | ECRN",
  description: DESCRIPTION,
  path: "/about",
});

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "About", path: "/about" },
];

/** Delta's story, told only with the facts the site may state. */
const STORY: { when: string; what: string }[] = [
  { when: DELTA.since, what: "Delta Construction Partners starts recruiting in construction." },
  { when: "Today", what: `${DELTA.recruiters} recruiters and national contractor relationships.` },
  { when: "ECRN", what: "Delta's referral network for electrical construction. Members refer and apply; Delta's recruiters do the rest." },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <JsonLd data={aboutPageJsonLd(DESCRIPTION)} />
      <PageHero
        eyebrow="About ECRN"
        title="A platform that formalizes what you already do"
        image="substation-sunset"
        intro={
          <p>
            ECRN is the Electrical Construction Referral Network, an initiative of Delta Construction Partners. It rewards electrical
            construction professionals for the connections they&apos;ve built over their careers and helps them find their own next role.
          </p>
        }
      >
        <CtaLink href="/signup" className="w-full sm:w-auto">
          Join the network <ArrowRight aria-hidden className="h-4 w-4" />
        </CtaLink>
      </PageHero>

      <Crumbs items={CRUMBS} />

      {/* Why it exists, then the mission and vision as a pair. */}
      <Band first labelledBy="why-title">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <Reveal>
            <Heading id="why-title" title="Why ECRN exists" />
          </Reveal>
          <Reveal index={1}>
            <p className="text-pretty font-display text-[22px] font-medium leading-[1.4] tracking-[-0.018em] text-ecrn-ink sm:text-[26px]">
              Ask any electrical construction expert where the best hires come from and they&apos;ll tell you: industry referrals.
            </p>
            <p className="inner-intro mt-5">
              You&apos;ve invested years building relationships in the most dynamic construction vertical of all. ECRN puts those
              connections to work and pays you for them.
            </p>
            <dl className="mt-10 grid border-t border-ecrn-line sm:grid-cols-2">
              {[
                ["Our mission", "To provide a platform that powers connections between elite electrical construction professionals."],
                ["Our vision", "To revolutionize the way the electrical construction industry attracts, recruits, and retains top talent."],
              ].map(([label, text], i) => (
                <div key={label} className={i === 0 ? "border-b border-ecrn-line py-6 sm:border-b-0 sm:pr-8" : "py-6 sm:border-l sm:border-ecrn-line sm:pl-8"}>
                  <dt className="inner-kicker">{label}</dt>
                  <dd className="mt-2 text-pretty font-display text-[19px] font-semibold leading-[1.35] tracking-[-0.015em] text-ecrn-ink">{text}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </Band>

      {/* Delta's story: the strongest Delta moment on the site. */}
      <section id="delta" aria-labelledby="delta-title" className="site-tone-light bg-ecrn-paper pb-14 sm:pb-20 lg:pb-24">
        <Container>
          <Reveal className="inner-delta grid rounded-[28px] sm:rounded-[36px] lg:grid-cols-2">
            <div className="site-frame aspect-[4/3] lg:order-2 lg:aspect-auto lg:min-h-[36rem]">
              <Parallax cover>
                <SiteImage name="site-office-plans" fill sizes="(min-width: 1024px) 568px, calc(100vw - 40px)" />
              </Parallax>
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-b from-[#00244B]/10 via-transparent to-[#00244B] lg:bg-gradient-to-r lg:from-[#00244B] lg:via-[#00244B]/10 lg:to-transparent"
              />
              <GlassCard weight="thin" className="absolute left-4 top-4 rounded-full px-3.5 py-2 font-display text-[13px] font-medium sm:left-6 sm:top-6">
                Construction recruiting since {DELTA.since}
              </GlassCard>
            </div>

            <div className="min-w-0 p-6 sm:p-10 lg:p-14">
              <DeltaLogo size={32} />
              <h2 id="delta-title" className="inner-h2 mt-7">
                Powered by Delta Construction Partners
              </h2>
              <p className="inner-intro mt-4">
                Delta Construction Partners is a construction recruiting firm. It has built relationships with contractors since{" "}
                {DELTA.since}, and its {DELTA.recruiters} recruiters work every ECRN referral and application directly: the vetting, the
                coordination and the follow-up. That&apos;s why members don&apos;t need any recruiting experience.
              </p>

              <ol className="mt-8 border-t border-white/[0.14]">
                {STORY.map((s) => (
                  <li key={s.when} className="grid grid-cols-[5.25rem_minmax(0,1fr)] items-baseline gap-4 border-b border-white/[0.14] py-4">
                    <span className="font-display text-[24px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-[#BCDFFF]">{s.when}</span>
                    <span className="text-pretty text-[16px] leading-[1.55] text-white/[0.86]">{s.what}</span>
                  </li>
                ))}
              </ol>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <CtaLink href={DELTA.url} variant="light" className="w-full sm:w-auto">
                  Visit Delta&apos;s website <ArrowUpRight aria-hidden className="h-4 w-4" />
                </CtaLink>
                <CtaLink href="/hire" variant="ghost" className="w-full sm:w-auto">
                  Hiring? Talk to Delta
                </CtaLink>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* The short version. */}
      <Band tone="white" labelledBy="glance-title" className="border-t border-ecrn-line">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <Reveal>
            <Heading id="glance-title" title="ECRN at a glance" />
          </Reveal>
          <Reveal index={1}>
            <Spec
              rows={[
                {
                  label: "What it is",
                  value: "The Electrical Construction Referral Network: a free network and job board for electrical construction professionals.",
                },
                { label: "Who does the recruiting", value: `${DELTA.name}' ${DELTA.recruiters} recruiters, on every referral and application.` },
                { label: "What it costs", value: "Nothing. Joining is free." },
                { label: "One account", value: "Apply to open roles and refer people you know, from the same account." },
                {
                  label: "Referral rewards",
                  value: (
                    <>
                      Up to $10,000 per hire, in four tiers by role.
                      <br />
                      <Link href="/referral-rewards" className="inner-tlink text-[15px]">
                        See the tiers
                      </Link>
                    </>
                  ),
                },
                { label: "Looking privately", value: "Choose “I'm open to the right move” and only Delta's recruiters see it." },
                { label: "Where", value: "On the web, with iPhone and Android apps." },
              ]}
            />
          </Reveal>
        </div>
      </Band>

      <FinalCta />
    </>
  );
}
