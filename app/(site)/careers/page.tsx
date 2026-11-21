import Link from "next/link";
import { ArrowRight, BookOpen, Briefcase, Lock, Newspaper, Send } from "lucide-react";
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

export default async function CareersHubPage() {
  const allJobs = await listPublicJobs().catch(() => []);
  const openCount = new Map(ROLES.map((r) => [r.slug, jobsForRole(allJobs, r.jobKeywords).length]));
  const stages = TIERS.map((tier, i) => ({ tier, note: STAGE_NOTES[i], roles: ROLES.filter((r) => r.tierIndex === i) }));

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <JsonLd data={itemListJsonLd} />
      <JsonLd data={faqJsonLd(HUB_FAQS)} />

      <PageHero eyebrow="Electrical construction careers" title={TITLE} intro={<ShortAnswer text={ANSWER} />}>
        <CtaLink href="/jobs">
          Browse open jobs <ArrowRight className="h-4 w-4" aria-hidden />
        </CtaLink>
        <CtaLink href="#pay" variant="ghost">
          Compare pay by role
        </CtaLink>
      </PageHero>

      <Container className="pt-6">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2">
          <Breadcrumbs items={CRUMBS} />
          <p className="text-[13px] text-ecrn-secondary">
            Last reviewed <time dateTime={REVIEWED}>{formatDay(REVIEWED)}</time>
          </p>
        </div>
      </Container>

      {/* Career path */}
      <section aria-labelledby="path-heading" className="py-12 sm:py-16">
        <Container>
          <Eyebrow>Field to executive</Eyebrow>
          <SectionHeading id="path-heading" className="mt-3 max-w-3xl sm:text-[40px]">
            The electrical construction career path, role by role
          </SectionHeading>
          <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-ecrn-secondary">
            Most careers in this industry follow the same line: learn the trade, lead a crew, then run the site or move into the office.
            The four stages match the four ECRN referral tiers, so each one also shows what a referral at that level is worth.
          </p>

          <ol className="relative mt-10 sm:mt-12">
            <span aria-hidden className="career-path-line pointer-events-none absolute bottom-3 left-[15px] top-3 w-[2px] rounded-full sm:left-[19px]" />
            {stages.map((s, i) => (
              <li key={s.tier.tier} className="relative pb-12 pl-12 last:pb-0 sm:pl-16">
                <span
                  aria-hidden
                  className="absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full bg-ecrn-black font-mono text-[12px] text-[#91F9B3] ring-4 ring-ecrn-paper sm:h-10 sm:w-10 sm:text-[13px]"
                >
                  0{i + 1}
                </span>
                <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1">
                  <h3 className="font-display text-[24px] font-semibold leading-tight tracking-[-0.02em] text-ecrn-ink sm:text-[28px]">{s.tier.name}</h3>
                  <p className="text-[14.5px] text-ecrn-secondary">
                    {s.tier.tier} referral reward: <span className="font-semibold text-cobalt">{s.tier.amount.toLowerCase()}</span>
                  </p>
                </div>
                <p className="mt-1.5 text-[16px] text-ecrn-secondary">{s.note}</p>
                <div className={cn("mt-5 grid gap-5", s.roles.length > 1 && "md:grid-cols-2")}>
                  {s.roles.map((r) => (
                    <RoleCard key={r.slug} role={r} heading="h4" wide={s.roles.length === 1} openJobs={openCount.get(r.slug) ?? 0} />
                  ))}
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-[14px] text-ecrn-secondary sm:pl-16">
            Pay figures are BLS national medians for {PAY_PERIOD}. The{" "}
            <a href="#pay" className="font-medium text-ecrn-green-text underline decoration-ecrn-green/40 underline-offset-[3px]">
              pay table
            </a>{" "}
            below has the ranges and sources.
          </p>
        </Container>
      </section>

      {/* Pay */}
      <section id="pay" aria-labelledby="pay-heading" className="scroll-mt-20 border-y border-ecrn-line bg-white py-14 sm:py-20">
        <Container className="max-w-5xl">
          <SectionHeading id="pay-heading">What does each electrical construction role pay?</SectionHeading>
          <ContentBlocks blocks={PAY_TABLE} className="mt-2 [&_table]:min-w-[720px]" />
          <SourcesList sources={HUB_SOURCES} />
        </Container>
      </section>

      {/* ECRN and Delta */}
      <section aria-labelledby="fit-heading" className="py-14 sm:py-20">
        <Container>
          <SectionHeading id="fit-heading" className="max-w-3xl">
            Where do ECRN and Delta Construction Partners fit in?
          </SectionHeading>
          <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-ecrn-secondary">
            ECRN is the free referral network and job board for electrical construction. One account lets you apply to open roles and
            refer people you know. Delta Construction Partners does the recruiting.
          </p>
          <ul className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              {
                Icon: Briefcase,
                title: "Apply",
                body: "Open roles are recruited by Delta Construction Partners. Apply with your ECRN profile and a recruiter takes it from there.",
                href: "/jobs",
                label: "Open jobs",
              },
              {
                Icon: Send,
                title: "Refer",
                body: "Enter a name and a phone number, or pick someone from your phone's contacts. If Delta places them, you earn up to $10,000, depending on the role.",
                href: "/referral-rewards",
                label: "Referral rewards",
              },
              {
                Icon: Lock,
                title: "Look quietly",
                body: "Employed and only curious? Mark yourself open to the right move. Only Delta's recruiters see it.",
                href: "/how-it-works",
                label: "How ECRN works",
              },
            ].map(({ Icon, title, body, href, label }) => (
              <li key={title}>
                <Link href={href} className="career-card flex h-full flex-col rounded-[20px] border border-ecrn-line bg-white p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-ecrn-action-surface">
                    <Icon className="h-5 w-5 text-ecrn-green-text" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-display text-[21px] font-semibold tracking-[-0.015em] text-ecrn-ink">{title}</h3>
                  <p className="mt-2 text-[15.5px] leading-relaxed text-ecrn-secondary">{body}</p>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[15px] font-semibold text-ecrn-green-text">
                    {label} <ArrowRight className="career-card-arrow h-4 w-4" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* FAQ */}
      <section aria-labelledby="career-faq-heading" className="border-t border-ecrn-line bg-white py-14 sm:py-20">
        <Container className="max-w-4xl">
          <SectionHeading id="career-faq-heading" className="mb-7">
            Electrical construction career questions
          </SectionHeading>
          <FaqList faqs={HUB_FAQS} />

          <ul className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { Icon: Briefcase, href: "/jobs", title: "Open jobs", body: "Every role on the ECRN job board." },
              { Icon: Newspaper, href: "/blog", title: "Blog", body: "Guides on pay, job search and referrals." },
              { Icon: BookOpen, href: "/glossary", title: "Glossary", body: "Job site and hiring terms in plain language." },
            ].map(({ Icon, href, title, body }) => (
              <li key={href}>
                <Link href={href} className="career-card flex h-full items-start gap-3.5 rounded-[18px] border border-ecrn-line bg-ecrn-paper p-5">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-ecrn-green-text" aria-hidden />
                  <span>
                    <span className="block font-display text-[18px] font-semibold text-ecrn-ink">{title}</span>
                    <span className="mt-0.5 block text-[14.5px] leading-snug text-ecrn-secondary">{body}</span>
                  </span>
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
