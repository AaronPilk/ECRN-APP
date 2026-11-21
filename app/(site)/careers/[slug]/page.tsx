import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Breadcrumbs, Container, CtaLink, FaqList, FinalCta, PageHero } from "@/components/site/Blocks";
import { JsonLd } from "@/components/site/SiteChrome";
import { SiteImage } from "@/components/site/SiteImage";
import { ContentBlocks, SourcesList, formatDay, headingsOf } from "@/components/content/ContentBlocks";
import { DeltaBand, RoleCard, RoleJobs, RoleKeyFacts, SectionHeading, ShortAnswer } from "@/components/careers/CareerParts";
import { jobsForRole } from "@/components/careers/jobs";
import { PAY_PERIOD, ROLES, getRole, type RoleEntry } from "@/content/roles";
import { getPost } from "@/content/blog";
import { AUTHORS, BLOG_CATEGORIES, type BlogPost } from "@/lib/blog/types";
import { listPublicJobs } from "@/lib/data/repository";
import { ogImagePath } from "@/lib/site-images";
import { TIERS, absoluteUrl, breadcrumbJsonLd, faqJsonLd, pageMeta } from "@/lib/site";

export const revalidate = 600;
export const dynamicParams = false;

export function generateStaticParams() {
  return ROLES.map((r) => ({ slug: r.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const role = getRole(slug);
  if (!role) return {};
  const og = ogImagePath(role.image);
  return pageMeta({
    title: role.metaTitle,
    description: role.description,
    path: `/careers/${role.slug}`,
    image: og ? absoluteUrl(og) : undefined,
  });
}

/** Occupation data: only what the page shows (pay table, SOC codes, review date). */
function occupationJsonLd(role: RoleEntry) {
  const url = absoluteUrl(`/careers/${role.slug}`);
  return {
    "@context": "https://schema.org",
    "@type": "Occupation",
    "@id": `${url}#occupation`,
    name: role.title,
    description: role.answer,
    occupationLocation: { "@type": "Country", name: "United States" },
    estimatedSalary: role.pay.map((p) => ({
      "@type": "MonetaryAmountDistribution",
      name: `${p.occupation} (SOC ${p.soc}), BLS national wages, ${PAY_PERIOD}${p.proxy ? " (proxy occupation)" : ""}`,
      currency: "USD",
      duration: "P1Y",
      percentile10: p.annual.p10,
      percentile25: p.annual.p25,
      median: p.annual.median,
      percentile75: p.annual.p75,
      percentile90: p.annual.p90,
    })),
    occupationalCategory: role.pay.length === 1 ? role.pay[0].soc : role.pay.map((p) => p.soc),
    mainEntityOfPage: { "@type": "WebPage", "@id": url, lastReviewed: role.updatedAt },
  };
}

export default async function CareerRolePage({ params }: Params) {
  const { slug } = await params;
  const role = getRole(slug);
  if (!role) notFound();

  const tier = TIERS[role.tierIndex];
  const name = role.title.toLowerCase();
  const jobs = jobsForRole((await listPublicJobs().catch(() => [])).filter((job) => job.status === "open"), role.jobKeywords);
  const posts = role.relatedPosts
    .map((s) => getPost(s))
    .filter((p): p is BlogPost => Boolean(p))
    .slice(0, 3);
  const related = role.relatedRoles.map((s) => getRole(s)).filter((r): r is RoleEntry => Boolean(r));
  const toc = headingsOf(role.body).filter((h) => h.level === 2);
  const author = AUTHORS["ecrn-team"];
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Careers", path: "/careers" },
    { name: role.title, path: `/careers/${role.slug}` },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      <JsonLd data={occupationJsonLd(role)} />
      <JsonLd data={faqJsonLd(role.faqs)} />

      <PageHero eyebrow={`Careers · ${tier.name}`} title={role.heading} intro={<ShortAnswer text={role.answer} />}>
        <CtaLink href="#open-jobs" className="h-auto min-h-[50px] py-2.5">
          See open jobs <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        </CtaLink>
        <CtaLink href="/signup" variant="ghost" className="h-auto min-h-[50px] py-2.5">
          Refer and earn {tier.amount.toLowerCase()}
        </CtaLink>
      </PageHero>

      <Container className="pt-6">
        <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2">
          <Breadcrumbs items={crumbs} />
          <p className="text-[13px] text-ecrn-secondary">
            By the{" "}
            <Link href={author.url} className="career-press career-press--ink underline decoration-ecrn-line underline-offset-[3px]">
              {author.name}
            </Link>
            {" · "}Last reviewed <time dateTime={role.updatedAt}>{formatDay(role.updatedAt)}</time>
          </p>
        </div>
        <div className="mt-6">
          <RoleKeyFacts role={role} />
        </div>
      </Container>

      <Container className="py-8 sm:py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-14">
          <article className="-mx-5 min-w-0 border-y border-ecrn-line bg-white px-5 py-8 sm:mx-0 sm:rounded-[28px] sm:border sm:px-10 sm:py-11 lg:px-12">
            <details className="group mb-7 rounded-[16px] border border-ecrn-line bg-ecrn-paper lg:hidden">
              <summary className="career-press flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-3 px-4 font-display text-[16px] font-semibold text-ecrn-ink [&::-webkit-details-marker]:hidden">
                On this page
                <ChevronDown className="h-4 w-4 shrink-0 text-ecrn-secondary group-open:rotate-180" aria-hidden />
              </summary>
              <ul className="border-t border-ecrn-line px-4 py-1.5 text-[15px] leading-snug">
                {toc.map((h) => (
                  <li key={h.id}>
                    <a href={`#${h.id}`} className="career-press flex min-h-[44px] items-center text-ecrn-secondary">
                      {h.text}
                    </a>
                  </li>
                ))}
                <li>
                  <a href="#open-jobs" className="career-press flex min-h-[44px] items-center text-ecrn-secondary">
                    Open {name} jobs
                  </a>
                </li>
                <li>
                  <a href="#questions" className="career-press flex min-h-[44px] items-center text-ecrn-secondary">
                    Questions
                  </a>
                </li>
              </ul>
            </details>

            <figure className="relative mb-9">
              <SiteImage name={role.image} priority sizes="(min-width: 1024px) 760px, 100vw" className="!aspect-[16/10] rounded-[20px] sm:!aspect-[16/9]" />
              <figcaption className="career-chip absolute bottom-3 left-3 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium text-white">
                {role.title} · {tier.name}
              </figcaption>
            </figure>

            <ContentBlocks blocks={role.body} className="max-w-[70ch] [&_table]:min-w-[560px]" />

            <div className="mt-14 border-t border-ecrn-line pt-11">
              <RoleJobs role={role} jobs={jobs} />
            </div>

            <section id="questions" aria-labelledby="questions-heading" className="mt-14 scroll-mt-28">
              <SectionHeading id="questions-heading" className="mb-6">
                Common {name} questions
              </SectionHeading>
              <FaqList faqs={role.faqs} />
            </section>

            <SourcesList sources={role.sources} />
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-[calc(var(--site-header-total,4.5rem)+1.5rem)] space-y-5">
              <nav aria-label="On this page" className="rounded-[20px] border border-ecrn-line bg-white p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ecrn-secondary">On this page</p>
                <ul className="mt-3 space-y-2.5 text-[14.5px] leading-snug">
                  {toc.map((h) => (
                    <li key={h.id}>
                      <a href={`#${h.id}`} className="career-press career-press--toc block text-ecrn-secondary">
                        {h.text}
                      </a>
                    </li>
                  ))}
                  <li>
                    <a href="#open-jobs" className="career-press career-press--toc block text-ecrn-secondary">
                      Open {name} jobs
                    </a>
                  </li>
                  <li>
                    <a href="#questions" className="career-press career-press--toc block text-ecrn-secondary">
                      Questions
                    </a>
                  </li>
                  <li>
                    <a href="#sources-heading" className="career-press career-press--toc block text-ecrn-secondary">
                      Sources
                    </a>
                  </li>
                </ul>
              </nav>

              <div className="career-delta rounded-[20px] p-5 text-white">
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ecrn-reward-dark">{tier.tier} referral reward</p>
                <p className="mt-2 font-display text-[32px] font-semibold leading-none tracking-[-0.03em]">{tier.amount}</p>
                <p className="mt-3 text-[14px] leading-relaxed text-white/85">
                  An estimate, confirmed in writing. Paid after your referral is placed and completes the guarantee period, typically 90 days.
                </p>
                <Link
                  href="/signup"
                  className="career-press mt-4 inline-flex h-11 items-center gap-1.5 rounded-[13px] bg-white px-4 text-[14.5px] font-semibold text-navy"
                >
                  Refer someone <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </Container>

      <section className="border-t border-ecrn-line bg-white py-14 sm:py-20">
        <Container>
          {posts.length > 0 && (
            <div className="mb-14">
              <SectionHeading>Related guides</SectionHeading>
              <ul className="mt-6 grid gap-4 md:grid-cols-3">
                {posts.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/blog/${p.slug}`} className="career-card flex h-full flex-col rounded-[20px] border border-ecrn-line bg-ecrn-paper p-6">
                      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ecrn-secondary">{BLOG_CATEGORIES[p.category].label}</p>
                      <h3 className="mt-2 font-display text-[20px] font-semibold leading-snug tracking-[-0.015em] text-ecrn-ink">{p.title}</h3>
                      <p className="mt-2 text-[15px] leading-relaxed text-ecrn-secondary">{p.description}</p>
                      <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[14.5px] font-semibold text-ecrn-green-text">
                        Read the guide <ArrowRight className="career-card-arrow h-4 w-4" aria-hidden />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading>Roles next to this one</SectionHeading>
            <Link href="/careers" className="career-press inline-flex min-h-[44px] items-center gap-1.5 text-[16px] font-semibold text-ecrn-green-text">
              All career guides <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {related.map((r) => (
              <li key={r.slug}>
                <RoleCard role={r} compact />
              </li>
            ))}
          </ul>
          <p className="mt-8 text-[15px] text-ecrn-secondary">
            New to a term on this page? The{" "}
            <Link href="/glossary" className="font-medium text-ecrn-green-text underline decoration-ecrn-green/40 underline-offset-[3px]">
              electrical construction glossary
            </Link>{" "}
            explains it in plain language.
          </p>
        </Container>
      </section>

      <DeltaBand />
      <FinalCta />
    </>
  );
}
