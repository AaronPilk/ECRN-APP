import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowRight, ArrowUpRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Faq } from "@/lib/site";
import { DELTA, DeltaMark, PoweredByDelta } from "./Delta";
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
 * so Eyebrow, SectionHeading, ArrowLink and FaqList work on either.
 */

export { DELTA, DeltaMark, PoweredByDelta } from "./Delta";

export type SiteTone = "paper" | "white" | "dark";

const TONE: Record<SiteTone, string> = {
  paper: "site-tone-light bg-ecrn-paper",
  white: "site-tone-light bg-white",
  dark: "site-tone-dark bg-ecrn-black",
};

const isExternal = (href: string) => /^https?:\/\//.test(href);

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-[1200px] px-5 sm:px-8", className)}>{children}</div>;
}

/** Small mono label above a heading. Follows the surface tone; `light` forces the on-dark colour. */
export function Eyebrow({ children, light, className }: { children: ReactNode; light?: boolean; className?: string }) {
  return <p className={cn("site-eyebrow", light ? "text-[#91F9B3]" : "text-[color:var(--site-accent,#07653E)]", className)}>{children}</p>;
}

/**
 * Button-shaped link. primary = green (the one main action), ghost = glass for
 * dark surfaces and photos, dark / light = solid for light surfaces.
 * External URLs open in a new tab.
 */
export function CtaLink({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghost" | "dark" | "light";
  className?: string;
}) {
  const cls = cn("site-btn inline-flex", `site-btn-${variant}`, className);
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

/** Text link with an arrow that nudges on hover. Colour follows the surface tone. */
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
 *          (give the band above about 2.5rem of extra bottom padding)
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
    <section id={id} className={cn("relative py-20 sm:py-24 lg:py-32", TONE[tone], sheet && "z-[1] -mt-7 rounded-t-[28px] sm:-mt-10 sm:rounded-t-[40px]", className)}>
      {bare ? children : <Container className={containerClassName}>{children}</Container>}
    </section>
  );
}

/**
 * A dark panel with rounded corners that floats in a light page, a few pixels
 * in from the screen edge. Clips with overflow-clip, so sticky and
 * scroll-linked children keep working.
 */
export function Island({ children, id, className, innerClassName }: { children: ReactNode; id?: string; className?: string; innerClassName?: string }) {
  return (
    <section id={id} className={cn("site-tone-light bg-ecrn-paper px-2 sm:px-3", className)}>
      <div className={cn("site-tone-dark relative isolate overflow-clip rounded-[28px] bg-ecrn-black sm:rounded-[40px]", innerClassName)}>{children}</div>
    </section>
  );
}

