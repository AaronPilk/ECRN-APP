import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import type { Job } from "@/types";
import { cn } from "@/lib/utils/cn";
import { TIERS } from "@/lib/site";
import { jobLocation, jobPayout, jobSalary } from "@/lib/jobs";
import { CtaLink, DeltaBand as SiteDeltaBand } from "@/components/site/Blocks";
import { SiteImage } from "@/components/site/SiteImage";
import { PAY_PERIOD, type RoleEntry, type RolePay } from "@/content/roles";
import { SourceMark } from "@/components/content/ContentBlocks";
import "./careers.css";

/**
 * Building blocks for /careers, /careers/[slug] and /glossary.
 * Server components only: the only motion is CSS hover and press states.
 */

export const usd = (n: number) => `$${n.toLocaleString("en-US")}`;
const perHour = (n: number) => `$${n.toFixed(2)}`;

const h2Class = "text-balance font-display text-[28px] leading-[1.12] font-semibold tracking-[-0.025em] text-ecrn-ink sm:text-[34px] sm:leading-[1.08]";
const labelClass = "font-display text-[13px] font-medium leading-[1.3] text-ecrn-secondary";

export function SectionHeading({ id, children, className }: { id?: string; children: ReactNode; className?: string }) {
  return (
    <h2 id={id} className={cn(h2Class, className)}>
      {children}
    </h2>
  );
}

/** Superscript link to an entry in the page's source list (44 px target, same look). */
export { SourceMark };

