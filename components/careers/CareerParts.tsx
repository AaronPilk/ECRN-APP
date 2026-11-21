import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ArrowUpRight, MapPin } from "lucide-react";
import type { Job } from "@/types";
import { cn } from "@/lib/utils/cn";
import { BRAND, TIERS } from "@/lib/site";
import { jobLocation, jobPayout, jobSalary } from "@/lib/jobs";
import { Container, CtaLink } from "@/components/site/Blocks";
import { SiteImage } from "@/components/site/SiteImage";
import { PAY_PERIOD, type RoleEntry, type RolePay } from "@/content/roles";
import "./careers.css";

/**
 * Building blocks for /careers, /careers/[slug] and /glossary.
 * Server components only: the only motion is CSS hover and press states.
 */

export const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
const perHour = (n: number) => `$${n.toFixed(2)}`;

const h2Class = "font-display text-[28px] leading-[1.12] font-semibold tracking-[-0.025em] text-ecrn-ink sm:text-[34px]";
const labelClass = "font-mono text-[11px] uppercase tracking-[0.14em] text-ecrn-secondary";

export function SectionHeading({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <h2 id={id} className={cn(h2Class, className)}>
      {children}
    </h2>
  );
}

/** Superscript link to an entry in the page's source list. */
export function SourceMark({ id }: { id: number }) {
  return (
    <sup className="ml-0.5 text-[12px] font-normal tracking-normal">
      <a href={`#source-${id}`} className="career-link text-ecrn-green-text no-underline" aria-label={`Source ${id}`}>
        [{id}]
      </a>
    </sup>
  );
}

