import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ArrowLink, Breadcrumbs, Container, CtaLink, FaqList, FinalCta, PageHero } from "@/components/site/Blocks";
import { JsonLd } from "@/components/site/SiteChrome";
import { SiteImage } from "@/components/site/SiteImage";
import { ContentBlocks, SourcesList, formatDay, headingsOf } from "@/components/content/ContentBlocks";
import { PostGrid } from "@/components/blog/PostCard";
import { TocDisclosure, type TocItem } from "@/components/blog/TableOfContents";
import { DeltaBand, RoleCard, RoleJobs, RoleKeyFacts, SectionHeading, ShortAnswer } from "@/components/careers/CareerParts";
import { jobsForRole } from "@/components/careers/jobs";
import { PAY_PERIOD, ROLES, getRole, type RoleEntry } from "@/content/roles";
import { getPost } from "@/content/blog";
import { AUTHORS, type BlogPost } from "@/lib/blog/types";
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
  const toc: TocItem[] = [
    ...headingsOf(role.body)
      .filter((h) => h.level === 2)
      .map((h) => ({ id: h.id, text: h.text })),
    { id: "open-jobs", text: `Open ${name} jobs` },
    { id: "questions", text: "Questions" },
    { id: "sources-heading", text: "Sources" },
  ];
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
        <CtaLink href="#open-jobs" className="w-full sm:w-auto">
          See open jobs <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        </CtaLink>
        <CtaLink href="/signup" variant="ghost" className="w-full sm:w-auto">
          Refer and earn {tier.amount.toLowerCase()}
        </CtaLink>
      </PageHero>

      <Container className="pt-5 sm:pt-6">
        {/* The role is the H1 just above, so its crumb is dropped on phones (and a long title cannot wrap the trail). */}
        <div className="flex flex-wrap items-center justify-between gap-x-8 max-sm:[&_nav_li:last-child]:hidden">
          <Breadcrumbs items={crumbs} />
          <p className="text-[13px] leading-[1.5] text-ecrn-secondary">
            By the{" "}
            <Link href={author.url} className="career-press career-press--ink py-3 underline decoration-ecrn-line underline-offset-[3px]">
              {author.name}
            </Link>
            {" · "}Last reviewed <time dateTime={role.updatedAt}>{formatDay(role.updatedAt)}</time>
          </p>
        </div>
        <div className="mt-4 sm:mt-6">
          <RoleKeyFacts role={role} />
        </div>
      </Container>

      <Container className="pt-6 sm:py-12">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-14">
          {/* Full-bleed white on phones with the page's 20 px gutter (it runs straight into the white section below,
              one hairline between), a floating sheet from 640 px. */}
          <article className="-mx-5 min-w-0 border-t border-ecrn-line bg-white px-5 pb-12 pt-6 sm:mx-0 sm:rounded-[28px] sm:border sm:px-10 sm:py-11 lg:px-12">
            <TocDisclosure items={toc} className="mb-7 lg:hidden" />

            <figure className="relative mb-9">
              <SiteImage
                name={role.image}
                priority
                sizes="(min-width: 1024px) 760px, (min-width: 640px) calc(100vw - 144px), calc(100vw - 40px)"
                className="!aspect-[16/10] rounded-[18px] sm:!aspect-[16/9] sm:rounded-[20px]"
              />
              <figcaption className="career-chip absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] truncate rounded-full px-3.5 py-1.5 text-[13px] font-medium text-white">
                {role.title} · {tier.name}
              </figcaption>
            </figure>

            <ContentBlocks blocks={role.body} className="max-w-[70ch]" />

            <div className="mt-14 border-t border-ecrn-line pt-10 sm:pt-11">
              <RoleJobs role={role} jobs={jobs} />
            </div>

            <section id="questions" aria-labelledby="questions-heading" className="mt-14">
              <SectionHeading id="questions-heading" className="mb-5 sm:mb-6">
                Common {name} questions
              </SectionHeading>
              <FaqList faqs={role.faqs} />
            </section>

            <SourcesList sources={role.sources} />
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-[calc(var(--site-header-total,4.5rem)+1.5rem)] space-y-5">
              <nav aria-label="On this page" className="rounded-[20px] border border-ecrn-line bg-white p-5">
                <p className="font-display text-[13px] font-semibold text-ecrn-secondary">On this page</p>
                <ul role="list" className="mt-2">
                  {toc.map((h) => (
                    <li key={h.id}>
                      <a href={`#${h.id}`} className="career-press career-press--toc flex min-h-[40px] items-center py-1.5 text-[14.5px] leading-snug text-ecrn-secondary">
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="career-delta rounded-[20px] p-5 text-white">
                <p className="font-display text-[13px] font-semibold text-ecrn-reward-dark">{tier.tier} referral reward</p>
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
            <div className="mb-14 sm:mb-16">
              <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-1">
                <SectionHeading>Related guides</SectionHeading>
                <ArrowLink href="/blog">All guides</ArrowLink>
              </div>
              <PostGrid posts={posts} columns={posts.length === 2 ? 2 : 3} surface="paper" className="mt-5 sm:mt-8" />
            </div>
          )}

          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-1">
            <SectionHeading>Roles next to this one</SectionHeading>
            <ArrowLink href="/careers">All career guides</ArrowLink>
          </div>
          <ul role="list" className="mt-5 grid gap-3 sm:mt-8 sm:gap-4 md:grid-cols-3">
            {related.map((r) => (
              <li key={r.slug}>
                <RoleCard role={r} compact />
              </li>
            ))}
          </ul>
          <p className="mt-8 text-pretty text-[15px] leading-[1.6] text-ecrn-secondary">
            New to a term on this page? The{" "}
            <Link href="/glossary" className="py-3 font-medium text-ecrn-green-text underline decoration-ecrn-green/40 underline-offset-[3px]">
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
