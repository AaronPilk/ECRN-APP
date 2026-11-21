import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { DELTA, DeltaLogo } from "@/components/site/Blocks";
import { Reveal, siteVars } from "@/components/site/motion";
import { TIERS } from "@/lib/site";

/** "Up to $2,500" → { prefix: "Up to", figure: "$2,500" }. */
function splitAmount(amount: string) {
  const m = amount.match(/^(.*?)(\$[\d,]+)\s*$/);
  return { prefix: m?.[1].trim() || "Up to", figure: m?.[2] ?? amount };
}

/**
 * The four reward tiers from lib/site.ts as one ladder: each rung deepens in
 * colour as the reward rises (white, pale cobalt, cobalt, navy), with the
 * amount on the right in tabular figures, the roles as chips and a meter
 * that lights one segment per $2,500.
 */
export function RewardLadder({ className }: { className?: string }) {
  return (
    <Reveal as="ol" className={cn("inner-ladder", className)}>
      {TIERS.map((t, i) => {
        const level = i + 1;
        const { prefix, figure } = splitAmount(t.amount);
        return (
          <li key={t.tier} className="inner-rung" data-tier={level}>
            <div className="inner-rung-head">
              <p className="inner-rung-tier">
                <span>{t.tier}</span>
                <span className="inner-meter" aria-hidden>
                  {[1, 2, 3, 4].map((n) => (
                    <span key={n} data-on={n <= level ? "" : undefined} style={siteVars({ n })} />
                  ))}
                </span>
              </p>
              <h3 className="inner-rung-name">{t.name}</h3>
            </div>
            <p className="inner-rung-amount">
              <span className="inner-rung-upto">{prefix}</span>
              <span className="inner-rung-figure">{figure}</span>
            </p>
            <ul className="inner-rung-roles" aria-label={`Roles in ${t.tier}`}>
              {t.roles.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="inner-rung-summary">{t.summary}</p>
          </li>
        );
      })}
    </Reveal>
  );
}

function TimelineEvent({ when, title, children, final = false }: { when?: string; title: string; children: ReactNode; final?: boolean }) {
  return (
    <li className="inner-tl-event" data-when={when ? "" : undefined} data-final={final ? "" : undefined}>
      <span aria-hidden className="inner-tl-dot" />
      <div className="inner-tl-body">
        {when ? <p className="inner-tl-when">{when}</p> : null}
        <h3 className={cn("inner-h3", when ? "mt-1" : null)}>{title}</h3>
        <p className="inner-tl-text">{children}</p>
      </div>
    </li>
  );
}

/**
 * From "you send a name" to "you get paid". The steps before the start date
 * take as long as hiring takes, so they are short nodes. The guarantee period
 * is a bar in three equal thirds with a mark every 30 days: the long wait,
 * drawn to scale. Place it on a dark surface.
 */
export function PayoutTimeline({ className }: { className?: string }) {
  return (
    <ol className={cn("inner-tl", className)}>
      <TimelineEvent when="The day you refer" title="You send a name">
        Pick someone from your phone&apos;s contacts, or type their name and phone number. That&apos;s all ECRN needs from you.
      </TimelineEvent>
      <TimelineEvent title="Delta's recruiters take it from there">
        A recruiter at {DELTA.name} calls your referral, vets them, and handles the interviews and follow-up.
      </TimelineEvent>
      <TimelineEvent when="Start date" title="They're hired and start work">
        Your referral is placed with a Delta client. Their first day on the job starts the guarantee period.
      </TimelineEvent>
      <li className="inner-tl-span">
        <div aria-hidden className="inner-tl-bar">
          <span className="inner-tl-fill" />
        </div>
        <span aria-hidden className="inner-tl-tick" style={{ gridRow: 1 }}>
          Day 0
        </span>
        <div className="inner-tl-third">
          <p className="inner-tl-when">Typically 90 days</p>
          <h3 className="inner-h3 mt-1">The guarantee period</h3>
          <p className="inner-tl-text">
            It runs from your referral&apos;s start date. If the placement ends before it&apos;s complete, no reward is issued.
          </p>
        </div>
        <span aria-hidden className="inner-tl-tick" style={{ gridRow: 2 }}>
          Day 30
        </span>
        <span aria-hidden className="inner-tl-tick" style={{ gridRow: 3 }}>
          Day 60
        </span>
        <span aria-hidden className="inner-tl-tick" data-end="" style={{ gridRow: 3 }}>
          Day 90
        </span>
      </li>
      <TimelineEvent when="After the guarantee period" title="You get paid" final>
        Delta confirms your amount in writing and processes your payout.
      </TimelineEvent>
    </ol>
  );
}

/**
 * A sample payout, set like a statement: who was referred, the tier, the
 * guarantee period and the estimate (Tier 2, up to $5,000, from TIERS).
 * Marked Example twice: a stamp at the top and a line at the bottom.
 */
export function ExampleStatement({ className }: { className?: string }) {
  const tier = TIERS[1];
  const { prefix, figure } = splitAmount(tier.amount);
  const rows: [string, ReactNode][] = [
    ["Referred", "A foreman you've worked with"],
    ["Hired as", "Foreman"],
    ["Tier", `${tier.tier}, ${tier.name.toLowerCase()}`],
    ["Placed with", `A ${DELTA.name} client`],
    [
      "Guarantee period",
      <span key="g" className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
        90 days from start date
        <span className="inline-flex items-center gap-1 rounded-full bg-[#E3F8EC] px-2 py-0.5 text-[13px] font-semibold text-[#07653E]">
          <Check aria-hidden className="h-3.5 w-3.5" /> Complete
        </span>
      </span>,
    ],
  ];
  const track = ["Placed", "Day 90", "Confirmed", "Paid"];

  return (
    <figure className={cn("inner-stmt", className)}>
      {/* Letterhead: the stamp on the left, the issuer's logo on the right. */}
      <div className="flex items-center justify-between gap-3">
        <span className="inner-stmt-example">Example</span>
        <DeltaLogo tone="light" size={20} />
      </div>

      <p className="mt-6 font-display text-[21px] font-semibold leading-tight tracking-[-0.02em] text-ecrn-ink sm:text-[24px]">Referral reward statement</p>
      <p className="mt-1 text-[14px] leading-snug text-[#56655D]">For an ECRN referral placed by {DELTA.name}</p>

      <dl className="mt-4 shadow-[inset_0_1px_0_#E8ECE7]">
        {rows.map(([k, v]) => (
          <div key={k} className="inner-stmt-row">
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>

      <div className="flex items-end justify-between gap-4 pt-5">
        <p className="pb-1 font-display text-[14px] font-medium leading-snug text-[#3E4D45]">
          Reward
          <span className="block text-[13px] font-normal text-[#56655D]">{tier.tier} estimate</span>
        </p>
        <p className="text-right">
          <span className="block font-display text-[13px] font-medium text-[#56655D]">{prefix}</span>
          <span className="inner-stmt-figure">{figure}</span>
        </p>
      </div>

      <ol className="mt-6 grid grid-cols-4 rounded-[16px] bg-ecrn-paper px-1 py-3.5" aria-label="Payout status in this example">
        {track.map((s, i) => (
          <li key={s} className="relative flex flex-col items-center gap-1.5 text-center">
            {i < track.length - 1 ? (
              <span aria-hidden className="absolute left-[calc(50%+0.875rem)] right-[calc(-50%+0.875rem)] top-[0.6875rem] h-0.5 rounded-full bg-ecrn-green" />
            ) : null}
            <span className="grid h-6 w-6 place-items-center rounded-full bg-ecrn-green text-ecrn-action-ink">
              <Check aria-hidden className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
            <span className="font-display text-[13px] font-medium leading-tight text-ecrn-ink">{s}</span>
          </li>
        ))}
      </ol>

      <figcaption className="mt-5 text-[13.5px] leading-relaxed text-[#56655D]">
        Example only. {DELTA.name} sets your final amount and confirms it in writing before payout.
      </figcaption>
    </figure>
  );
}
