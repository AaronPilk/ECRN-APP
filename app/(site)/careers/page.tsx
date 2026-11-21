import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs, Container, CtaLink, Eyebrow, FaqList, FinalCta, PageHero } from "@/components/site/Blocks";
import { JsonLd } from "@/components/site/SiteChrome";
import { ContentBlocks, SourcesList, formatDay } from "@/components/content/ContentBlocks";
import { DeltaBand, RoleCard, SectionHeading, ShortAnswer, usd } from "@/components/careers/CareerParts";
import { jobsForRole } from "@/components/careers/jobs";
import { PAY_PERIOD, ROLES } from "@/content/roles";
import type { Block, BlogSource } from "@/lib/blog/types";
import { listPublicJobs } from "@/lib/data/repository";
import { TIERS, absoluteUrl, breadcrumbJsonLd, faqJsonLd, pageMeta, type Faq } from "@/lib/site";
import { cn } from "@/lib/utils/cn";

export const revalidate = 600;

const TITLE = "Electrical construction careers: roles, pay and open jobs";
const ANSWER = `Electrical construction careers run from the tools to the executive office: journeyman electrician, foreman, superintendent, estimator, project manager and executive. This page shows what each role does, what Bureau of Labor Statistics data says it pays (${PAY_PERIOD}), and which roles are open on ECRN now.`;

export const metadata = pageMeta({
  title: "Electrical Construction Careers: Roles, Pay & Jobs | ECRN",
  description:
    "Six electrical construction career guides, from journeyman electrician to executive: what each role does, BLS pay for May 2025 and open jobs on ECRN.",
  path: "/careers",
});

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Careers", path: "/careers" },
];

/** One line per stage of the path (stages are the four referral tiers). */
const STAGE_NOTES = [
  "On the tools: installing, terminating and testing the work.",
  "Running a crew, then running the whole site.",
  "Pricing the work and managing the contract.",
  "Running the contractor as a business.",
];

// ── Pay table: one row per role and BLS occupation, with its own source list ──
const WAGE_ROWS = ROLES.flatMap((role) =>
  role.pay.map((p) => ({ role, p, src: role.sources.find((s) => s.id === p.source) }))
).filter((row): row is typeof row & { src: BlogSource } => Boolean(row.src));

const HUB_SOURCES: BlogSource[] = [];
const SOURCE_ID = new Map<string, number>();
for (const { src } of WAGE_ROWS) {
  if (!SOURCE_ID.has(src.url)) {
    SOURCE_ID.set(src.url, HUB_SOURCES.length + 1);
    HUB_SOURCES.push({ ...src, id: HUB_SOURCES.length + 1 });
  }
}
const RELEASE = ROLES[0].sources.find((s) => s.url.includes("bls.gov/oes"));
if (RELEASE) HUB_SOURCES.push({ ...RELEASE, id: HUB_SOURCES.length + 1 });
const RELEASE_MARK = RELEASE ? `[^${HUB_SOURCES.length}]` : "";

// On phones the table becomes one card per row (ContentBlocks), so it needs no minimum width.
const PAY_TABLE: Block[] = [
  {
    type: "table",
    caption: `Pay by role, United States, ${PAY_PERIOD}`,
    head: ["Role", "BLS occupation used", "Median pay", "10th to 90th percentile", "ECRN referral reward"],
    rows: WAGE_ROWS.map(({ role, p, src }) => [
      `[${role.title}](/careers/${role.slug})`,
      `${p.proxy ? "Proxy: " : ""}${p.short} (SOC ${p.soc})[^${SOURCE_ID.get(src.url)}]`,
      usd(p.annual.median),
      `${usd(p.annual.p10)} to ${usd(p.annual.p90)}`,
      TIERS[role.tierIndex].amount,
    ]),
    note: `Annual wages, national, all industries, from the BLS Occupational Employment and Wage Statistics survey for ${PAY_PERIOD}, the latest release.${RELEASE_MARK} Referral rewards are estimates, confirmed in writing before payout.`,
  },
  {
    type: "p",
    text: "BLS publishes an electrical-specific occupation only for electricians. For every other role the closest occupation is shown and labeled as a proxy, so read those figures as a guide to the range and not as a quote for electrical work. Superintendents and executives each sit between two BLS occupations, so both are listed.",
  },
];

const median = (slug: string, i = 0) => {
  const p = ROLES.find((r) => r.slug === slug)?.pay[i];
  return p ? usd(p.annual.median) : "";
};

