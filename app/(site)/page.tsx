import Link from "next/link";
import { ArrowRight, ArrowUpRight, BadgeCheck, BookUser, Briefcase, CircleDollarSign, Lock, MapPin, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatDay } from "@/components/content/ContentBlocks";
import {
  ArrowLink,
  Container,
  CtaLink,
  DeltaBand,
  Eyebrow,
  FaqList,
  FinalCta,
  GlassCard,
  Island,
  PhotoTile,
  PoweredByDelta,
  Section,
  SectionHeading,
} from "@/components/site/Blocks";
import { JsonLd } from "@/components/site/SiteChrome";
import { SiteImage } from "@/components/site/SiteImage";
import { TierClimb } from "@/components/site/TierClimb";
import { HeroStage } from "@/components/site/home/HeroStage";
import { Marquee, Parallax, Reveal, ScrollLine, ScrollLineStep, siteVars } from "@/components/site/motion";
import { allPosts } from "@/content/blog";
import { ROLES } from "@/content/roles";
import { BLOG_CATEGORIES, readingMinutes } from "@/lib/blog/types";
import { listPublicJobs } from "@/lib/data/repository";
import { jobLocation, jobPayout, jobSalary } from "@/lib/jobs";
import { FAQS, STEPS, TIERS, faqJsonLd, pageMeta } from "@/lib/site";

export const revalidate = 600;

export const metadata = pageMeta({
  title: "ECRN: Electrical Construction Jobs & Referral Rewards",
  description:
    "Find electrical construction jobs or refer people you know and earn up to $10,000 when they're hired. Free to join. Powered by Delta Construction Partners.",
  path: "/",
});

const HOME_FAQS = FAQS.slice(0, 6);

const PROOF: [string, string][] = [
  ["Up to $10,000", "per referred hire, paid after the guarantee period"],
  ["30+ recruiters", "at Delta Construction Partners working every referral"],
  ["No cap", "Refer as many people as you want. Every placement pays."],
  ["Free to join", "One account to find your next role and to refer people."],
];

const ROLE_TICKER = TIERS.flatMap((t) => t.roles.map((role) => ({ role, amount: t.amount })));

const SKY = "#BCDFFF";

const WHY: { icon: LucideIcon; title: string; body: string; image: string; tint: "ink" | "navy" | "green"; accent?: string }[] = [
  {
    icon: Zap,
    title: "Built for electrical construction",
    body: "Not a generic platform. Built for and by the professionals who live in this industry every day.",
    image: "switchgear-room",
    tint: "ink",
  },
  {
    icon: BadgeCheck,
    title: "Powered by Delta Construction Partners",
    body: "Delta's 30+ recruiters and national contractor relationships guide every referral to its next opportunity.",
    image: "data-center-hall",
    tint: "navy",
    accent: SKY,
  },
  {
    icon: CircleDollarSign,
    title: "Structured compensation up to $10,000",
    body: "See exactly where your referral stands, from first contact to their start, through the guarantee period, to your payday.",
    image: "conduit-racks",
    tint: "green",
  },
  {
    icon: Lock,
    title: "Private when you need it",
    body: "Employed and curious? Only Delta's recruiters see that you're open to a move.",
    image: "foreman-plans",
    tint: "ink",
  },
];

function WhyTile({ item, sizes, className, large = false }: { item: (typeof WHY)[number]; sizes: string; className?: string; large?: boolean }) {
  const Icon = item.icon;
  return (
    <PhotoTile image={item.image} tint={item.tint} accent={item.accent} sizes={sizes} className={className}>
      <GlassCard weight="thin" className="absolute left-6 top-6 grid h-11 w-11 place-items-center rounded-[14px] sm:left-8 sm:top-8">
        <Icon aria-hidden className="h-5 w-5 text-[color:var(--site-accent)]" />
      </GlassCard>
      <h3 className={large ? "site-display-4 max-w-md" : "site-display-5"}>{item.title}</h3>
      <p className={large ? "mt-3 max-w-md text-[16.5px] leading-relaxed text-white/[0.86]" : "mt-2.5 text-[15.5px] leading-relaxed text-white/[0.86]"}>{item.body}</p>
    </PhotoTile>
  );
}

