import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Breadcrumbs, Container, DELTA, DeltaLogo, GlassCard } from "@/components/site/Blocks";
import { SiteImage } from "@/components/site/SiteImage";

/**
 * Building blocks for the inner pages (rewards, how it works, employers,
 * about, FAQ, support, legal, jobs). They sit on the site primitives in
 * components/site/Blocks.tsx and add the pass 2 phone rhythm:
 *   sections 56 px top and bottom on phones, 80 from sm, 96 from lg;
 *   eyebrow → 12 px → heading → 16 px → intro → 32 px → content;
 *   20 px gutters on phones, 32 from sm, so every left edge lines up.
 * Styles: components/site/inner/inner.css (classes prefixed inner-).
 */

export type BandTone = "paper" | "white" | "dark";

const TONE: Record<BandTone, string> = {
  paper: "site-tone-light bg-ecrn-paper",
  white: "site-tone-light bg-white",
  dark: "site-tone-dark bg-ecrn-black",
};

/** A full-width section with the inner-page rhythm and the site gutter. */
export function Band({
  children,
  tone = "paper",
  id,
  first = false,
  className,
  containerClassName,
  labelledBy,
}: {
  children: ReactNode;
  tone?: BandTone;
  id?: string;
  /** The first band under the breadcrumbs: a shorter top, the crumbs already give it air. */
  first?: boolean;
  className?: string;
  containerClassName?: string;
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn("relative pb-14 sm:pb-20 lg:pb-24", first ? "pt-8 sm:pt-12 lg:pt-14" : "pt-14 sm:pt-20 lg:pt-24", TONE[tone], className)}
    >
      <Container className={containerClassName}>{children}</Container>
    </section>
  );
}

/**
 * Content inside the site's dark Island, with the section rhythm. It is a
 * Container, so site.css (.site-island .site-container) takes back the
 * Island's 8 px (12 px from sm) inset and every left edge stays on the gutter.
 */
export function IslandBody({ children, className }: { children: ReactNode; className?: string }) {
  return <Container className={cn("py-14 sm:py-20 lg:py-24", className)}>{children}</Container>;
}

/** Heading for a section: optional kicker, the heading (h2 by default) and an intro. */
export function Heading({
  title,
  intro,
  kicker,
  id,
  as: Tag = "h2",
  size = "md",
  className,
}: {
  title: ReactNode;
  intro?: ReactNode;
  kicker?: ReactNode;
  id?: string;
  as?: "h2" | "h3";
  size?: "md" | "sm";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      {kicker ? <p className="inner-kicker">{kicker}</p> : null}
      <Tag id={id} className={cn(size === "sm" ? "inner-h2-sm" : "inner-h2", kicker ? "mt-3" : null)}>
        {title}
      </Tag>
      {intro ? <div className="inner-intro mt-4">{intro}</div> : null}
    </div>
  );
}

/**
 * The breadcrumb row under a page hero (the site's Breadcrumbs, 44 px tap
 * targets). Mirrors the BreadcrumbList JSON-LD the page prints, so pass the
 * same items.
 */
export function Crumbs({ items, className }: { items: { name: string; path: string }[]; className?: string }) {
  return (
    <div className={cn("site-tone-light bg-ecrn-paper", className)}>
      <Container className="pt-2">
        <Breadcrumbs items={items} />
      </Container>
    </div>
  );
}

/**
 * The one short statement of who Delta is (pass 2: once in the body of every
 * major page), as a full-width navy card with Delta's logo from the shared
 * lockup (components/site/Delta.tsx). Facts only: recruiting since 2008,
 * 30+ recruiters, national contractor relationships, a link to Delta's site.
 * DeltaStatement in Blocks is the compact sidebar version of the same idea.
 */
export function DeltaNote({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <aside aria-label={`About ${DELTA.name}`} className={cn("inner-delta relative rounded-[24px] p-6 sm:rounded-[28px] sm:p-8 lg:p-10", className)}>
      <div className="grid gap-5 md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:items-start md:gap-10">
        <DeltaLogo size={32} />
        <div>
          <p className="max-w-[40rem] text-pretty text-[16px] leading-[1.6] text-white/[0.86] lg:text-[17px]">
            {children ?? (
              <>
                ECRN is powered by {DELTA.name}, a construction recruiting firm that has been recruiting since {DELTA.since}. Its {DELTA.recruiters}{" "}
                recruiters and national contractor relationships are behind every referral and application on ECRN.
              </>
            )}
          </p>
          <a
            href={DELTA.url}
            target="_blank"
            rel="noopener"
            className="mt-2 inline-flex min-h-11 items-center gap-1.5 font-display text-[15px] font-semibold text-[#BCDFFF] underline decoration-[#BCDFFF]/40 underline-offset-4"
          >
            {DELTA.domain}
            <ArrowUpRight aria-hidden className="h-4 w-4" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </div>
    </aside>
  );
}

/** A numbered list for light sections: number on the left, title and one or two lines on the right. */
export function StepList({
  steps,
  className,
  start = 1,
}: {
  steps: { title: string; body: ReactNode }[];
  className?: string;
  start?: number;
}) {
  return (
    <ol className={cn("inner-steps", className)}>
      {steps.map((s, i) => (
        <li key={s.title}>
          <span aria-hidden className="inner-steps-n">
            {String(i + start).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <h3 className="inner-h3">{s.title}</h3>
            <div className="inner-body mt-1.5">{s.body}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * A photo in a rounded frame with an optional glass caption. `ratio` crops it
 * (phones get 4:3 or 16:10, the subject stays in frame through the manifest's
 * focal point); `sizes` should match the width it really renders at.
 */
export function PhotoFrame({
  image,
  sizes,
  ratio = "16 / 10",
  caption,
  className,
  priority = false,
}: {
  image: string;
  sizes: string;
  ratio?: string;
  caption?: ReactNode;
  className?: string;
  priority?: boolean;
}) {
  return (
    <figure className={cn("site-frame relative rounded-[22px] sm:rounded-[28px]", className)}>
      <SiteImage name={image} ratio={ratio} sizes={sizes} priority={priority} />
      {caption ? (
        <figcaption className="absolute inset-x-3 bottom-3 sm:inset-x-auto sm:bottom-5 sm:left-5">
          <GlassCard weight="thin" className="inline-flex max-w-full items-center gap-3 rounded-[16px] px-3.5 py-3">
            {caption}
          </GlassCard>
        </figcaption>
      ) : null}
    </figure>
  );
}

/** Definition rows: label above value on phones, side by side from md. */
export function Spec({ rows, className }: { rows: { label: string; value: ReactNode }[]; className?: string }) {
  return (
    <dl className={cn("inner-spec", className)}>
      {rows.map((r) => (
        <div key={r.label}>
          <dt>{r.label}</dt>
          <dd>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}