const HUB_FAQS: Faq[] = [
  {
    q: "What is the career path in electrical construction?",
    a: "Most people start as an apprentice and become a journeyman electrician. From there the field path runs to foreman and superintendent, and the office path runs through estimating or project management. Either path can lead to executive roles such as vice president or chief operating officer.",
  },
  {
    q: "Which electrical construction role pays the most?",
    a: `By BLS national medians for ${PAY_PERIOD}, chief executives rank highest at ${median("electrical-construction-executive")} a year, followed by construction managers, the proxy for project managers, at ${median("electrical-project-manager")}. First-line construction supervisors (${median("electrical-foreman")}) and cost estimators (${median("electrical-estimator")}) are close together, and electricians had a median of ${median("journeyman-electrician")}.`,
  },
  {
    q: "Can you move from the field into the office?",
    a: "Yes. Foremen and superintendents move into estimating and project management. The things to add are estimating software, contracts, cost reports and billing.",
  },
  {
    q: "Does ECRN pay a referral reward for every role?",
    a: "Yes, in four tiers: up to $2,500 for field positions, $5,000 for field leadership, $7,500 for office positions and $10,000 for executive leadership. Amounts are estimates, confirmed in writing, and paid after the person is placed and completes the guarantee period, typically 90 days.",
  },
];

/** The three ways in, as a list (not three look-alike cards). */
const WAYS_IN = [
  {
    title: "Apply",
    body: "Open roles are recruited by Delta Construction Partners. Apply with your ECRN profile and a recruiter takes it from there.",
    href: "/jobs",
    label: "Open jobs",
  },
  {
    title: "Refer",
    body: "Enter a name and a phone number, or pick someone from your phone's contacts. If Delta places them, you earn up to $10,000, depending on the role.",
    href: "/referral-rewards",
    label: "Referral rewards",
  },
  {
    title: "Look quietly",
    body: "Employed and only curious? Mark yourself open to the right move. Only Delta's recruiters see it.",
    href: "/how-it-works",
    label: "How ECRN works",
  },
];

const KEEP_READING = [
  { href: "/jobs", title: "Open jobs", body: "Every role on the ECRN job board." },
  { href: "/blog", title: "Blog", body: "Guides on pay, job search and referrals." },
  { href: "/glossary", title: "Glossary", body: "Job site and hiring terms in plain language." },
];

const itemListJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Electrical construction career guides",
  numberOfItems: ROLES.length,
  itemListElement: ROLES.map((r, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: r.title,
    url: absoluteUrl(`/careers/${r.slug}`),
  })),
};

const REVIEWED = ROLES.map((r) => r.updatedAt).sort().slice(-1)[0] ?? "2026-11-20";

/** A full-width row link with the arrow on the right edge, level with the title (hover and press: careers.css). */
const ROW_LINK = "career-row grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 py-5 sm:py-6";