/** The two-sentence answer, as a frosted panel inside the dark hero. */
export function ShortAnswer({ text }: { text: string }) {
  return (
    <div className="career-glass rounded-[20px] px-5 py-5 sm:px-6 sm:py-6">
      <p className="font-mono text-[11.5px] uppercase tracking-[0.16em] text-[#91F9B3]">Short answer</p>
      <p className="mt-2.5 text-[17px] leading-[1.6] text-white/90 sm:text-[18.5px]">{text}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Key facts
// ─────────────────────────────────────────────────────────────────────

function Fact({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col px-5 py-5 sm:px-6 sm:py-6", className)}>
      <dt className={labelClass}>{label}</dt>
      <dd className="mt-2.5 flex flex-1 flex-col">{children}</dd>
    </div>
  );
}

const factValue = "font-display text-[30px] font-semibold leading-none tracking-[-0.03em] text-ecrn-ink tabular-nums sm:text-[34px]";
const factNote = "mt-2.5 text-[13.5px] leading-snug text-ecrn-secondary";

function occupationLine(p: RolePay): string {
  return p.proxy ? `BLS proxy: ${p.short} (SOC ${p.soc})` : `BLS occupation: ${p.short} (SOC ${p.soc})`;
}

/** Pay, the BLS occupation behind it and the referral reward, at a glance. */
export function RoleKeyFacts({ role }: { role: RoleEntry }) {
  const tier = TIERS[role.tierIndex];
  const single = role.pay.length === 1;
  const showHourly = single && role.tierIndex <= 1;
  return (
    <section aria-label={`${role.title}: key facts`} className="career-surface rounded-[22px] border border-ecrn-line bg-white">
      <dl className="grid divide-y divide-ecrn-line md:grid-cols-3 md:divide-x md:divide-y-0">
        {role.pay.map((p) => (
          <Fact key={p.soc} label={`Median pay, ${PAY_PERIOD}`}>
            <p className={factValue}>
              {usd(p.annual.median)}
              <span className="ml-1.5 text-[15px] font-medium tracking-normal text-ecrn-secondary">a year</span>
              <SourceMark id={p.source} />
            </p>
            <p className={factNote}>
              {occupationLine(p)}
              {showHourly ? `. ${perHour(p.hourly.median)} an hour.` : "."}
            </p>
            {!single && (
              <p className="mt-1 text-[13.5px] leading-snug text-ecrn-secondary">
                10th to 90th percentile: {usd(p.annual.p10)} to {usd(p.annual.p90)}.
              </p>
            )}
          </Fact>
        ))}
        {single && (
          <Fact label="Pay range, 10th to 90th percentile">
            <p className="font-display text-[23px] font-semibold leading-tight tracking-[-0.025em] text-ecrn-ink tabular-nums sm:text-[26px]">
              {usd(role.pay[0].annual.p10)} to {usd(role.pay[0].annual.p90)}
              <SourceMark id={role.pay[0].source} />
            </p>
            <p className={factNote}>
              {role.pay[0].proxy
                ? "National, all industries. BLS has no electrical-only figure for this role."
                : "National, all industries. BLS does not split out journeymen."}
            </p>
          </Fact>
        )}
        <Fact label="ECRN referral reward">
          <p className={cn(factValue, "text-cobalt")}>{tier.amount}</p>
          <p className={factNote}>
            {tier.tier}: {tier.name.toLowerCase()}. An estimate, confirmed in writing and paid after placement and the guarantee period.
          </p>
        </Fact>
      </dl>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Live jobs
// ─────────────────────────────────────────────────────────────────────

/** Open jobs for this role, straight from the job board. Never shows a made-up job. */
export function RoleJobs({ role, jobs }: { role: RoleEntry; jobs: Job[] }) {
  const shown = jobs.slice(0, 6);
  const name = role.title.toLowerCase();
  return (
    <section id="open-jobs" aria-labelledby="open-jobs-heading" className="scroll-mt-28">
      <SectionHeading id="open-jobs-heading">Open {name} jobs</SectionHeading>
      {shown.length > 0 ? (
        <>
          <p className="mt-3 max-w-2xl text-[16.5px] leading-relaxed text-ecrn-secondary">
            Live from the ECRN job board. {jobs.length > shown.length ? `Showing ${shown.length} of ${jobs.length} matching roles. ` : ""}
            Every role is recruited by Delta Construction Partners.
          </p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {shown.map((j) => {
              const place = jobLocation(j);
              const salary = jobSalary(j);
              const payout = jobPayout(j);
              return (
                <li key={j.id}>
                  <Link href={`/jobs/${j.id}`} className="career-card flex h-full flex-col rounded-[18px] border border-ecrn-line bg-ecrn-paper p-5">
                    <h3 className="font-display text-[19px] font-semibold leading-snug text-ecrn-ink">{j.title}</h3>
                    {(place || salary) && (
                      <p className="mt-1.5 flex items-start gap-1.5 text-[14.5px] leading-snug text-ecrn-secondary">
                        {place && <MapPin className="mt-[2px] h-4 w-4 shrink-0" aria-hidden />}
                        <span>{[place, salary].filter(Boolean).join(" · ")}</span>
                      </p>
                    )}
                    {payout && <p className="mt-3 text-[14px] font-medium text-cobalt">Refer someone and earn up to {payout}</p>}
                    <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[14.5px] font-semibold text-ecrn-green-text">
                      View job <ArrowRight className="career-card-arrow h-4 w-4" aria-hidden />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <Link href="/jobs" className="career-press mt-6 inline-flex min-h-[44px] items-center gap-1.5 text-[16px] font-semibold text-ecrn-green-text">
            See all open jobs <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </>
      ) : (
        <div className="mt-6 rounded-[20px] border border-dashed border-[#B9C4BB] bg-ecrn-paper px-5 py-6 sm:px-7 sm:py-7">
          <p className="font-display text-[20px] font-semibold leading-snug text-ecrn-ink">No {name} jobs are posted on ECRN right now.</p>
          <p className="mt-2 max-w-xl text-[16px] leading-relaxed text-ecrn-secondary">
            The board changes as contractors open and fill roles. Browse everything that is open, or create a free account so your
            profile is ready when the right role is posted.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <CtaLink href="/jobs" variant="dark">
              Browse all open jobs
            </CtaLink>
            <CtaLink href="/signup">Create a free account</CtaLink>
          </div>
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Role cards
// ─────────────────────────────────────────────────────────────────────

/** Card pay figure: one BLS median, or the two medians that bracket the role. */
function cardPay(role: RoleEntry): { value: string; note: string } {
  const [a, b] = role.pay;
  if (b) {
    const lo = Math.min(a.annual.median, b.annual.median);
    const hi = Math.max(a.annual.median, b.annual.median);
    return { value: `${usd(lo)} to ${usd(hi)}`, note: "Medians of two BLS proxies" };
  }
  return { value: usd(a.annual.median), note: a.proxy ? `BLS proxy: ${a.short}` : `BLS: ${a.short}` };
}

/**
 * Link card for a career page.
 *  - default: photo on top
 *  - wide: photo beside the text from md up (for a stage with one role)
 *  - compact: no photo (related-role lists)
 */
export function RoleCard({
  role,
  openJobs = 0,
  wide = false,
  compact = false,
  heading = "h3",
}: {
  role: RoleEntry;
  openJobs?: number;
  wide?: boolean;
  compact?: boolean;
  heading?: "h3" | "h4";
}) {
  const tier = TIERS[role.tierIndex];
  const cardFigure = cardPay(role);
  const H = heading;
  return (
    <Link
      href={`/careers/${role.slug}`}
      className={cn("career-card flex h-full overflow-hidden rounded-[22px] border border-ecrn-line bg-white", wide ? "flex-col md:flex-row" : "flex-col")}
    >
      {!compact && (
        <div className={cn("relative aspect-[16/10] w-full shrink-0", wide && "md:aspect-auto md:min-h-[300px] md:w-[46%]")}>
          <SiteImage name={role.image} fill sizes={wide ? "(min-width: 768px) 520px, 100vw" : "(min-width: 768px) 520px, 100vw"} />
          {openJobs > 0 && (
            <span className="career-chip absolute left-3 top-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] font-medium text-white">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ecrn-green" />
              {openJobs} open {openJobs === 1 ? "job" : "jobs"}
            </span>
          )}
        </div>
      )}
      <div className={cn("flex flex-1 flex-col", compact ? "p-5 sm:p-6" : "p-6 sm:p-7")}>
        <p className={labelClass}>
          {tier.tier} · {tier.name}
        </p>
        <H className={cn("mt-2 font-display font-semibold leading-[1.12] tracking-[-0.025em] text-ecrn-ink", compact ? "text-[21px]" : "text-[24px] sm:text-[26px]")}>
          {role.title}
        </H>
        <p className="mt-2 text-[15.5px] leading-relaxed text-ecrn-secondary">{role.summary}</p>
        <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-4 border-t border-ecrn-line pt-4">
          <div className="min-w-0">
            <dt className="text-[12.5px] text-ecrn-secondary">Median pay, {PAY_PERIOD}</dt>
            <dd className="mt-1 whitespace-nowrap font-display text-[20px] font-semibold tracking-[-0.02em] text-ecrn-ink tabular-nums">{cardFigure.value}</dd>
            <dd className="mt-0.5 max-w-[210px] text-[12.5px] leading-snug text-ecrn-secondary">{cardFigure.note}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-[12.5px] text-ecrn-secondary">Referral reward</dt>
            <dd className="mt-1 whitespace-nowrap font-display text-[20px] font-semibold tracking-[-0.02em] text-cobalt tabular-nums">{tier.amount}</dd>
            <dd className="mt-0.5 text-[12.5px] leading-snug text-ecrn-secondary">Estimate, per hire</dd>
          </div>
        </dl>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[15px] font-semibold text-ecrn-green-text">
          {role.title} guide <ArrowRight className="career-card-arrow h-4 w-4" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Delta
// ─────────────────────────────────────────────────────────────────────

/** The one clear statement of who Delta is, on every career and glossary page. */
export function DeltaBand() {
  return (
    <section aria-labelledby="delta-heading" className="career-delta text-white">
      <Container className="grid gap-7 py-12 sm:py-16 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <div>
          <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-ecrn-reward-dark">Powered by Delta Construction Partners</p>
          <h2 id="delta-heading" className="mt-3 max-w-2xl font-display text-[30px] font-semibold leading-[1.06] tracking-[-0.03em] sm:text-[40px]">
            The recruiters behind every role on ECRN
          </h2>
          <p className="mt-4 max-w-2xl text-[16.5px] leading-relaxed text-white/85">
            ECRN is an initiative of Delta Construction Partners, a construction recruiting firm that has been recruiting since{" "}
            {BRAND.parent.foundingDate}. Its 30+ recruiters, and their relationships with contractors across the country, handle the
            recruiting behind every application and referral.
          </p>
        </div>
        <a
          href={BRAND.parent.url}
          rel="noopener"
          className="career-press inline-flex h-[48px] max-w-full items-center justify-center gap-1.5 justify-self-start rounded-[15px] border border-white/40 px-4 text-[15px] font-semibold text-white sm:h-[50px] sm:px-6 sm:text-[16px] md:justify-self-end"
        >
          deltaconstructionpartners.com <ArrowUpRight className="h-4 w-4" aria-hidden />
        </a>
      </Container>
    </section>
  );
}
