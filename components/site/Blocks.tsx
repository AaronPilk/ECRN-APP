import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRight, ArrowUpRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Faq } from "@/lib/site";
import { DELTA, DeltaBadge, DeltaLogo } from "./Delta";
import { SiteImage } from "./SiteImage";
import { Parallax } from "./motion/Parallax";
import { Reveal } from "./motion/Reveal";
import { siteVars } from "./motion/vars";

/**
 * Building blocks for the public site. Look and motion live in
 * app/(site)/site.css (classes prefixed site-) and components/site/motion.
 *
 * Tone: a dark or light surface sets a few custom properties (--site-fg,
 * --site-fg-2, --site-accent, --site-rule) and everything inside reads them,
 * so Eyebrow, SectionHeading, ArrowLink, FaqList, KeyFacts, StackedTable and
 * Timeline work on either.
 *
 * Phone rhythm (the contract's spacing system): 20 px gutter (32 from sm),
 * sections 56 px top and bottom (80 from sm, 96 from lg), and inside a
 * section eyebrow → 12 px → heading → 16 px → intro → 32 px → content.
 * SectionHeading sets the first two gaps; give the content after it mt-8.
 *
 * ── Pass 2 additions (every pass-1 export and prop still works) ──────────
 *
 *   Co-brand (from ./Delta)
 *     CoBrandLockup  { tone?: "dark"|"light", size?: "header"|"app"|"lg"|px, layout?: "row"|"stack"|"auto",
 *                      ecrnHref?, deltaHref?, ecrnLabel?, deltaLabel?, className?, style? }
 *     DeltaLogo      { tone?, size?, href?, label?, className?, style? }      Delta mark + typeset name
 *     DeltaWordmark  { tone?, className?, style? }                             the typeset name alone
 *     EcrnLogo       { tone?, alt?, className?, style? }                       ECRN artwork, white or ink type
 *     DeltaBadge     { tone?, label?: "An initiative of"|"Powered by", href?, className?, style? }
 *                    the compact chip PageHero and FinalCta now show
 *
 *   DeltaStatement { tone?: "light"|"dark", children?, className? }
 *     A compact "who is behind ECRN" card (Delta logo, one or two sentences,
 *     link to Delta's site) for the body of a page or an article sidebar.
 *     DeltaBand stays the big version.
 *
 *   KeyFacts       { items: { value, label, note?, accent? }[], columns?: 1|2|3|4, className? }
 *   KeyFact        { value, label, note?, accent?, className? }   (inside KeyFacts or a <dl>)
 *     Stat tiles. Two up on phones (keep values short enough to fit a
 *     150 px tile at 26 px, e.g. "$10,000", "90 days", "30+"), 3 or 4 up from md.
 *
 *   StackedTable   { caption, columns: { key, label, numeric?, strong? }[], rows: Record<key, ReactNode>[],
 *                    rowHeader?: key, captionHidden?, className? }
 *     A real <table> from 640 px; below that one card per row (the rowHeader
 *     cell as its title, the other cells as label / value lines). Numbers
 *     right-aligned in tabular figures. Nothing scrolls sideways.
 *
 *   Timeline       { steps: { title, body?, meta?, marker?, state?: "done"|"now"|"next" }[],
 *                    titleAs?: "p"|"h3"|"h4", accent?, className? }
 *     A vertical sequence: numbered markers on the first line of each title,
 *     a line between them (accent-coloured for done steps), optional meta on
 *     the right ("Day 0", "Week 2", "Day 90").
 *
 *   CtaLink        new optional `block`: full width below 640 px.
 *   FaqList        now a disclosure list: the whole question row is the
 *                  toggle (56 px+), every answer stays in the HTML. New
 *                  optional `open?: "first"|"none"|"all"` (default "first").
 *   Breadcrumbs    44 px tap targets, same props.
 *   Section        phone rhythm (py-14 sm:py-20 lg:py-24), same props.
 *   PageHero, FinalCta   show DeltaBadge; CTAs are full width on phones.
 *   Container      carries `site-container` so islands can line it up with the page gutter.
 */