/** The two-sentence answer, as a frosted panel inside the dark hero. */
export function ShortAnswer({ text }: { text: string }) {
  return (
    <div className="career-glass rounded-[18px] px-[18px] py-[18px] sm:rounded-[20px] sm:px-6 sm:py-6">
      <p className="font-display text-[13.5px] font-semibold tracking-[-0.005em] text-[#91F9B3]">The short answer</p>
      <p className="mt-2 text-pretty text-[16.5px] leading-[1.6] text-white/90 sm:mt-2.5 sm:text-[18.5px]">{text}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Key facts
// ─────────────────────────────────────────────────────────────────────

function Fact({ label, children, className }: { label: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col px-[18px] py-4 sm:px-6 sm:py-6", className)}>
      <dt className={labelClass}>{label}</dt>
      <dd className="mt-2 flex flex-1 flex-col">{children}</dd>
    </div>
  );
}

const factValue = "font-display text-[30px] font-semibold leading-none tracking-[-0.03em] text-ecrn-ink tabular-nums sm:text-[34px]";
const factNote = "mt-2 text-pretty text-[13.5px] leading-snug text-ecrn-secondary";

function occupationLine(p: RolePay): string {
  return p.proxy ? `BLS proxy: ${p.short} (SOC ${p.soc})` : `BLS occupation: ${p.short} (SOC ${p.soc})`;
}

/**
 * Pay, the BLS occupation behind it and the referral reward, at a glance.
 * One fact per row on phones (each value is sized to fit a 360 px screen), three
 * across from tablets up.
 */
export function RoleKeyFacts({ role }: { role: RoleEntry }) {
  const tier = TIERS[role.tierIndex];
  const single = role.pay.length === 1;
  const showHourly = single && role.tierIndex <= 1;
  return (
    <section aria-label={`${role.title}: key facts`} className="career-surface rounded-[20px] border border-ecrn-line bg-white sm:rounded-[22px]">
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
            <p className="text-balance font-display text-[24px] font-semibold leading-[1.15] tracking-[-0.025em] text-ecrn-ink tabular-nums sm:text-[26px]">
              <span className="whitespace-nowrap">{usd(role.pay[0].annual.p10)} to</span>{" "}
              <span className="whitespace-nowrap">
                {usd(role.pay[0].annual.p90)}
                <SourceMark id={role.pay[0].source} />
              </span>
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
    <section id="open-jobs" aria-labelledby="open-jobs-heading">
      <SectionHeading id="open-jobs-heading">Open {name} jobs</SectionHeading>
      {shown.length > 0 ? (
        <>
          <p className="mt-4 max-w-2xl text-pretty text-[16.5px] leading-relaxed text-ecrn-secondary">
            Live from the ECRN job board. {jobs.length > shown.length ? `Showing ${shown.length} of ${jobs.length} matching roles. ` : ""}
            Every role is recruited by Delta Construction Partners.
          </p>
          <ul role="list" className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
            {shown.map((j) => {
              const place = jobLocation(j);
              const salary = jobSalary(j);
              const payout = jobPayout(j);
              return (
                <li key={j.id}>
                  <Link href={`/jobs/${j.id}`} className="career-card flex h-full flex-col rounded-[18px] border border-ecrn-line bg-ecrn-paper p-[18px] sm:p-5">
                    <h3 className="text-balance font-display text-[18px] font-semibold leading-snug text-ecrn-ink sm:text-[19px]">{j.title}</h3>
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
          <Link href="/jobs" className="career-press mt-4 inline-flex min-h-[44px] items-center gap-1.5 text-[16px] font-semibold text-ecrn-green-text">
            See all open jobs <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </>
      ) : (
        <div className="mt-6 rounded-[20px] border border-dashed border-[#B9C4BB] bg-ecrn-paper px-[18px] py-5 sm:px-7 sm:py-7">
          <p className="text-balance font-display text-[19px] font-semibold leading-snug text-ecrn-ink sm:text-[20px]">No {name} jobs are posted on ECRN right now.</p>
          <p className="mt-2 max-w-xl text-pretty text-[16px] leading-relaxed text-ecrn-secondary">
            The board changes as contractors open and fill roles. Browse everything that is open, or create a free account so your
            profile is ready when the right role is posted.
          </p>
          {/* Full width and stacked on phones (primary first), side by side from 640 px. */}
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <CtaLink href="/signup" className="w-full sm:w-auto">
              Create a free account
            </CtaLink>
            <CtaLink href="/jobs" variant="dark" className="w-full sm:w-auto">
              Browse all open jobs
            </CtaLink>
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
 *  - default: photo on top (16:10)
 *  - wide: photo beside the text from md up (for a stage with one role)
 *  - compact: no photo (related-role lists)
 */
export function RoleCard({
  role,
  openJobs = 0,
  wide = false,
  compact = false,
  heading = "h3",
  showTier = true,
}: {
  role: RoleEntry;
  openJobs?: number;
  wide?: boolean;
  compact?: boolean;
  heading?: "h3" | "h4";
  /** The "Tier 2 · Field leadership" line. Off inside the career path, where the stage already says it. */
  showTier?: boolean;
}) {
  const tier = TIERS[role.tierIndex];
  const cardFigure = cardPay(role);
  const H = heading;
  return (
    <Link
      href={`/careers/${role.slug}`}
      className={cn("career-card flex h-full overflow-hidden rounded-[20px] border border-ecrn-line bg-white sm:rounded-[22px]", wide ? "flex-col md:flex-row" : "flex-col")}
    >
      {!compact && (
        <div className={cn("relative aspect-[16/10] w-full shrink-0", wide && "md:aspect-auto md:min-h-[300px] md:w-[46%]")}>
          <SiteImage name={role.image} fill sizes={wide ? "(min-width: 768px) 520px, calc(100vw - 88px)" : "(min-width: 768px) 520px, calc(100vw - 88px)"} />
          {openJobs > 0 && (
            <span className="career-chip absolute left-3 top-3 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-medium text-white">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ecrn-green" />
              {openJobs} open {openJobs === 1 ? "job" : "jobs"}
            </span>
          )}
        </div>
      )}
      <div className={cn("flex flex-1 flex-col", compact ? "p-[18px] sm:p-6" : "p-5 sm:p-7")}>
        {showTier && (
          <p className={cn(labelClass, "mb-1.5")}>
            {tier.tier} · {tier.name}
          </p>
        )}
        <H className={cn("text-balance font-display font-semibold leading-[1.12] tracking-[-0.025em] text-ecrn-ink", compact ? "text-[20px] sm:text-[21px]" : "text-[23px] sm:text-[26px]")}>
          {role.title}
        </H>
        <p className="mt-2 text-pretty text-[15.5px] leading-relaxed text-ecrn-secondary">{role.summary}</p>
        {/* Pay and reward side by side, so the card stays short on a phone. The reward keeps its own width and
            never wraps; the pay figure takes the rest and may break before "to". */}
        <dl className="mt-4 grid grid-cols-[minmax(0,1fr)_auto] gap-x-5 border-t border-ecrn-line pt-4">
          <div className="min-w-0">
            <dt className="text-[13px] leading-snug text-ecrn-secondary">Median pay, {PAY_PERIOD}</dt>
            <dd className="mt-1 text-balance font-display text-[18px] font-semibold leading-[1.2] tracking-[-0.02em] text-ecrn-ink tabular-nums sm:text-[20px]">
              {cardFigure.value}
            </dd>
            <dd className="mt-1 text-pretty text-[13px] leading-snug text-ecrn-secondary">{cardFigure.note}</dd>
          </div>
          <div>
            <dt className="text-[13px] leading-snug text-ecrn-secondary">Referral reward</dt>
            <dd className="mt-1 whitespace-nowrap font-display text-[18px] font-semibold leading-[1.2] tracking-[-0.02em] text-cobalt tabular-nums sm:text-[20px]">
              {tier.amount}
            </dd>
            <dd className="mt-1 text-[13px] leading-snug text-ecrn-secondary">Estimate, per hire</dd>
          </div>
        </dl>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[15px] font-semibold text-ecrn-green-text">
          Read the guide <ArrowRight className="career-card-arrow h-4 w-4" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Delta
// ─────────────────────────────────────────────────────────────────────

/**
 * The one clear statement of who Delta is, on every career and glossary page:
 * the site's shared Delta panel (recruiting since 2008, 30+ recruiters,
 * national contractor relationships, a link to Delta's site), so careers read
 * the same as the rest of the site.
 */
export function DeltaBand({ title = "The recruiters behind every role on ECRN", image = "handshake-site" }: { title?: string; image?: string } = {}) {
  return <SiteDeltaBand title={title} image={image} />;
}