/** Eyebrow, heading and intro for a section. `as` picks the heading level (default h2). */
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
      <Tag className={cn("site-display-3", eyebrow ? "mt-4" : null)}>{title}</Tag>
      {intro ? <div className={cn("site-lede mt-5 max-w-2xl text-[color:var(--site-fg-2,#506158)]", align === "center" && "mx-auto")}>{intro}</div> : null}
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
    <div className={cn("site-frame site-tone-dark site-zoom-host flex rounded-[28px]", className)} style={accent ? siteVars({ accent }) : undefined}>
      <Parallax cover>
        <SiteImage name={image} fill sizes={sizes} className="site-zoom" />
      </Parallax>
      <div aria-hidden className={tint === "navy" ? "site-scrim-navy" : tint === "green" ? "site-scrim-green" : "site-scrim"} />
      <div className={cn("relative flex w-full flex-col justify-end p-6 sm:p-8", contentClassName)}>{children}</div>
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
    <section id={id} className={cn("relative py-16 sm:py-20 lg:py-24", TONE[tone], className)}>
      <Container>
        <div className="site-delta-panel grid rounded-[28px] sm:rounded-[36px] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <Reveal className="min-w-0 p-6 sm:p-10 lg:p-14">
            <p className="site-eyebrow flex items-center gap-2.5 text-[color:var(--site-accent)]">
              <DeltaMark className="h-4" />
              Who is behind ECRN
            </p>
            <h2 className="site-display-3 mt-5">{title}</h2>
            <p className="site-lede mt-5 max-w-xl text-[color:var(--site-fg-2)]">
              {DELTA.name} is a construction recruiting firm, recruiting since {DELTA.since}. Its {DELTA.recruiters} recruiters and national contractor
              relationships are what turn a referral into a hire: they handle the vetting, the interviews and the follow-up.
            </p>
            <dl className="mt-8 grid gap-x-6 border-t border-[color:var(--site-rule)] sm:grid-cols-3">
              {stats.map(([value, label]) => (
                <div key={label} className="flex flex-row-reverse items-baseline justify-end gap-4 border-b border-[color:var(--site-rule)] py-4 sm:flex-col-reverse sm:items-start sm:gap-2.5 sm:border-b-0 sm:pb-0 sm:pt-6">
                  <dt className="text-[14.5px] leading-snug text-[color:var(--site-fg-2)]">{label}</dt>
                  <dd className="site-num w-[7.25rem] shrink-0 text-[28px] font-semibold leading-none text-[color:var(--site-accent)] sm:w-auto sm:text-[34px]">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-2">
              <CtaLink href={DELTA.url} variant="light">
                <span>
                  Visit <span className="sm:hidden">Delta&apos;s website</span>
                  <span className="hidden sm:inline">{DELTA.name}</span>
                </span>
                <ArrowUpRight aria-hidden className="h-4 w-4" />
              </CtaLink>
              <ArrowLink href="/about">About ECRN</ArrowLink>
            </div>
          </Reveal>
          <div className="site-frame min-h-[280px] lg:min-h-0">
            <Parallax cover>
              <SiteImage name={image} fill sizes="(min-width: 1024px) 560px, 100vw" />
            </Parallax>
            <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-[#00244B]/85 via-[#00244B]/10 to-[#00183A]/75 lg:bg-gradient-to-r lg:from-[#052A5C] lg:via-[#00244B]/25 lg:to-transparent" />
            <Parallax speed={-0.05} className="absolute bottom-5 left-5 right-5 sm:bottom-7 sm:left-auto sm:right-7">
              <GlassCard weight="thin" className="flex items-center gap-3 rounded-[18px] px-4 py-3.5">
                <DeltaMark className="h-6" />
                <span className="leading-tight">
                  <span className="block font-display text-[15px] font-semibold tracking-[-0.01em]">{DELTA.name}</span>
                  <span className="mt-0.5 block text-[13px] text-white/80">Construction recruiting since {DELTA.since}</span>
                </span>
              </GlassCard>
            </Parallax>
          </div>
        </div>
      </Container>
    </section>
  );
}

/**
 * Hero for inner pages: answer-first intro under the H1, the Delta badge above
 * it, and an optional photo (`image`, a name from lib/site-images.ts) behind a
 * scrim. Slides under the glass header. Children go in a row under the intro
 * (CtaLinks).
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
          <div aria-hidden className="site-glow -right-32 -top-48 -z-10 h-[36rem] w-[36rem]" style={siteVars({ "glow-color": "rgba(6, 85, 206, 0.26)" })} />
          <div aria-hidden className="site-glow -bottom-64 -left-40 -z-10 h-[32rem] w-[32rem]" style={siteVars({ "glow-color": "rgba(22, 193, 114, 0.14)" })} />
        </>
      )}
      <Container className="pb-16 pt-[calc(var(--site-header-total)+2.75rem)] sm:pb-20 sm:pt-[calc(var(--site-header-total)+4.5rem)] lg:pb-24">
        {/* The pill is glass: it carries its own entrance (a faded wrapper would cut off its blur). */}
        <PoweredByDelta href="/about" className="site-enter" />
        <div className="site-enter mt-7" style={siteVars({ i: 1 })}>
          <Eyebrow light>{eyebrow}</Eyebrow>
        </div>
        <h1 className="site-display-2 site-enter mt-4 max-w-4xl" style={siteVars({ i: 2 })}>
          {title}
        </h1>
        <div className="site-lede site-enter mt-6 max-w-2xl text-white/[0.82]" style={siteVars({ i: 3 })}>
          {intro}
        </div>
        {children ? (
          <div className="site-enter mt-9 flex flex-wrap gap-3" style={siteVars({ i: 4 })}>
            {children}
          </div>
        ) : null}
      </Container>
    </section>
  );
}

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="font-display text-[13.5px] text-[color:var(--site-fg-2,#506158)]">
      <ol className="flex flex-wrap items-center gap-x-1">
        {items.map((it, i) => (
          <li key={it.path} className="flex items-center gap-1">
            {i > 0 ? <ChevronRight aria-hidden className="h-3.5 w-3.5 opacity-60" /> : null}
            {i < items.length - 1 ? (
              <Link href={it.path} className="inline-flex min-h-[32px] items-center underline-offset-4 hover:underline">
                {it.name}
              </Link>
            ) : (
              <span aria-current="page" className="font-medium text-[color:var(--site-fg,#0F1612)]">
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
 * FAQ list rendered as real on-page content (matched word for word by
 * FAQPage JSON-LD). Always open: every answer is visible. Question left and
 * answer right when the list is wide enough, stacked otherwise.
 */
export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="site-faq">
      {faqs.map((f) => (
        <div key={f.q} className="site-faq-row">
          <h3 className="site-display-5 text-[color:var(--site-fg,#0F1612)]">{f.q}</h3>
          <p className="max-w-[44rem] text-[16.5px] leading-[1.62] text-[color:var(--site-fg-2,#506158)]">{f.a}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Closing call to action: a dark island with a photo. Every prop is optional;
 * the defaults are the site-wide close.
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
      <div className="site-frame site-tone-dark rounded-[28px] sm:rounded-[40px]">
        <Parallax cover>
          <SiteImage name={image} fill sizes="100vw" />
        </Parallax>
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(90%_100%_at_50%_45%,rgba(10,16,12,0.74)_0%,rgba(10,16,12,0.88)_62%,rgba(10,16,12,0.96)_100%)]" />
        <Container className="relative py-20 text-center sm:py-28 lg:py-36">
          <Reveal>
            <Eyebrow light>{eyebrow}</Eyebrow>
            <h2 className="site-display-3 mx-auto mt-5 max-w-3xl">{title}</h2>
            <p className="site-lede mx-auto mt-5 max-w-xl text-white/[0.82]">{body}</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <CtaLink href={primary.href}>
                {primary.label} <ArrowRight aria-hidden className="h-4 w-4" />
              </CtaLink>
              {secondary ? (
                <CtaLink href={secondary.href} variant="ghost">
                  {secondary.label}
                </CtaLink>
              ) : null}
            </div>
            <div className="mt-10 flex justify-center">
              <PoweredByDelta variant="inline" />
            </div>
          </Reveal>
        </Container>
      </div>
    </section>
  );
}