export default async function HomePage() {
  const jobs = (await listPublicJobs().catch(() => [])).slice(0, 4);
  const posts = allPosts.slice(0, 3);

  return (
    <>
      <JsonLd data={faqJsonLd(HOME_FAQS)} />

      {/* Hero: the photo moves slower than the page, the glass cards faster. */}
      <section data-site-hero className="site-tone-dark relative isolate overflow-clip bg-ecrn-black">
        <div className="site-hero-photo">
          <Parallax from="top" speed={0.24} className="absolute inset-0">
            <SiteImage name="hero-jobsite-dusk" priority fill sizes="(max-width: 767px) 180vw, 100vw" />
          </Parallax>
        </div>
        <div aria-hidden className="site-hero-scrim" />

        <Container className="pb-14 pt-[calc(var(--site-header-total)+2rem)] sm:pt-[calc(var(--site-header-total)+3.5rem)] lg:pb-20 lg:pt-[calc(var(--site-header-total)+4.5rem)]">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] xl:gap-14">
            <div>
              <PoweredByDelta href="#delta" className="site-enter" />
              <div className="site-enter mt-7 sm:mt-8" style={siteVars({ i: 1 })}>
                <Eyebrow light>Electrical Construction Referral Network</Eyebrow>
              </div>
              <h1 className="site-display-1 site-enter mt-4" style={siteVars({ i: 2 })}>
                Get paid up to $10,000 when your referral is hired.
              </h1>
              <p className="site-lede site-enter mt-6 max-w-[36rem] text-white/[0.86]" style={siteVars({ i: 3 })}>
                ECRN is the free network for electrical construction professionals. Refer the people you know, or find your own next
                role. Delta Construction Partners handles everything from vetting to placement.
              </p>
              <div className="site-enter mt-8 flex flex-col gap-3 sm:flex-row" style={siteVars({ i: 4 })}>
                <CtaLink href="/signup">
                  Sign up free <ArrowRight aria-hidden className="h-4 w-4" />
                </CtaLink>
                <CtaLink href="/how-it-works" variant="ghost">
                  See how it works
                </CtaLink>
              </div>
              <p className="site-enter mt-6 font-display text-[17px] tracking-[-0.01em] text-[#91F9B3]" style={siteVars({ i: 5 })}>
                Power your connections.
              </p>
            </div>

            <HeroStage />
          </div>

          {/* Proof, on one sheet of glass (it carries its own entrance: see the backdrop note in site.css). */}
          <dl className="site-glass site-enter mt-14 grid grid-cols-2 rounded-[24px] lg:mt-16 lg:grid-cols-4" style={siteVars({ i: 9 })}>
            {PROOF.map(([value, label], i) => (
              <div
                key={value}
                className={[
                  "flex flex-col-reverse justify-end gap-1.5 p-5 sm:p-6 lg:px-7 lg:py-7",
                  i % 2 === 1 ? "border-l border-white/10" : "",
                  i > 1 ? "border-t border-white/10 lg:border-t-0" : "",
                  i === 2 ? "lg:border-l" : "",
                ].join(" ")}
              >
                <dt className="text-[13px] leading-snug text-white/[0.82] sm:text-[14.5px]">{label}</dt>
                <dd className="site-num text-[21px] font-semibold leading-tight text-[#BCDFFF] sm:text-[26px]">{value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* Who is behind it */}
      <DeltaBand tone="dark" className="pb-24 pt-10 sm:pb-28 sm:pt-12 lg:pb-40 lg:pt-16" />

      {/* Two ways */}
      <Section tone="paper" sheet>
        <Reveal>
          <SectionHeading
            eyebrow="One account, two ways to win"
            title="Refer the people you know. Or find your own next role."
            intro="Every ECRN member can do both from the same account, on the web or in the app for iPhone and Android."
          />
        </Reveal>
        <div className="mt-12 grid gap-5 lg:mt-16 lg:grid-cols-2 lg:gap-6">
          <Reveal>
            <PhotoTile image="handshake-site" tint="navy" accent={SKY} sizes="(min-width: 1024px) 560px, 100vw" className="site-link-host min-h-[27rem] lg:min-h-[36rem]">
              <GlassCard weight="thin" className="absolute left-6 top-6 flex items-center gap-2 rounded-full py-2 pl-3 pr-4 font-display text-[13.5px] font-medium sm:left-8 sm:top-8">
                <BookUser aria-hidden className="h-4 w-4 text-[#BCDFFF]" />
                Refer
              </GlassCard>
              <h3 className="site-display-4">Refer and earn</h3>
              <p className="mt-3 max-w-md text-[16.5px] leading-relaxed text-white/[0.86]">
                Pick people straight from your phone&apos;s contacts. ECRN fills in their details. When Delta places them, you earn up
                to $10,000.
              </p>
              <ArrowLink href="/referral-rewards" className="mt-4 self-start after:absolute after:inset-0">
                See referral rewards
              </ArrowLink>
            </PhotoTile>
          </Reveal>
          <Reveal index={1} className="lg:mt-20">
            <PhotoTile image="crew-on-lift" tint="green" sizes="(min-width: 1024px) 560px, 100vw" className="site-link-host min-h-[27rem] lg:min-h-[36rem]">
              <GlassCard weight="thin" className="absolute left-6 top-6 flex items-center gap-2 rounded-full py-2 pl-3 pr-4 font-display text-[13.5px] font-medium sm:left-8 sm:top-8">
                <Briefcase aria-hidden className="h-4 w-4 text-[#91F9B3]" />
                Apply
              </GlassCard>
              <h3 className="site-display-4">Find your next role</h3>
              <p className="mt-3 max-w-md text-[16.5px] leading-relaxed text-white/[0.86]">
                See jobs closest to you, apply in one tap with your profile, and let Delta&apos;s recruiters do the legwork.
              </p>
              <p className="mt-3 flex items-center gap-2 text-[14.5px] text-white/[0.86]">
                <Lock aria-hidden className="h-4 w-4 shrink-0 text-[#91F9B3]" /> Employed? Look privately. Your employer never sees it.
              </p>
              <ArrowLink href="/jobs" className="mt-4 self-start after:absolute after:inset-0">
                Browse open jobs
              </ArrowLink>
            </PhotoTile>
          </Reveal>
        </div>
      </Section>

      {/* How it works: current travels down the conduit as you read. */}
      <Island>
        <div aria-hidden className="site-grid-bg" />
        <div aria-hidden className="site-glow -left-48 top-10 h-[36rem] w-[36rem]" style={siteVars({ "glow-color": "rgba(22, 193, 114, 0.16)" })} />
        <div aria-hidden className="site-glow -bottom-56 -right-40 h-[38rem] w-[38rem]" style={siteVars({ "glow-color": "rgba(6, 85, 206, 0.2)" })} />
        <Container className="relative grid gap-6 py-20 sm:py-24 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20 lg:py-32">
          <div className="lg:sticky lg:top-[calc(var(--site-header-h)+3.5rem)] lg:self-start">
            <Reveal>
              <SectionHeading eyebrow="The process" title="One network. Four steps. Real compensation." />
              <ArrowLink href="/how-it-works" className="mt-5">
                How ECRN works, step by step
              </ArrowLink>
            </Reveal>
          </div>
          <ScrollLine>
            {STEPS.map((s) => (
              <ScrollLineStep key={s.n} marker={s.n}>
                <h3 className="site-display-4">{s.title}</h3>
                <p className="mt-3 max-w-md text-[17px] leading-relaxed text-white/[0.82]">{s.body}</p>
              </ScrollLineStep>
            ))}
          </ScrollLine>
        </Container>
      </Island>

      {/* Reward tiers, then the roles they cover */}
      <Section tone="paper" bare className="pb-0 sm:pb-0 lg:pb-0">
        <Container>
          <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <SectionHeading
              eyebrow="Referral compensation"
              title="What you earn when your referral is hired"
              intro="Payouts rise with the level of the role filled, up to $10,000 for executive leadership. Amounts are estimates, confirmed in writing before payout."
            />
            <ArrowLink href="/referral-rewards" className="shrink-0">
              Payout tiers and conditions
            </ArrowLink>
          </Reveal>
          <TierClimb className="mt-12 lg:mt-16" />
        </Container>
        <div className="mt-16 border-y border-[color:var(--site-rule)] py-5 lg:mt-24 lg:py-6">
          <Marquee
            label="Roles that earn a referral reward"
            duration={48}
            itemClassName="flex items-center"
            items={ROLE_TICKER.map((r) => (
              <span key={r.role} className="flex items-center">
                <span className="flex items-baseline gap-3">
                  <span className="font-display text-[21px] font-medium tracking-[-0.02em] text-ecrn-ink sm:text-[26px]">{r.role}</span>
                  <span className="site-eyebrow text-cobalt">{r.amount}</span>
                </span>
                <span aria-hidden className="mx-7 h-1.5 w-1.5 rounded-full bg-ecrn-green sm:mx-9" />
              </span>
            ))}
          />
        </div>
      </Section>

      {/* Open jobs */}
      {jobs.length > 0 && (
        <Section tone="paper">
          <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
            <SectionHeading eyebrow="Open roles" title="Electrical construction jobs hiring now" />
            <ArrowLink href="/jobs" className="shrink-0">
              All open jobs
            </ArrowLink>
          </Reveal>
          <Reveal group as="ul" className="mt-10 grid gap-4 md:grid-cols-2 lg:mt-14">
            {jobs.map((j, i) => {
              const salary = jobSalary(j);
              const payout = jobPayout(j);
              return (
                <li key={j.id} className="site-reveal-item" style={siteVars({ i })}>
                  <Link href={`/jobs/${j.id}`} className="site-card site-lift flex h-full items-start justify-between gap-4 rounded-[20px] p-6">
                    <span className="block min-w-0">
                      <h3 className="site-display-5 text-ecrn-ink">{j.title}</h3>
                      <span className="mt-2 flex items-start gap-1.5 text-[14.5px] leading-snug text-ecrn-secondary">
                        <MapPin aria-hidden className="mt-px h-4 w-4 shrink-0" />
                        <span>
                          {jobLocation(j)}
                          {salary ? ` · ${salary}` : ""}
                        </span>
                      </span>
                      {payout ? (
                        <span className="mt-4 inline-flex rounded-full bg-delta-surface px-3 py-1.5 font-display text-[13.5px] font-medium text-cobalt">
                          Refer and earn up to {payout}
                        </span>
                      ) : null}
                    </span>
                    <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ecrn-paper text-ecrn-ink shadow-[inset_0_0_0_1px_#D9DFD8]">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </Reveal>
        </Section>
      )}

      {/* Why ECRN */}
      <Section tone="paper" className={jobs.length > 0 ? "pt-0 sm:pt-0 lg:pt-0" : undefined}>
        <Reveal>
          <SectionHeading eyebrow="Why ECRN" title="Built for electrical construction, backed by Delta." />
        </Reveal>
        <div className="mt-12 grid gap-4 lg:mt-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-5">
          <div className="grid gap-4 lg:order-2 lg:gap-5">
            <Reveal>
              <WhyTile item={WHY[0]} large sizes="(min-width: 1024px) 660px, 100vw" className="min-h-[20rem] lg:min-h-[22rem]" />
            </Reveal>
            <div className="grid gap-4 sm:grid-cols-2 lg:gap-5">
              <Reveal index={1}>
                <WhyTile item={WHY[1]} sizes="(min-width: 1024px) 330px, (min-width: 640px) 50vw, 100vw" className="h-full min-h-[20rem]" />
              </Reveal>
              <Reveal index={2}>
                <WhyTile item={WHY[2]} sizes="(min-width: 1024px) 330px, (min-width: 640px) 50vw, 100vw" className="h-full min-h-[20rem]" />
              </Reveal>
            </div>
          </div>
          <Reveal index={1} className="lg:order-1">
            <WhyTile item={WHY[3]} large sizes="(min-width: 1024px) 470px, 100vw" className="h-full min-h-[22rem]" />
          </Reveal>
        </div>
      </Section>

      {/* From the blog and the career guides (each part hides while its list is empty) */}
      {(posts.length > 0 || ROLES.length > 0) && (
        <Section tone="white" className="border-y border-ecrn-line">
          {posts.length > 0 && (
            <div>
              <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
                <SectionHeading eyebrow="From the blog" title="Straight answers on pay, referrals and careers" />
                <ArrowLink href="/blog" className="shrink-0">
                  All articles
                </ArrowLink>
              </Reveal>
              <Reveal group as="ul" className="mt-10 grid gap-x-6 gap-y-10 md:grid-cols-3 lg:mt-14">
                {posts.map((p, i) => (
                  <li key={p.slug} className="site-reveal-item" style={siteVars({ i })}>
                    <Link href={`/blog/${p.slug}`} className="site-zoom-host group block">
                      <span className="site-frame block rounded-[20px]">
                        <SiteImage name={p.cover} ratio="16 / 10" sizes="(min-width: 768px) 380px, 100vw" className="site-zoom" />
                      </span>
                      <span className="site-eyebrow mt-5 block text-[color:var(--site-accent)]">{BLOG_CATEGORIES[p.category].label}</span>
                      <h3 className="site-display-5 mt-2 text-ecrn-ink underline-offset-4 group-hover:underline">{p.title}</h3>
                      <span className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-ecrn-secondary">{p.description}</span>
                      <span className="mt-3 block text-[13px] text-[color:var(--site-fg-3)]">
                        {formatDay(p.publishedAt)} · {readingMinutes(p)} min read
                      </span>
                    </Link>
                  </li>
                ))}
              </Reveal>
            </div>
          )}

          {ROLES.length > 0 && (
            <div className={posts.length > 0 ? "mt-16 border-t border-ecrn-line pt-16 lg:mt-24 lg:pt-24" : undefined}>
              <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
                <SectionHeading eyebrow="Career guides" title="What each role does, pays and needs" />
                <ArrowLink href="/careers" className="shrink-0">
                  All career guides
                </ArrowLink>
              </Reveal>
              <Reveal group as="ul" className="mt-10 grid gap-3 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3">
                {ROLES.map((r, i) => (
                  <li key={r.slug} className="site-reveal-item" style={siteVars({ i })}>
                    <Link href={`/careers/${r.slug}`} className="site-card site-lift flex h-full items-center justify-between gap-4 rounded-[18px] px-5 py-4">
                      <span className="block min-w-0">
                        <h3 className="site-display-5 text-ecrn-ink">{r.title}</h3>
                        <span className="mt-1 block text-[13.5px] text-cobalt">Referral reward {(TIERS[r.tierIndex]?.amount ?? "").toLowerCase()}</span>
                      </span>
                      <ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-ecrn-secondary" />
                    </Link>
                  </li>
                ))}
              </Reveal>
            </div>
          )}
        </Section>
      )}

      {/* FAQ */}
      <Section tone="paper">
        <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <SectionHeading eyebrow="FAQ" title="Questions worth asking" />
          <ArrowLink href="/faq" className="shrink-0">
            All questions
          </ArrowLink>
        </Reveal>
        <div className="mt-10 lg:mt-14">
          <FaqList faqs={HOME_FAQS} />
        </div>
      </Section>

      <FinalCta />
    </>
  );
}