export { CoBrandLockup, DELTA, DeltaArt, DeltaBadge, DeltaLogo, DeltaMark, DeltaWordmark, EcrnLogo, PoweredByDelta } from "./Delta";
export type { BrandTone, LockupSize } from "./Delta";

export type SiteTone = "paper" | "white" | "dark";

const TONE: Record<SiteTone, string> = {
  paper: "site-tone-light bg-ecrn-paper",
  white: "site-tone-light bg-white",
  dark: "site-tone-dark bg-ecrn-black",
};

const isExternal = (href: string) => /^https?:\/\//.test(href);

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("site-container mx-auto w-full max-w-[1200px] px-5 sm:px-8", className)}>{children}</div>;
}

/** Small label above a heading. Follows the surface tone; `light` forces the on-dark colour. */
export function Eyebrow({ children, light, className }: { children: ReactNode; light?: boolean; className?: string }) {
  return <p className={cn("site-eyebrow", light ? "text-[#91F9B3]" : "text-[color:var(--site-accent,#07653E)]", className)}>{children}</p>;
}

/**
 * Button-shaped link. primary = green (the one main action), ghost = glass for
 * dark surfaces and photos, dark / light = solid for light surfaces.
 * External URLs open in a new tab. Long labels wrap onto a balanced second
 * line on narrow phones. `block` makes it full width below 640 px.
 */
export function CtaLink({
  href,
  children,
  variant = "primary",
  block = false,
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost" | "dark" | "light";
  /** Full width on phones (below 640 px). */
  block?: boolean;
  className?: string;
}) {
  const cls = cn("site-btn inline-flex", `site-btn-${variant}`, block && "w-full sm:w-auto", className);
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener" className={cls}>
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}

/** Text link with an arrow that nudges on hover. Colour follows the surface tone. 44 px tall. */
export function ArrowLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  const cls = cn("site-link inline-flex", className);
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener" className={cls}>
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
        <ArrowUpRight aria-hidden className="h-4 w-4" />
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
      <ArrowRight aria-hidden className="h-4 w-4" />
    </Link>
  );
}

/**
 * Full-width band with a tone, vertical rhythm and a Container.
 *   sheet  rounds the top corners and slides the band over the one above
 *          (give the band above about 1.75rem of extra bottom padding)
 *   bare   skip the Container (you place your own)
 */
export function Section({
  children,
  tone = "paper",
  id,
  sheet = false,
  bare = false,
  className,
  containerClassName,
}: {
  children: ReactNode;
  tone?: SiteTone;
  id?: string;
  sheet?: boolean;
  bare?: boolean;
  className?: string;
  containerClassName?: string;
}) {
  return (
    <section id={id} className={cn("relative py-14 sm:py-20 lg:py-24", TONE[tone], sheet && "z-[1] -mt-7 rounded-t-[28px] sm:-mt-10 sm:rounded-t-[40px]", className)}>
      {bare ? children : <Container className={containerClassName}>{children}</Container>}
    </section>
  );
}

/**
 * A dark panel with rounded corners that floats in a light page, a few pixels
 * in from the screen edge. Clips with overflow-clip, so sticky and
 * scroll-linked children keep working. A Container inside lines up with the
 * page gutter (site.css: .site-island .site-container).
 */
export function Island({ children, id, className, innerClassName }: { children: ReactNode; id?: string; className?: string; innerClassName?: string }) {
  return (
    <section id={id} className={cn("site-tone-light bg-ecrn-paper px-2 sm:px-3", className)}>
      <div className={cn("site-tone-dark site-island relative isolate overflow-clip rounded-[28px] bg-ecrn-black sm:rounded-[40px]", innerClassName)}>{children}</div>
    </section>
  );
}

