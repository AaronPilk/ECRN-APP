import Link from "next/link";
import { ArrowRight, ArrowUp } from "lucide-react";
import { ArrowLink, Breadcrumbs, Container, CtaLink, FinalCta, PageHero } from "@/components/site/Blocks";
import { JsonLd } from "@/components/site/SiteChrome";
import { SourcesList, formatDay } from "@/components/content/ContentBlocks";
import { DeltaBand, RoleCard, SectionHeading, SourceMark } from "@/components/careers/CareerParts";
import { GLOSSARY, GLOSSARY_SOURCES, GLOSSARY_UPDATED_AT } from "@/content/glossary";
import { ROLES, getRole } from "@/content/roles";
import { getPost } from "@/content/blog";
import type { GlossaryTerm } from "@/lib/careers/types";
import { absoluteUrl, breadcrumbJsonLd, pageMeta } from "@/lib/site";

const TITLE = "Electrical construction glossary";
const DESCRIPTION = `Plain-language definitions of ${GLOSSARY.length} terms used on electrical construction projects and in electrical construction hiring, from AHJ to wireman.`;

export const metadata = pageMeta({
  title: "Electrical Construction Glossary: Terms Explained | ECRN",
  description:
    "Plain-language definitions of electrical construction terms: job site roles, contracts, equipment, codes and recruiting, from AHJ to wireman.",
  path: "/glossary",
});

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Glossary", path: "/glossary" },
];

/** Terms grouped by first letter, in the order they are written (A to Z). */
const GROUPS: { letter: string; terms: GlossaryTerm[] }[] = [];
for (const t of GLOSSARY) {
  const letter = t.term.charAt(0).toUpperCase();
  const last = GROUPS[GROUPS.length - 1];
  if (last && last.letter === letter) last.terms.push(t);
  else GROUPS.push({ letter, terms: [t] });
}

/** Label for a term's "go deeper" link, or null when the target is not published yet. */
function deeperLink(href: string): string | null {
  if (href.startsWith("/careers/")) {
    const role = getRole(href.slice("/careers/".length));
    return role ? `${role.title} career guide` : null;
  }
  if (href.startsWith("/blog/")) {
    const post = getPost(href.slice("/blog/".length));
    return post ? post.title : null;
  }
  if (href === "/referral-rewards") return "How referral rewards work";
  if (href === "/how-it-works") return "How ECRN works";
  return "Read more";
}

const PAGE_URL = absoluteUrl("/glossary");

const termSetJsonLd = {
  "@context": "https://schema.org",
  "@type": "DefinedTermSet",
  "@id": `${PAGE_URL}#terms`,
  name: TITLE,
  description: DESCRIPTION,
  url: PAGE_URL,
  inLanguage: "en-US",
  hasDefinedTerm: GLOSSARY.map((t) => ({
    "@type": "DefinedTerm",
    name: t.term,
    description: t.definition,
    url: `${PAGE_URL}#${t.slug}`,
    ...(t.aka?.length ? { alternateName: t.aka } : {}),
    inDefinedTermSet: `${PAGE_URL}#terms`,
  })),
};

/** Letter keys: a five-wide keypad on phones (every letter in view, 44 px tall), a row of squares from 640 px. */
const KEY =
  "career-press career-press--chip grid h-11 w-full place-items-center rounded-[12px] border border-ecrn-line bg-ecrn-paper font-display text-[16px] font-semibold text-ecrn-ink sm:w-11";