export default async function CareersHubPage() {
  const allJobs = (await listPublicJobs().catch(() => [])).filter((job) => job.status === "open");
  const openCount = new Map(ROLES.map((r) => [r.slug, jobsForRole(allJobs, r.jobKeywords).length]));
  const stages = TIERS.map((tier, i) => ({ tier, note: STAGE_NOTES[i], roles: ROLES.filter((r) => r.tierIndex === i) }));

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <JsonLd data={itemListJsonLd} />
      <JsonLd data={faqJsonLd(HUB_FAQS)} />

      <PageHero eyebrow="Electrical construction careers" title={TITLE} intro={<ShortAnswer text={ANSWER} />}>
        <CtaLink href="/jobs" className="w-full sm:w-auto">
          Browse open jobs <ArrowRight className="h-4 w-4" aria-hidden />
        </CtaLink>
        <CtaLink href="#pay" variant="ghost" className="w-full sm:w-auto">
          Compare pay by role
        </CtaLink>
      </PageHero>

      <Container className="pt-5 sm:pt-6">
        <div className="flex flex-wrap items-center justify-between gap-x-8">
          <Breadcrumbs items={CRUMBS} />
          <p className="text-[13px] text-ecrn-secondary">
            Last reviewed <time dateTime={REVIEWED}>{formatDay(REVIEWED)}</time>
          </p>
        </div>
      </Container>

      {/* Career path: a line runs down the four stages, field to executive. */}
      <section aria-labelledby="path-heading" className="pb-14 pt-10 sm:pb-20 sm:pt-14">
        <Container>
          <Eyebrow>Field to executive</Eyebrow>
          <SectionHeading id="path-heading" className="mt-3 max-w-3xl sm:text-[40px]">
            The electrical construction career path, role by role
          </SectionHeading>
          <p className="mt-4 max-w-2xl text-pretty text-[17px] leading-[1.6] text-ecrn-secondary">
            Most careers in this industry follow the same line: learn the trade, lead a crew, then run the site or move into the office.
            The four stages match the four ECRN referral tiers, so each one also shows what a referral at that level is worth.
          </p>

          <ol role="list" className="relative mt-8 sm:mt-12">
            <span aria-hidden className="career-path-line pointer-events-none absolute bottom-3 left-[13px] top-3 w-[2px] rounded-full sm:left-[19px]" />
            {stages.map((s, i) => (
              <li key={s.tier.tier} className="relative pb-11 pl-10 last:pb-0 sm:pb-14 sm:pl-16">
                {/* The stage number sits level with the stage name. */}
                <span
                  aria-hidden
                  className="absolute left-0 top-[3px] grid h-7 w-7 place-items-center rounded-full bg-ecrn-black font-display text-[12.5px] font-semibold tabular-nums text-[#91F9B3] ring-4 ring-ecrn-paper sm:top-0 sm:h-10 sm:w-10 sm:text-[14px]"
                >
                  {i + 1}
                </span>
                <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1">
                  <h3 className="text-balance font-display text-[23px] font-semibold leading-[1.2] tracking-[-0.02em] text-ecrn-ink sm:text-[28px]">{s.tier.name}</h3>
                  <p className="text-[14.5px] text-ecrn-secondary">
                    {s.tier.tier} referral reward: <span className="font-semibold text-cobalt">{s.tier.amount.toLowerCase()}</span>
                  </p>
                </div>
                <p className="mt-1.5 text-pretty text-[16px] leading-[1.55] text-ecrn-secondary">{s.note}</p>
                <div className={cn("mt-5 grid gap-4 sm:gap-5", s.roles.length > 1 && "md:grid-cols-2")}>
                  {s.roles.map((r) => (
                    <RoleCard key={r.slug} role={r} heading="h4" wide={s.roles.length === 1} showTier={false} openJobs={openCount.get(r.slug) ?? 0} />
                  ))}
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-pretty pl-10 text-[14px] leading-[1.55] text-ecrn-secondary sm:pl-16">
            Pay figures are BLS national medians for {PAY_PERIOD}. The{" "}
            <a href="#pay" className="py-3 font-medium text-ecrn-green-text underline decoration-ecrn-green/40 underline-offset-[3px]">
              pay table
            </a>{" "}
            below has the ranges and sources.
          </p>
        </Container>
      </section>

      {/* Pay */}
      <section id="pay" aria-labelledby="pay-heading" className="border-y border-ecrn-line bg-white py-14 sm:py-20">
        <Container className="max-w-5xl">
          <SectionHeading id="pay-heading" className="max-w-3xl">
            What does each electrical construction role pay?
          </SectionHeading>
          <ContentBlocks blocks={PAY_TABLE} className="mt-6 sm:mt-8" />
          <SourcesList sources={HUB_SOURCES} />
        </Container>
      </section>

      {/* ECRN and Delta: the heading and its point on the left, the three ways in as a list on the right. */}
      <section aria-labelledby="fit-heading" className="py-14 sm:py-20">
        <Container className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div>
            <SectionHeading id="fit-heading" className="max-w-xl">
              Where do ECRN and Delta Construction Partners fit in?
            </SectionHeading>
            <p className="mt-4 max-w-xl text-pretty text-[17px] leading-[1.6] text-ecrn-secondary">
              ECRN is the free referral network and job board for electrical construction. One account lets you apply to open roles and
              refer people you know. Delta Construction Partners does the recruiting.
            </p>
          </div>
          <ul role="list" className="divide-y divide-ecrn-line border-y border-ecrn-line">
            {WAYS_IN.map((w) => (
              <li key={w.title}>
                <Link href={w.href} className={ROW_LINK}>
                  <span className="min-w-0">
                    <span className="career-row-title block font-display text-[20px] font-semibold tracking-[-0.015em] text-ecrn-ink transition-colors duration-150 sm:text-[21px]">
                      {w.title}
                    </span>
                    <span className="mt-1.5 block text-pretty text-[15.5px] leading-[1.6] text-ecrn-secondary">{w.body}</span>
                    <span className="mt-2 block text-[14.5px] font-semibold text-ecrn-green-text">{w.label}</span>
                  </span>
                  <ArrowRight className="career-card-arrow h-5 w-5 text-ecrn-green-text" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* FAQ */}
      <section aria-labelledby="career-faq-heading" className="border-t border-ecrn-line bg-white py-14 sm:py-20">
        <Container className="max-w-4xl">
          <SectionHeading id="career-faq-heading" className="mb-6 sm:mb-8">
            Electrical construction career questions
          </SectionHeading>
          <FaqList faqs={HUB_FAQS} />

          <h3 className="mt-12 font-display text-[17px] font-semibold tracking-[-0.01em] text-ecrn-ink">Keep reading</h3>
          <ul role="list" className="mt-2 divide-y divide-ecrn-line border-b border-ecrn-line">
            {KEEP_READING.map((k) => (
              <li key={k.href}>
                <Link href={k.href} className="career-row grid min-h-[56px] grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 py-3.5">
                  <span className="min-w-0">
                    <span className="career-row-title block font-display text-[17px] font-semibold text-ecrn-ink">{k.title}</span>
                    <span className="mt-0.5 block text-[14.5px] leading-snug text-ecrn-secondary">{k.body}</span>
                  </span>
                  <ArrowRight className="career-card-arrow h-[18px] w-[18px] text-ecrn-green-text" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <DeltaBand />
      <FinalCta />
    </>
  );
}
