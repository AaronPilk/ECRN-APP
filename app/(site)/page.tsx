import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, ArrowUpRight, BookUser, Briefcase, Lock, MapPin } from "lucide-react";
import { formatDay } from "@/components/content/ContentBlocks";
import {
  ArrowLink,
  Container,
  CtaLink,
  DeltaBadge,
  DeltaBand,
  Eyebrow,
  FaqList,
  FinalCta,
  GlassCard,
  Island,
  PhotoTile,
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
import { cn } from "@/lib/utils/cn";

export const revalidate = 600;

export const metadata = pageMeta({
  title: "ECRN: Electrical Construction Jobs & Referral Rewards",
  description:
    "Find electrical construction jobs or refer people you know and earn up to $10,000 when they're hired. Free to join. Powered by Delta Construction Partners.",
  path: "/",
});

const HOME_FAQS = FAQS.slice(0, 6);

/** Short values, so every tile holds its figure on one line in a two-up grid at 360 px. */
const PROOF: [string, string][] = [
  ["$10,000", "Top payout per referred hire, after the guarantee period"],
  ["30+", "Delta recruiters working every referral"],
  ["No cap", "on how many people you can refer"],
  ["Free", "to join: one account to apply and to refer"],
];

const ROLE_TICKER = TIERS.flatMap((t) => t.roles.map((role) => ({ role, amount: t.amount })));

const SKY = "#BCDFFF";

const WHY: { title: string; body: string; image: string; tint: "ink" | "navy" | "green"; accent?: string }[] = [
  {
    title: "Built for electrical construction",
    body: "Not a generic platform. Built for and by the professionals who live in this industry every day.",
    image: "switchgear-room",
    tint: "ink",
  },
  {
    title: "Powered by Delta Construction Partners",
    body: "Delta's 30+ recruiters and national contractor relationships guide every referral to its next opportunity.",
    image: "data-center-hall",
    tint: "navy",
    accent: SKY,
  },
  {
    title: "Structured compensation up to $10,000",
    body: "See exactly where your referral stands, from first contact to their start, through the guarantee period, to your payday.",
    image: "conduit-racks",
    tint: "green",
  },
  {
    title: "Private when you need it",
    body: "Employed and curious? Only Delta's recruiters see that you're open to a move.",
    image: "foreman-plans",
    tint: "ink",
  },
];

function WhyTile({ item, sizes, className, large = false }: { item: (typeof WHY)[number]; sizes: string; className?: string; large?: boolean }) {
  return (
    <PhotoTile image={item.image} tint={item.tint} accent={item.accent} sizes={sizes} className={className}>
      <h3 className={large ? "site-display-4 max-w-md" : "site-display-5"}>{item.title}</h3>
      <p className={large ? "mt-2.5 max-w-md text-[16px] leading-[1.6] text-white/[0.86] sm:text-[16.5px]" : "mt-2.5 text-[15.5px] leading-[1.6] text-white/[0.86]"}>{item.body}</p>
    </PhotoTile>
  );
}

/**
 * A section's "see all" link: beside the heading from lg, after the content
 * on phones (where it reads as the next step instead of pushing the content
 * down). Rendered twice; the hidden copy is display: none.
 */
function SeeAll({ href, children, where }: { href: string; children: string; where: "top" | "bottom" }) {
  return (
    <ArrowLink href={href} className={cn("shrink-0", where === "top" ? "hidden lg:inline-flex" : "mt-6 lg:hidden")}>
      {children}
    </ArrowLink>
  );
}

export default function HomePage() {
  const posts = allPosts.slice(0, 3);

  return (
    <>
      <JsonLd data={faqJsonLd(HOME_FAQS)} />

      {/* Hero: the photo moves slower than the page; from lg the glass cards move faster. */}
      <section data-site-hero className="site-tone-dark relative isolate overflow-clip bg-ecrn-black">
        <div className="site-hero-photo">
          <Parallax from="top" speed={0.24} className="absolute inset-0">
            <SiteImage name="hero-jobsite-dusk" priority fill sizes="(max-width: 767px) 180vw, 100vw" />
          </Parallax>
        </div>
        <div aria-hidden className="site-hero-scrim" />

        <Container className="pb-14 pt-[calc(var(--site-header-total)+1.5rem)] sm:pt-[calc(var(--site-header-total)+3.5rem)] lg:pb-20 lg:pt-[calc(var(--site-header-total)+4.5rem)]">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] xl:gap-14">
            <div>
              {/* Glass: it carries its own entrance (see the backdrop note in site.css). */}
              <DeltaBadge href="#delta" className="site-enter" />
              <div className="site-enter mt-6 sm:mt-8" style={siteVars({ i: 1 })}>
                <Eyebrow light>Electrical Construction Referral Network</Eyebrow>
              </div>
              <h1 className="site-display-1 site-enter mt-3" style={siteVars({ i: 2 })}>
                Get paid up to $10,000 when your referral is hired.
              </h1>
              <p className="site-lede site-enter mt-4 max-w-[36rem] text-white/[0.86] sm:mt-6" style={siteVars({ i: 3 })}>
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
              <p className="site-enter mt-5 font-display text-[17px] tracking-[-0.01em] text-[#91F9B3] sm:mt-6" style={siteVars({ i: 5 })}>
                Power your connections.
              </p>
            </div>

            <HeroStage />
          </div>

          {/* Proof, on one sheet of glass (it carries its own entrance: see the backdrop note in site.css). */}
          <dl className="site-glass site-enter mt-10 grid grid-cols-2 rounded-[22px] sm:mt-14 lg:mt-16 lg:grid-cols-4 lg:rounded-[24px]" style={siteVars({ i: 9 })}>
            {PROOF.map(([value, label], i) => (
              <div
                key={value}
                className={cn(
                  "flex min-w-0 flex-col-reverse justify-end gap-1.5 p-4 sm:p-6 lg:px-7 lg:py-7",
                  i % 2 === 1 && "border-l border-white/10",
                  i > 1 && "border-t border-white/10 lg:border-t-0",
                  i === 2 && "lg:border-l"
                )}
              >
                <dt className="text-[13.5px] leading-snug text-white/[0.82] sm:text-[14.5px]">{label}</dt>
                <dd className="site-num whitespace-nowrap text-[26px] font-semibold leading-none text-[#BCDFFF] sm:text-[30px]">{value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      {/* Who is behind it (the hero badge links here). */}
      <DeltaBand tone="dark" className="pb-[5.25rem] pt-2 sm:pb-[6.5rem] sm:pt-4 lg:pb-32 lg:pt-8" />

      {/* Two ways */}
      <Section tone="paper" sheet>
        <Reveal>
          <SectionHeading
            title="Refer the people you know. Or find your own next role."
            intro="Every ECRN member can do both from the same account, on the web or in the app for iPhone and Android."
          />
        </Reveal>
        <div className="mt-8 grid gap-4 lg:mt-14 lg:grid-cols-2 lg:gap-6">
          <Reveal>
            <PhotoTile image="handshake-site" tint="navy" accent={SKY} sizes="(min-width: 1024px) 560px, 100vw" className="site-link-host min-h-[23rem] sm:min-h-[27rem] lg:min-h-[36rem]">
              <GlassCard weight="thin" className="absolute left-5 top-5 flex items-center gap-2 rounded-full py-2 pl-3 pr-4 font-display text-[14px] font-medium sm:left-8 sm:top-8">
                <BookUser aria-hidden className="h-4 w-4 text-[#BCDFFF]" />
                Refer
              </GlassCard>
              <h3 className="site-display-4">Refer and earn</h3>
              <p className="mt-2.5 max-w-md text-[16px] leading-[1.6] text-white/[0.86] sm:text-[16.5px]">
                Pick people straight from your phone&apos;s contacts. ECRN fills in their details. When Delta places them, you earn up
                to $10,000.
              </p>
              <ArrowLink href="/referral-rewards" className="mt-3 self-start after:absolute after:inset-0">
                See referral rewards
              </ArrowLink>
            </PhotoTile>
          </Reveal>
          <Reveal index={1} className="lg:mt-20">
            <PhotoTile image="crew-on-lift" tint="green" sizes="(min-width: 1024px) 560px, 100vw" className="site-link-host min-h-[23rem] sm:min-h-[27rem] lg:min-h-[36rem]">
              <GlassCard weight="thin" className="absolute left-5 top-5 flex items-center gap-2 rounded-full py-2 pl-3 pr-4 font-display text-[14px] font-medium sm:left-8 sm:top-8">
                <Briefcase aria-hidden className="h-4 w-4 text-[#91F9B3]" />
                Apply
              </GlassCard>
              <h3 className="site-display-4">Find your next role</h3>
              <p className="mt-2.5 max-w-md text-[16px] leading-[1.6] text-white/[0.86] sm:text-[16.5px]">
                See jobs closest to you, apply in one tap with your profile, and let Delta&apos;s recruiters do the legwork.
              </p>
              <p className="mt-3 flex items-start gap-2 text-[15px] leading-snug text-white/[0.86]">
                <Lock aria-hidden className="mt-[2px] h-4 w-4 shrink-0 text-[#91F9B3]" /> Employed? Look privately. Your employer never sees it.
              </p>
              <ArrowLink href="/jobs" className="mt-3 self-start after:absolute after:inset-0">
                Browse open jobs
              </ArrowLink>
            </PhotoTile>
          </Reveal>
        </div>
      </Section>

      {/* How it works: current travels down the conduit as you read. */}
      <Island>
        <div aria-hidden className="site-grid-bg" />
        <div aria-hidden className="site-glow -bottom-56 -right-40 h-[36rem] w-[36rem]" style={siteVars({ "glow-color": "rgba(6, 85, 206, 0.2)" })} />
        <Container className="relative grid gap-2 py-14 sm:gap-6 sm:py-20 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-20 lg:py-28">
          <div className="lg:sticky lg:top-[calc(var(--site-header-h)+3.5rem)] lg:self-start">
            <Reveal>
              <SectionHeading title="One network. Four steps. Real compensation." />
              <ArrowLink href="/how-it-works" className="mt-3 lg:mt-5">
                How ECRN works, step by step
              </ArrowLink>
            </Reveal>
          </div>
          <ScrollLine>
            {STEPS.map((s) => (
              <ScrollLineStep key={s.n} marker={s.n}>
                <h3 className="site-display-4">{s.title}</h3>
                <p className="mt-2.5 max-w-md text-[16px] leading-[1.6] text-white/[0.82] sm:text-[17px]">{s.body}</p>
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
            <SeeAll href="/referral-rewards" where="top">
              Payout tiers and conditions
            </SeeAll>
          </Reveal>
          <TierClimb className="mt-8 lg:mt-14" />
          <SeeAll href="/referral-rewards" where="bottom">
            Payout tiers and conditions
          </SeeAll>
        </Container>
        <div className="mt-12 border-y border-[color:var(--site-rule)] py-4 lg:mt-20 lg:py-6">
          <Marquee
            label="Roles that earn a referral reward"
            duration={48}
            itemClassName="flex items-center"
            items={ROLE_TICKER.map((r) => (
              <span key={r.role} className="flex items-center">
                <span className="flex items-baseline gap-2.5">
                  <span className="font-display text-[20px] font-medium tracking-[-0.02em] text-ecrn-ink sm:text-[26px]">{r.role}</span>
                  <span className="font-display text-[13px] font-semibold text-cobalt sm:text-[14px]">{r.amount}</span>
                </span>
                <span aria-hidden className="mx-6 h-1.5 w-1.5 rounded-full bg-ecrn-green sm:mx-9" />
              </span>
            ))}
          />
        </div>
      </Section>

      {/* Open jobs: the page renders at once while current openings stream in below. */}
      <Section tone="paper">
        <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <SectionHeading title="Electrical construction jobs hiring now" />
          <SeeAll href="/jobs" where="top">
            All open jobs
          </SeeAll>
        </Reveal>
        <Suspense fallback={<p role="status" className="mt-8 min-h-[180px] text-[15px] text-ecrn-secondary lg:mt-12">Loading current openings…</p>}>
          <CurrentOpenings />
        </Suspense>
        <SeeAll href="/jobs" where="bottom">
          All open jobs
        </SeeAll>
      </Section>

      {/* Why ECRN */}
      <Section tone="paper" className="pt-0 sm:pt-0 lg:pt-0">
        <Reveal>
          <SectionHeading title="Built for electrical construction, backed by Delta." />
        </Reveal>
        <div className="mt-8 grid gap-3 sm:gap-4 lg:mt-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-5">
          <div className="grid gap-3 sm:gap-4 lg:order-2 lg:gap-5">
            <Reveal>
              <WhyTile item={WHY[0]} large sizes="(min-width: 1024px) 660px, 100vw" className="min-h-[16rem] sm:min-h-[20rem] lg:min-h-[22rem]" />
            </Reveal>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:gap-5">
              <Reveal index={1}>
                <WhyTile item={WHY[1]} sizes="(min-width: 1024px) 330px, (min-width: 640px) 50vw, 100vw" className="h-full min-h-[16rem] sm:min-h-[20rem]" />
              </Reveal>
              <Reveal index={2}>
                <WhyTile item={WHY[2]} sizes="(min-width: 1024px) 330px, (min-width: 640px) 50vw, 100vw" className="h-full min-h-[16rem] sm:min-h-[20rem]" />
              </Reveal>
            </div>
          </div>
          <Reveal index={1} className="lg:order-1">
            <WhyTile item={WHY[3]} large sizes="(min-width: 1024px) 470px, 100vw" className="h-full min-h-[16rem] sm:min-h-[22rem]" />
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
                <SeeAll href="/blog" where="top">
                  All articles
                </SeeAll>
              </Reveal>
              {/* Phones: the newest post large, the next two as compact rows. From md: three columns. */}
              <Reveal group as="ul" className="mt-8 grid gap-5 md:grid-cols-3 md:gap-x-6 md:gap-y-10 lg:mt-12">
                {posts.map((p, i) => (
                  <li key={p.slug} className={cn("site-reveal-item", i > 0 && "border-t border-ecrn-line pt-5 md:border-t-0 md:pt-0")} style={siteVars({ i })}>
                    <Link
                      href={`/blog/${p.slug}`}
                      className={cn("site-zoom-host group", i === 0 ? "block" : "grid grid-cols-[6.5rem_minmax(0,1fr)] items-start gap-4 md:block")}
                    >
                      <span className={cn("site-frame block", i === 0 ? "aspect-[16/10] rounded-[20px]" : "aspect-square rounded-[14px] md:aspect-[16/10] md:rounded-[20px]")}>
                        <SiteImage name={p.cover} fill sizes={i === 0 ? "(min-width: 768px) 380px, 100vw" : "(min-width: 768px) 380px, 104px"} className="site-zoom" />
                      </span>
                      <div className="min-w-0">
                        <p className={cn("site-eyebrow text-[color:var(--site-accent)]", i === 0 ? "mt-4" : "md:mt-4")}>{BLOG_CATEGORIES[p.category].label}</p>
                        <h3 className="site-display-5 mt-1.5 text-ecrn-ink underline-offset-4 [@media(hover:hover)]:group-hover:underline">{p.title}</h3>
                        <p className={cn("mt-2 line-clamp-2 text-[15px] leading-[1.55] text-ecrn-secondary", i > 0 && "hidden md:block")}>{p.description}</p>
                        <p className="mt-2 text-[13px] text-[color:var(--site-fg-3)]">
                          {formatDay(p.publishedAt)} · {readingMinutes(p)} min read
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </Reveal>
              <SeeAll href="/blog" where="bottom">
                All articles
              </SeeAll>
            </div>
          )}

          {ROLES.length > 0 && (
            <div className={posts.length > 0 ? "mt-14 border-t border-ecrn-line pt-14 lg:mt-24 lg:pt-24" : undefined}>
              <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
                <SectionHeading eyebrow="Career guides" title="What each role does, pays and needs" />
                <SeeAll href="/careers" where="top">
                  All career guides
                </SeeAll>
              </Reveal>
              <Reveal group as="ul" className="mt-8 grid gap-3 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3">
                {ROLES.map((r, i) => (
                  <li key={r.slug} className="site-reveal-item" style={siteVars({ i })}>
                    <Link href={`/careers/${r.slug}`} className="site-card site-lift flex h-full min-h-[4.5rem] items-center justify-between gap-4 rounded-[18px] px-5 py-4">
                      <div className="min-w-0">
                        <h3 className="site-display-5 text-ecrn-ink">{r.title}</h3>
                        <p className="mt-1 text-[14px] text-cobalt">Referral reward {(TIERS[r.tierIndex]?.amount ?? "").toLowerCase()}</p>
                      </div>
                      <ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-ecrn-secondary" />
                    </Link>
                  </li>
                ))}
              </Reveal>
              <SeeAll href="/careers" where="bottom">
                All career guides
              </SeeAll>
            </div>
          )}
        </Section>
      )}

      {/* FAQ */}
      <Section tone="paper">
        <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <SectionHeading title="Questions worth asking" />
          <SeeAll href="/faq" where="top">
            All questions
          </SeeAll>
        </Reveal>
        <div className="mt-8 lg:mt-12">
          <FaqList faqs={HOME_FAQS} />
        </div>
        <SeeAll href="/faq" where="bottom">
          All questions
        </SeeAll>
      </Section>

      <FinalCta />
    </>
  );
}

/** The remote job query does not delay the rest of the landing page. */
async function CurrentOpenings() {
  const jobs = (await listPublicJobs().catch(() => [])).filter((job) => job.status === "open").slice(0, 4);
  if (!jobs.length) {
    return <p className="mt-8 text-[15px] text-ecrn-secondary">No open roles are listed right now. Check the job board for new opportunities.</p>;
  }
  return (
    <Reveal group as="ul" className="mt-8 grid gap-3 md:grid-cols-2 md:gap-4 lg:mt-12">
      {jobs.map((j, i) => {
        const salary = jobSalary(j);
        const payout = jobPayout(j);
        return (
          <li key={j.id} className="site-reveal-item" style={siteVars({ i })}>
            <Link href={`/jobs/${j.id}`} className="site-card site-lift flex h-full items-start gap-4 rounded-[20px] p-5 sm:p-6">
              <div className="min-w-0 flex-1">
                <h3 className="site-display-5 text-ecrn-ink">{j.title}</h3>
                <p className="mt-1.5 flex items-start gap-1.5 text-[15px] leading-snug text-ecrn-secondary">
                  <MapPin aria-hidden className="mt-[2px] h-4 w-4 shrink-0" />
                  <span>
                    {jobLocation(j)}
                    {salary ? ` · ${salary}` : ""}
                  </span>
                </p>
                {payout ? (
                  <p className="mt-3.5 inline-flex rounded-full bg-delta-surface px-3 py-1.5 font-display text-[13.5px] font-medium text-cobalt">
                    Refer and earn up to {payout}
                  </p>
                ) : null}
              </div>
              <span aria-hidden className="-mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ecrn-paper text-ecrn-ink shadow-[inset_0_0_0_1px_#D9DFD8]">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          </li>
        );
      })}
    </Reveal>
  );
}
