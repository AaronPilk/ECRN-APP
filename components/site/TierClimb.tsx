import { cn } from "@/lib/utils/cn";
import { TIERS } from "@/lib/site";
import { CountUp } from "./motion/CountUp";
import { Reveal } from "./motion/Reveal";
import { siteVars } from "./motion/vars";

/**
 * The reward tiers from lib/site.ts as a climb. On phones: one card per tier
 * with a bar that gets longer down the list. From md up: a bar chart on one
 * baseline, rising from the first tier to the last. Bars rise and the amounts
 * count up once, when the chart scrolls into view. Every figure is in the
 * HTML. Place it on a light surface.
 */
export function TierClimb({ className }: { className?: string }) {
  const tiers = TIERS.map((t) => {
    const match = t.amount.match(/^(.*?)\$([\d,]+)\s*$/);
    return { ...t, label: match?.[1].trim() ?? "", value: match ? Number(match[2].replace(/,/g, "")) : 0 };
  });
  const top = Math.max(1, ...tiers.map((t) => t.value));

  return (
    <Reveal group as="ol" className={cn("site-tiers", className)}>
      {tiers.map((t, i) => (
        <li key={t.tier} className="site-tier" style={siteVars({ i, level: t.value ? t.value / top : (i + 1) / tiers.length })}>
          <div className="site-tier-meta">
            <p className="site-eyebrow text-[color:var(--site-fg-3,#5F6E66)]">{t.tier}</p>
            <h3 className="site-display-5 mt-1.5 text-[color:var(--site-fg,#0F1612)]">{t.name}</h3>
          </div>
          <div className="site-tier-chart">
            <p className="site-tier-amount">
              {t.value ? (
                <>
                  <span className="block font-display text-[12.5px] font-medium tracking-[0.01em] text-[color:var(--site-fg-2,#506158)] md:text-[13.5px]">{t.label || "Up to"}</span>
                  <span className="site-num mt-0.5 block text-[28px] font-semibold leading-none md:mt-1 md:text-[clamp(1.75rem,3.1vw,2.75rem)]">
                    <CountUp value={t.value} prefix="$" delay={i * 90} />
                  </span>
                </>
              ) : (
                <span className="site-num block text-[24px] font-semibold leading-tight">{t.amount}</span>
              )}
            </p>
            <div className="site-tier-bar" aria-hidden>
              <span className="site-tier-fill" />
            </div>
          </div>
          <p className="site-tier-roles text-[14.5px] leading-relaxed text-[color:var(--site-fg-2,#506158)]">{t.roles.join(" · ")}</p>
        </li>
      ))}
    </Reveal>
  );
}