export default function GlossaryPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <JsonLd data={termSetJsonLd} />

      <PageHero
        eyebrow="Glossary"
        title={TITLE}
        intro={
          <p>
            This glossary defines {GLOSSARY.length} terms used on electrical construction projects and in electrical construction hiring,
            from AHJ to wireman, in plain language. It is written for electricians, foremen, estimators and project managers, and for
            anyone new to the trade or to recruiting in it.
          </p>
        }
      >
        <CtaLink href="/careers" className="w-full sm:w-auto">
          Career guides by role <ArrowRight className="h-4 w-4" aria-hidden />
        </CtaLink>
        <CtaLink href="/jobs" variant="ghost" className="w-full sm:w-auto">
          Browse open jobs
        </CtaLink>
      </PageHero>

      <Container className="pt-5 sm:pt-6">
        <div className="flex flex-wrap items-center justify-between gap-x-8">
          <Breadcrumbs items={CRUMBS} />
          <p className="text-[13px] text-ecrn-secondary">
            Last updated <time dateTime={GLOSSARY_UPDATED_AT}>{formatDay(GLOSSARY_UPDATED_AT)}</time>
          </p>
        </div>
      </Container>

      <Container className="pb-14 pt-4 sm:pb-20 sm:pt-6">
        <div id="top" className="glossary-anchor" />
        <nav
          aria-label="Jump to a letter"
          className="z-30 rounded-[18px] border border-ecrn-line bg-white p-2.5 before:pointer-events-none before:absolute before:inset-x-[-1px] before:bottom-full before:hidden before:h-3 before:bg-ecrn-paper sm:px-4 sm:py-3 lg:sticky lg:top-[var(--site-header-total,4.5rem)] lg:shadow-soft lg:before:block"
        >
          <ul role="list" className="grid grid-cols-5 gap-1.5 sm:flex sm:flex-wrap">
            {GROUPS.map((g) => (
              <li key={g.letter}>
                <a href={`#letter-${g.letter.toLowerCase()}`} className={KEY}>
                  {g.letter}
                  <span className="sr-only">: {g.terms.length} terms</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="-mx-5 mt-5 border-y border-ecrn-line bg-white px-5 sm:mx-0 sm:mt-6 sm:rounded-[28px] sm:border sm:px-10 lg:px-12">
          {GROUPS.map((g, i) => (
            <section
              key={g.letter}
              aria-labelledby={`letter-${g.letter.toLowerCase()}`}
              className={`grid gap-x-10 gap-y-4 py-9 sm:py-12 lg:grid-cols-[110px_minmax(0,1fr)] ${i > 0 ? "border-t border-ecrn-line" : ""}`}
            >
              <div className="flex items-center justify-between lg:block">
                <h2
                  id={`letter-${g.letter.toLowerCase()}`}
                  className="glossary-anchor font-display text-[44px] font-semibold leading-none tracking-[-0.04em] text-ecrn-ink sm:text-[64px]"
                >
                  {g.letter}
                </h2>
                <a
                  href="#top"
                  className="career-press career-press--toc -mr-2 inline-flex min-h-[44px] items-center gap-1 px-2 text-[13.5px] text-ecrn-secondary lg:-ml-2 lg:mr-0 lg:mt-3"
                >
                  <ArrowUp className="h-3.5 w-3.5" aria-hidden /> A to Z
                </a>
              </div>
              <dl className="divide-y divide-ecrn-line">
                {g.terms.map((t) => {
                  const label = t.href ? deeperLink(t.href) : null;
                  return (
                    <div key={t.slug} className="py-5 first:pt-0 last:pb-0 sm:py-6">
                      <dt
                        id={t.slug}
                        className="glossary-term glossary-anchor text-balance font-display text-[20px] font-semibold leading-snug tracking-[-0.015em] text-ecrn-ink sm:text-[21px]"
                      >
                        <a href={`#${t.slug}`} className="career-link">
                          {t.term}
                        </a>
                      </dt>
                      <dd className="mt-1.5 max-w-[68ch]">
                        <p className="text-pretty text-[17px] leading-[1.6] text-[#2B3A32]">
                          {t.definition}
                          {t.source != null && <SourceMark id={t.source} />}
                        </p>
                        {t.aka && t.aka.length > 0 && <p className="mt-2 text-[14px] leading-[1.5] text-ecrn-secondary">Also known as: {t.aka.join(", ")}</p>}
                        {t.href && label && (
                          <p className="mt-1">
                            <Link
                              href={t.href}
                              className="career-press inline-flex min-h-[44px] items-center gap-1.5 text-[15px] font-semibold text-ecrn-green-text"
                            >
                              <span className="text-pretty">{label}</span> <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
                            </Link>
                          </p>
                        )}
                      </dd>
                    </div>
                  );
                })}
              </dl>
            </section>
          ))}
        </div>

        <div className="mx-auto max-w-4xl">
          <SourcesList sources={GLOSSARY_SOURCES} />
          <p className="mt-6 text-pretty text-[14px] leading-relaxed text-ecrn-secondary">
            Definitions describe common usage on United States job sites. Codes, license rules and contract terms vary by state, by
            project and by contract, so check the document that governs your job.
          </p>
        </div>
      </Container>

      <section aria-labelledby="glossary-roles-heading" className="border-t border-ecrn-line bg-white py-14 sm:py-20">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-1">
            <SectionHeading id="glossary-roles-heading">The roles behind the terms</SectionHeading>
            <ArrowLink href="/careers">All career guides</ArrowLink>
          </div>
          <ul role="list" className="mt-5 grid gap-3 sm:mt-8 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ROLES.map((r) => (
              <li key={r.slug}>
                <RoleCard role={r} compact />
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <DeltaBand title="ECRN is powered by Delta Construction Partners." image="site-office-plans" />
      <FinalCta />
    </>
  );
}