/** Eyebrow, heading and intro for a section (12 px and 16 px apart). `as` picks the heading level (default h2). */
export function SectionHeading({
  eyebrow,
  title,
  intro,
  as: Tag = "h2",
  align = "left",
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  intro?: ReactNode;
  as?: "h1" | "h2" | "h3";
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <Tag className={cn("site-display-3", eyebrow ? "mt-3" : null)}>{title}</Tag>
      {intro ? <div className={cn("site-lede mt-4 max-w-2xl text-[color:var(--site-fg-2,#506158)]", align === "center" && "mx-auto")}>{intro}</div> : null}
    </div>
  );
}

/**
 * Frosted panel. Dark glass floats over photography or the dark canvas;
 * tone="light" is for photos inside light sections. Weight carries hierarchy:
 * thin for chips, regular for cards, thick for the most important surface.
 * Never place one glass surface on top of another.
 */
export function GlassCard({
  children,
  weight = "regular",
  tone = "dark",
  className,
  style,
}: {
  children: ReactNode;
  weight?: "thin" | "regular" | "thick";
  tone?: "dark" | "light";
  className?: string;
  /** For `siteVars({ i })` when the card carries `site-enter` itself. */
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn(tone === "light" ? "site-glass-light" : "site-glass", tone === "dark" && weight === "thin" && "site-glass-thin", tone === "dark" && weight === "thick" && "site-glass-thick", "rounded-[22px]", className)}
      style={style}
    >
      {children}
    </div>
  );
}

/**
 * A photo as a surface: the image drifts inside its frame as the page scrolls,
 * a scrim keeps the text readable, and the children sit at the bottom.
 * Looks deliberate while the photo is still a placeholder.
 */
export function PhotoTile({
  image,
  sizes = "(min-width: 1024px) 600px, 100vw",
  tint = "ink",
  accent,
  className,
  contentClassName,
  children,
}: {
  /** Image name from lib/site-images.ts. */
  image: string;
  sizes?: string;
  tint?: "ink" | "navy" | "green";
  /** Accent colour for links and icons inside (default mint). */
  accent?: string;
  className?: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("site-frame site-tone-dark site-zoom-host flex rounded-[24px] sm:rounded-[28px]", className)} style={accent ? siteVars({ accent }) : undefined}>
      <Parallax cover>
        <SiteImage name={image} fill sizes={sizes} className="site-zoom" />
      </Parallax>
      <div aria-hidden className={tint === "navy" ? "site-scrim-navy" : tint === "green" ? "site-scrim-green" : "site-scrim"} />
      <div className={cn("relative flex w-full flex-col justify-end p-5 sm:p-8", contentClassName)}>{children}</div>
    </div>
  );
}

/**
 * The one clear statement of who is behind ECRN. Use it once on every major
 * page. Facts are fixed (lib/site.ts): recruiting since 2008, 30+ recruiters,
 * national contractor relationships, with a link to Delta's own site.
 */
export function DeltaBand({
  image = "site-office-plans",
  tone = "paper",
  id = "delta",
  title = "ECRN is powered by Delta Construction Partners.",
  className,
}: {
  /** Image name from lib/site-images.ts. */
  image?: string;
  /** Tone of the band around the panel. */
  tone?: SiteTone;
  id?: string;
  title?: string;
  className?: string;
}) {
  const stats: [string, string][] = [
    [DELTA.since, "Recruiting since"],
    [DELTA.recruiters, "Recruiters working every referral"],
    ["National", "Contractor relationships"],
  ];
  return (
    <section id={id} className={cn("relative py-14 sm:py-20 lg:py-24", TONE[tone], className)}>
      <Container>
        <div className="site-delta-panel grid rounded-[24px] sm:rounded-[36px] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <Reveal className="min-w-0 p-5 pb-7 sm:p-10 lg:p-14">
            <p className="site-eyebrow text-[color:var(--site-accent)]">Who is behind ECRN</p>
            <h2 className="site-display-3 mt-3">{title}</h2>
            <p className="site-lede mt-4 max-w-xl text-[color:var(--site-fg-2)]">
              {DELTA.name} is a construction recruiting firm, recruiting since {DELTA.since}. Its {DELTA.recruiters} recruiters and national contractor
              relationships are what turn a referral into a hire: they handle the vetting, the interviews and the follow-up.
            </p>
            <dl className="mt-7 grid gap-x-6 border-t border-[color:var(--site-rule)] sm:grid-cols-3">
              {stats.map(([value, label]) => (
                <div key={label} className="flex flex-row-reverse items-baseline justify-end gap-4 border-b border-[color:var(--site-rule)] py-3.5 sm:flex-col-reverse sm:items-start sm:gap-2.5 sm:border-b-0 sm:pb-0 sm:pt-6">
                  <dt className="text-[15px] leading-snug text-[color:var(--site-fg-2)]">{label}</dt>
                  <dd className="site-num w-[6.75rem] shrink-0 text-[26px] font-semibold leading-none text-[color:var(--site-accent)] sm:w-auto sm:text-[34px]">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-8 flex flex-col items-stretch gap-x-7 gap-y-2 sm:flex-row sm:flex-wrap sm:items-center">
              <CtaLink href={DELTA.url} variant="light">
                <span>
                  Visit <span className="sm:hidden">Delta&apos;s website</span>
                  <span className="hidden sm:inline">{DELTA.name}</span>
                </span>
                <ArrowUpRight aria-hidden className="h-4 w-4" />
              </CtaLink>
              <ArrowLink href="/about" className="self-start sm:self-auto">
                About ECRN
              </ArrowLink>
            </div>
          </Reveal>
          <div className="site-frame aspect-[16/10] lg:aspect-auto lg:min-h-0">
            <Parallax cover>
              <SiteImage name={image} fill sizes="(min-width: 1024px) 560px, 100vw" />
            </Parallax>
            <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-[#00244B]/80 via-[#00244B]/10 to-[#00183A]/80 lg:bg-gradient-to-r lg:from-[#052A5C] lg:via-[#00244B]/25 lg:to-transparent" />
            {/* Delta's name on the photo: still (no parallax), inside the frame on every screen. */}
            <GlassCard weight="thin" className="absolute bottom-4 left-4 rounded-[16px] px-4 py-3.5 sm:bottom-6 sm:left-6 lg:left-auto lg:right-7">
              <DeltaLogo size={24} />
            </GlassCard>
          </div>
        </div>
      </Container>
    </section>
  );
}

/**
 * Compact "who is behind ECRN" card: Delta's logo, a sentence or two (pass
 * children to replace the default) and a link to Delta's site. For the body
 * of a page, an article sidebar or an "About ECRN" box. Light by default; a
 * navy panel with tone="dark".
 */
export function DeltaStatement({ tone = "light", children, className }: { tone?: "light" | "dark"; children?: ReactNode; className?: string }) {
  const dark = tone === "dark";
  return (
    <aside aria-label="Who is behind ECRN" className={cn(dark ? "site-delta-panel rounded-[22px] p-5 pb-2.5 sm:p-7 sm:pb-4" : "site-delta-note site-tone-light", className)}>
      <DeltaLogo tone={dark ? "dark" : "light"} size={26} />
      <p className={cn("mt-4 text-[16px] leading-[1.6]", dark ? "text-white/[0.82]" : "text-ecrn-secondary")}>
        {children ?? (
          <>
            ECRN is an initiative of <span className={cn("font-semibold", dark ? "text-white" : "text-navy")}>{DELTA.name}</span>, a construction
            recruiting firm: recruiting since {DELTA.since}, with {DELTA.recruiters} recruiters and national contractor relationships.
          </>
        )}
      </p>
      <a href={DELTA.url} target="_blank" rel="noopener" className="site-link inline-flex" style={siteVars({ accent: dark ? "#A9CEFF" : "#0655CE" })}>
        {DELTA.domain}
        <span className="sr-only"> (opens in a new tab)</span>
        <ArrowUpRight aria-hidden className="h-4 w-4" />
      </a>
    </aside>
  );
}

/** One stat tile. Use inside <KeyFacts> (or any <dl>): the value shows above the label. */
export function KeyFact({ value, label, note, accent, className }: { value: ReactNode; label: ReactNode; note?: ReactNode; accent?: string; className?: string }) {
  return (
    <div className={cn("site-keyfact", className)} style={accent ? siteVars({ "keyfact-accent": accent }) : undefined}>
      <dt className="site-keyfact-label">
        {label}
        {note ? <span className="site-keyfact-note block">{note}</span> : null}
      </dt>
      <dd className="site-keyfact-value">{value}</dd>
    </div>
  );
}

/** Stat tiles: two up on phones, `columns` (3 or 4) from md. */
export function KeyFacts({
  items,
  columns = 2,
  className,
}: {
  items: { value: ReactNode; label: ReactNode; note?: ReactNode; accent?: string }[];
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}) {
  return (
    <dl className={cn("site-keyfacts", className)} data-cols={columns}>
      {items.map((it, i) => (
        <KeyFact key={i} value={it.value} label={it.label} note={it.note} accent={it.accent} />
      ))}
    </dl>
  );
}

export interface StackedColumn<K extends string = string> {
  key: K;
  label: ReactNode;
  /** Right-aligned, tabular figures (money, counts, days). */
  numeric?: boolean;
  /** Set in the heading face, full colour (the column that matters most). */
  strong?: boolean;
}

/**
 * A table that never scrolls sideways: a real <table> from 640 px, and below
 * that one card per row, the `rowHeader` cell as the card's title and every
 * other cell as a label / value line. Both are in the HTML; CSS shows one
 * (the hidden one is display: none, so screen readers meet it once).
 */
export function StackedTable<K extends string>({
  caption,
  columns,
  rows,
  rowHeader,
  captionHidden = false,
  className,
}: {
  /** What the table shows. Required: it names the table for screen readers. */
  caption: ReactNode;
  columns: StackedColumn<K>[];
  rows: Record<K, ReactNode>[];
  /** The column that names each row (default: the first). */
  rowHeader?: K;
  /** Hide the caption visually (when a heading right above says the same). */
  captionHidden?: boolean;
  className?: string;
}) {
  const head = rowHeader ?? columns[0]?.key;
  const rest = columns.filter((c) => c.key !== head);
  return (
    <div className={className}>
      <table className="site-stable-table">
        <caption className={captionHidden ? "sr-only" : undefined}>{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col" data-num={c.numeric || undefined}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {columns.map((c) =>
                c.key === head ? (
                  <th key={c.key} scope="row">
                    {r[c.key]}
                  </th>
                ) : (
                  <td key={c.key} data-num={c.numeric || undefined} data-strong={c.strong || undefined}>
                    {r[c.key]}
                  </td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="site-stable-cards">
        {captionHidden ? null : <p className="site-stable-caption">{caption}</p>}
        <ul className="site-stable-list" aria-label={typeof caption === "string" ? caption : undefined}>
          {rows.map((r, i) => (
            <li key={i} className="site-stable-card">
              {head ? <p className="site-stable-card-title">{r[head]}</p> : null}
              <dl>
                {rest.map((c) => (
                  <div key={c.key}>
                    <dt>{c.label}</dt>
                    <dd data-num={c.numeric || undefined}>{r[c.key]}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export interface TimelineStep {
  title: ReactNode;
  body?: ReactNode;
  /** Short label on the right of the title: "Day 0", "Week 2", "Day 90". */
  meta?: ReactNode;
  /** Marker content (default: the step number). */
  marker?: ReactNode;
  state?: "done" | "now" | "next";
}

/**
 * A vertical sequence. Each marker sits on the first line of its title, a
 * line runs to the next one (in the accent colour once a step is done), and
 * an optional meta label sits on the right in tabular figures.
 */
export function Timeline({
  steps,
  titleAs: Title = "p",
  accent,
  className,
}: {
  steps: TimelineStep[];
  /** Heading level for the step titles when they belong in the outline. */
  titleAs?: "p" | "h3" | "h4";
  /** Colour for done steps, the current ring and the meta labels (default: the surface accent). */
  accent?: string;
  className?: string;
}) {
  return (
    <ol className={cn("site-timeline", className)} style={accent ? siteVars({ "tl-accent": accent }) : undefined}>
      {steps.map((s, i) => (
        <li key={i} className="site-tl-step" data-state={s.state}>
          <span aria-hidden className="site-tl-marker">
            {s.marker ?? i + 1}
          </span>
          <div className="min-w-0">
            <div className="site-tl-head">
              <Title className="site-tl-title">{s.title}</Title>
              {s.meta ? <p className="site-tl-meta">{s.meta}</p> : null}
            </div>
            {s.body ? <div className="site-tl-body">{s.body}</div> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

/**
 * Hero for inner pages: the Delta badge, then an answer-first intro under the
 * H1, and an optional photo (`image`, a name from lib/site-images.ts) behind a
 * scrim. Slides under the glass header. Children go under the intro (CtaLinks):
 * stacked and full width on phones, in a row from 640 px.
 */
export function PageHero({
  eyebrow,
  title,
  intro,
  children,
  image,
}: {
  eyebrow: string;
  title: string;
  intro: ReactNode;
  children?: ReactNode;
  image?: string;
}) {
  return (
    <section data-site-hero className="site-tone-dark relative isolate overflow-clip bg-ecrn-black">
      {image ? (
        <>
          <Parallax from="top" speed={0.2} className="absolute inset-0 -z-20">
            <SiteImage name={image} fill priority sizes="(max-width: 767px) 160vw, 100vw" />
          </Parallax>
          <div aria-hidden className="site-pagehero-scrim -z-10" />
        </>
      ) : (
        <>
          <div aria-hidden className="site-grid-bg -z-10" />
          <div aria-hidden className="site-glow -right-40 -top-56 -z-10 h-[34rem] w-[34rem]" style={siteVars({ "glow-color": "rgba(6, 85, 206, 0.24)" })} />
        </>
      )}
      <Container className="pb-16 pt-[calc(var(--site-header-total)+2rem)] sm:pb-20 sm:pt-[calc(var(--site-header-total)+4rem)] lg:pb-24">
        {/* The badge is glass: it carries its own entrance (a faded wrapper would cut off its blur). */}
        <DeltaBadge href="/about" className="site-enter" />
        <div className="site-enter mt-6" style={siteVars({ i: 1 })}>
          <Eyebrow light>{eyebrow}</Eyebrow>
        </div>
        <h1 className="site-display-2 site-enter mt-3 max-w-4xl" style={siteVars({ i: 2 })}>
          {title}
        </h1>
        <div className="site-lede site-enter mt-4 max-w-2xl text-white/[0.82]" style={siteVars({ i: 3 })}>
          {intro}
        </div>
        {children ? (
          <div className="site-enter mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap" style={siteVars({ i: 4 })}>
            {children}
          </div>
        ) : null}
      </Container>
    </section>
  );
}

/** Breadcrumb trail. Each link is a 44 px target; the chevrons keep them apart. */
export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="font-display text-[14px] leading-snug text-[color:var(--site-fg-2,#506158)]">
      <ol className="-mx-2 flex flex-wrap items-center">
        {items.map((it, i) => (
          <li key={it.path} className="flex min-w-0 items-center">
            {i > 0 ? <ChevronRight aria-hidden className="h-3.5 w-3.5 shrink-0 opacity-60" /> : null}
            {i < items.length - 1 ? (
              <Link href={it.path} className="inline-flex min-h-11 items-center rounded-lg px-2 underline-offset-4 active:opacity-60 [@media(hover:hover)]:hover:underline">
                {it.name}
              </Link>
            ) : (
              <span aria-current="page" className="inline-flex min-h-11 min-w-0 items-center px-2 font-medium text-[color:var(--site-fg,#0F1612)]">
                {it.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * FAQ list as a disclosure list (<details>): the whole question row is the
 * toggle (56 px or taller), a plus on the first line turns into a minus, and
 * every answer stays in the HTML, matched word for word by the FAQPage
 * JSON-LD. Works without JavaScript. `open` picks which answers start open
 * (default: the first, so the pattern explains itself).
 */
export function FaqList({ faqs, open = "first", className }: { faqs: Faq[]; open?: "first" | "none" | "all"; className?: string }) {
  return (
    <div className={cn("site-faq", className)}>
      {faqs.map((f, i) => (
        <details key={f.q} className="site-faq-item" open={open === "all" || (open === "first" && i === 0) || undefined}>
          <summary className="site-faq-q">
            <h3 className="site-display-5 text-[color:var(--site-fg,#0F1612)]">{f.q}</h3>
            <span aria-hidden className="site-faq-icon" />
          </summary>
          <p className="site-faq-a text-[16px] leading-[1.6] text-[color:var(--site-fg-2,#506158)]">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

/**
 * Closing call to action: a dark island with a photo. Every prop is optional;
 * the defaults are the site-wide close. Buttons are full width on phones and
 * Delta's badge closes the panel.
 */
export function FinalCta({
  image = "tower-crane-skyline",
  eyebrow = "#BuiltForLeaders · #BuiltOnTrust",
  title = "Your network has value. Start getting paid for it.",
  body = "ECRN is the structured referral network built for electrical construction. Free to join.",
  primary = { href: "/signup", label: "Sign up free" },
  secondary = { href: "/jobs", label: "Browse open jobs" },
}: {
  /** Image name from lib/site-images.ts. */
  image?: string;
  eyebrow?: string;
  title?: string;
  body?: ReactNode;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string } | null;
} = {}) {
  return (
    <section className="site-tone-light bg-ecrn-paper px-2 sm:px-3">
      <div className="site-frame site-tone-dark site-island rounded-[28px] sm:rounded-[40px]">
        <Parallax cover>
          <SiteImage name={image} fill sizes="100vw" />
        </Parallax>
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(90%_100%_at_50%_45%,rgba(10,16,12,0.74)_0%,rgba(10,16,12,0.88)_62%,rgba(10,16,12,0.96)_100%)]" />
        <Container className="relative py-16 text-center sm:py-24 lg:py-32">
          <Reveal>
            <Eyebrow light>{eyebrow}</Eyebrow>
            <h2 className="site-display-3 mx-auto mt-3 max-w-3xl">{title}</h2>
            <p className="site-lede mx-auto mt-4 max-w-xl text-white/[0.82]">{body}</p>
            <div className="mx-auto mt-8 flex max-w-md flex-col justify-center gap-3 sm:max-w-none sm:flex-row">
              <CtaLink href={primary.href}>
                {primary.label} <ArrowRight aria-hidden className="h-4 w-4" />
              </CtaLink>
              {secondary ? (
                <CtaLink href={secondary.href} variant="ghost">
                  {secondary.label}
                </CtaLink>
              ) : null}
            </div>
          </Reveal>
          {/* Outside the Reveal: the badge is glass, and a fading wrapper would cut off its blur. */}
          <div className="mt-10 flex justify-center">
            <DeltaBadge href="/about" />
          </div>
        </Container>
      </div>
    </section>
  );
}
