import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Who powers ECRN. Mirrors BRAND.parent in lib/site.ts (kept as plain
 * constants here so the client-side menu does not pull lib/site into its
 * bundle). These are the only Delta facts the site may state.
 */
export const DELTA = {
  name: "Delta Construction Partners",
  url: "https://deltaconstructionpartners.com",
  domain: "deltaconstructionpartners.com",
  since: "2008",
  recruiters: "30+",
} as const;

/* ─────────────────────────────────────────────────────────────────────────────
   The ECRN × Delta Construction Partners lockup.

   We do not have Delta's logo file, so Delta is shown as its mark
   (/brand/delta-mark.png, the only Delta artwork we have) beside a typeset
   name: "DELTA" large and bold, "CONSTRUCTION PARTNERS" small and tracked.
   Nothing is drawn or traced. Swap in the official file when the owner
   supplies it (DeltaLogo is the one place to change).

   Exports
     CoBrandLockup  ECRN logo | Delta mark + name. size "header" | "app" | "lg" | px,
                    tone "dark" | "light" (the surface it sits on), layout "row" | "stack" | "auto"
     DeltaLogo      Delta mark + name on its own
     DeltaWordmark  the typeset name on its own
     EcrnLogo       the ECRN artwork, white type (dark tone) or ink type (light tone)
     DeltaBadge     compact "An initiative of / Delta Construction Partners" chip for heroes and CTAs
     DeltaMark      the mark image (decorative)
     PoweredByDelta the pass-1 API, now rendering the pieces above

   Geometry. Every size is one number: the font-size of the lockup's root,
   which is the height of the Delta mark. Everything else is in em of it, so
   the proportions below hold at every size.
     - Both triangles share one height and one centre line. The ECRN artwork
       (1920 × 482) has its triangle on rows 3 to 478, so the artwork is set
       482 / 476 em tall and pulled up and down by 0.0063 em.
     - The cap tops of "ECRN" (artwork row 83) and "DELTA" share one line,
       0.1681 em below the top of the triangles.
     - The baseline of "CONSTRUCTION PARTNERS" sits on the triangles' base.
     - Geist: cap height 0.71 em; at line-height 1 the caps sit 0.145 em
       inside either edge of the line box. The paddings and the negative
       margins below come from those two numbers.
     - "DELTA" is nudged 0.028 em left so the round C below overshoots the
       straight D stem by a hair (the usual optical alignment), and the
       trailing letter-spacing of each line is taken back on the right.
   ──────────────────────────────────────────────────────────────────────────── */

/** Official ECRN artwork (supplied by Aaron), trimmed and resized: white type and ink type. */
const ECRN_SRC = "/brand/ecrn-logo-white.webp";
const ECRN_INK_SRC = "/brand/ecrn-logo-ink.webp";
const MARK_SRC = "/brand/delta-mark.png";

/** The surface the artwork sits on: "dark" sets white type, "light" sets ink, navy and cobalt. */
export type BrandTone = "dark" | "light";

/** Height of the Delta mark: a preset or a number of px. Every other dimension follows from it. */
export type LockupSize = "header" | "app" | "lg" | "badge" | number;

const SIZES: Record<Exclude<LockupSize, number>, string> = {
  /** Site header and menu: 19 px on a 320 px phone, 22 at 360, 23.5 at 390, 24 from 400 up. */
  header: "clamp(1.1875rem, 5vw + 0.25rem, 1.5rem)",
  /** Member app top bar (beside a 36 px avatar): 20 at 360, 21.5 at 390, 22 from 400 up. */
  app: "clamp(1.125rem, 5vw + 0.125rem, 1.375rem)",
  /** Footer and other large placements: 30 on phones, 36 on desktop. */
  lg: "clamp(1.875rem, 2.4vw + 1.2rem, 2.25rem)",
  badge: "1.625rem",
};

const fontSize = (size: LockupSize) => (typeof size === "number" ? `${size}px` : SIZES[size]);

const G = {
  ecrnH: 482 / 476,
  ecrnShift: -0.0063,
  ecrnPadL: 0.0168,
  dividerBefore: 0.42,
  dividerAfter: 0.4,
  markW: 400 / 319,
  textGap: 0.32,
  s1: 0.66,
  s2: 0.35,
  t1: 0.08,
  t2: 0.13,
  padTop: 0.0724,
  pullUp: -0.0317,
  trimBottom: -0.0508,
  nudge: -0.028,
  stackGap: 0.62,
} as const;

const INK = "#0F1612";
const COLORS: Record<BrandTone, { name: string; line2: string; divider: string }> = {
  dark: { name: "#FFFFFF", line2: "#A9CEFF", divider: "rgba(255, 255, 255, 0.2)" },
  light: { name: "#00244B", line2: "#0655CE", divider: "rgba(15, 22, 18, 0.16)" },
};

const isExternal = (href: string) => /^https?:\/\//.test(href);

/**
 * A link that keeps the artwork's layout: inline, no padding, with a 44 px
 * tall invisible hit area centred on it. Tailwind only (no site.css), so the
 * member app can use it too.
 */
function ArtLink({ href, label, className, children }: { href: string; label: string; className?: string; children: ReactNode }) {
  const cls = cn(
    "relative flex shrink-0 rounded-[0.2em] after:absolute after:inset-x-[-0.2em] after:top-1/2 after:h-11 after:min-h-full after:-translate-y-1/2 after:content-[''] active:opacity-70",
    className
  );
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener" aria-label={`${label} (opens in a new tab)`} className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} aria-label={label} className={cls}>
      {children}
    </Link>
  );
}

/** Delta's mark. Decorative by default: pair it with the name in text. */
export function DeltaMark({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={MARK_SRC} alt="" width={400} height={319} decoding="async" className={cn("h-5 w-auto shrink-0", className)} style={style} />
  );
}

/**
 * The ECRN artwork. tone="dark" is the white-type file as supplied. tone="light"
 * keeps the green triangle and repaints the type in ink through the file's
 * own alpha (a CSS mask), so no second file is needed.
 * Size it with a height (class or style); the width follows.
 */
export function EcrnLogo({ tone = "dark", alt = "ECRN", className, style }: { tone?: BrandTone; alt?: string; className?: string; style?: CSSProperties }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={tone === "dark" ? ECRN_SRC : ECRN_INK_SRC}
      alt={alt}
      width={800}
      height={203}
      decoding="async"
      className={cn("block h-[26px] w-auto shrink-0", className)}
      style={style}
    />
  );
}

/**
 * "DELTA / CONSTRUCTION PARTNERS", typeset. Sized in em of its parent's
 * font-size (the mark height), so place it inside a DeltaLogo or give it a
 * font-size. The text is real text in natural case (screen readers read
 * words, not letters).
 */
export function DeltaWordmark({ tone = "dark", className, style }: { tone?: BrandTone; className?: string; style?: CSSProperties }) {
  const c = COLORS[tone];
  return (
    <span
      className={cn("flex shrink-0 flex-col items-start whitespace-nowrap font-display uppercase", className)}
      style={{ paddingTop: `${G.padTop}em`, marginBottom: `${G.trimBottom}em`, ...style }}
    >
      <span
        className="block"
        style={{ fontSize: `${G.s1}em`, lineHeight: 1, fontWeight: 700, letterSpacing: `${G.t1}em`, marginLeft: `${G.nudge / G.s1}em`, marginRight: `-${G.t1}em`, color: c.name }}
      >
        Delta
      </span>
      <span className="block" style={{ marginTop: `${G.pullUp}em` }}>
        <span className="block" style={{ fontSize: `${G.s2}em`, lineHeight: 1, fontWeight: 600, letterSpacing: `${G.t2}em`, marginRight: `-${G.t2}em`, color: c.line2 }}>
          Construction Partners
        </span>
      </span>
    </span>
  );
}

/** Delta's half of the lockup: the mark and the typeset name. */
export function DeltaLogo({
  tone = "dark",
  size = "header",
  href,
  label = DELTA.name,
  className,
  style,
}: {
  tone?: BrandTone;
  size?: LockupSize;
  /** Makes it a link (external URLs open in a new tab). */
  href?: string;
  /** Accessible name when it is a link. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const art = (
    <span className="flex shrink-0 items-start leading-none">
      <DeltaMark className="block" style={{ height: "1em", width: `${G.markW}em` }} />
      <DeltaWordmark tone={tone} style={{ marginLeft: `${G.textGap}em` }} />
    </span>
  );
  const outer = { fontSize: fontSize(size), ...style };
  if (!href) {
    return (
      <span role="img" aria-label={label} className={cn("inline-flex shrink-0", className)} style={outer}>
        {art}
      </span>
    );
  }
  return (
    <span className={cn("inline-flex shrink-0", className)} style={outer}>
      <ArtLink href={href} label={label}>
        {art}
      </ArtLink>
    </span>
  );
}

/**
 * ECRN logo | Delta mark + name. One component for the site header, the menu,
 * the footer and the member app.
 *
 *   <CoBrandLockup ecrnHref="/" deltaHref="/about" />                     header (default size)
 *   <CoBrandLockup size="lg" layout="auto" deltaHref={DELTA.url} />        footer: stacked on phones, a row from 480 px
 *   <CoBrandLockup className="xl:!text-[1.75rem]" />                       a different size at a breakpoint (beats the inline size)
 *   <CoBrandLockup size="app" tone="light" />                              member app top bar
 *
 * layout: "row" (default), "stack" (ECRN above Delta, left edges aligned),
 * "auto" (stack below 480 px, row above).
 * Widths of the row: about 12.14 em (267 px at the 22 px header size).
 */
export function CoBrandLockup({
  tone = "dark",
  size = "header",
  layout = "row",
  ecrnHref,
  deltaHref,
  ecrnLabel = "ECRN home",
  deltaLabel = `${DELTA.name}: about ECRN`,
  className,
  style,
}: {
  tone?: BrandTone;
  size?: LockupSize;
  layout?: "row" | "stack" | "auto";
  /** Link for the ECRN half (usually "/"). */
  ecrnHref?: string;
  /** Link for the Delta half ("/about" in the header, Delta's site in the footer). */
  deltaHref?: string;
  ecrnLabel?: string;
  deltaLabel?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const c = COLORS[tone];
  const linked = Boolean(ecrnHref || deltaHref);
  const stack = layout === "stack";
  const auto = layout === "auto";

  const ecrn = (
    <EcrnLogo
      tone={tone}
      className={cn(stack && "ml-[-0.0168em]", auto && "max-[479px]:ml-[-0.0168em]")}
      style={{ height: `${G.ecrnH}em`, marginTop: `${G.ecrnShift}em`, marginBottom: `${G.ecrnShift}em` }}
    />
  );
  const delta = (
    <span className="flex shrink-0 items-start">
      <DeltaMark className="block" style={{ height: "1em", width: `${G.markW}em` }} />
      <DeltaWordmark tone={tone} style={{ marginLeft: `${G.textGap}em` }} />
    </span>
  );

  return (
    <span
      role={linked ? undefined : "img"}
      aria-label={linked ? undefined : `ECRN, an initiative of ${DELTA.name}`}
      className={cn(
        "flex w-max shrink-0 leading-none",
        stack ? "flex-col items-start" : auto ? "flex-col items-start min-[480px]:flex-row" : "flex-row items-start",
        className
      )}
      style={{ fontSize: fontSize(size), ...style }}
    >
      {ecrnHref ? (
        <ArtLink href={ecrnHref} label={ecrnLabel}>
          {ecrn}
        </ArtLink>
      ) : (
        ecrn
      )}
      <span
        aria-hidden
        className={cn("block w-px shrink-0", stack ? "hidden" : auto ? "hidden min-[480px]:block" : null)}
        style={{ height: "0.88em", marginTop: "0.06em", marginLeft: `${G.dividerBefore}em`, marginRight: `${G.dividerAfter}em`, backgroundColor: c.divider }}
      />
      {stack || auto ? <span aria-hidden className={cn("block shrink-0", auto && "min-[480px]:hidden")} style={{ height: `${G.stackGap}em` }} /> : null}
      {deltaHref ? (
        <ArtLink href={deltaHref} label={deltaLabel}>
          {delta}
        </ArtLink>
      ) : linked ? (
        <span role="img" aria-label={DELTA.name} className="flex shrink-0">
          {delta}
        </span>
      ) : (
        delta
      )}
    </span>
  );
}

/**
 * Compact co-brand chip for heroes and calls to action:
 *   [mark]  An initiative of
 *           Delta Construction Partners   ›
 * Glass on dark surfaces and photos, white on light ones. With `href` the
 * whole chip is one 48 px link. Put an entrance class (site-enter) on the
 * chip itself, not on a wrapper (a faded wrapper cuts off backdrop blur).
 */
export function DeltaBadge({
  tone = "dark",
  label = "An initiative of",
  href,
  className,
  style,
}: {
  tone?: BrandTone;
  /** First line. Only "An initiative of" or "Powered by". */
  label?: "An initiative of" | "Powered by";
  href?: string;
  className?: string;
  style?: CSSProperties;
}) {
  const dark = tone === "dark";
  const external = href ? isExternal(href) : false;
  const cls = cn(
    "inline-flex min-h-12 max-w-full items-center gap-3 rounded-2xl py-2 pl-3 text-left font-display",
    href ? "pr-3 transition-opacity duration-150 ease-out active:opacity-75" : "pr-4",
    dark
      ? "bg-white/[0.08] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-md backdrop-saturate-150"
      : "bg-white text-ecrn-ink shadow-[0_0_0_1px_rgba(15,22,18,0.08),0_1px_2px_rgba(15,22,18,0.05),0_8px_20px_-12px_rgba(15,22,18,0.18)]",
    className
  );
  const inner = (
    <>
      <DeltaMark className="h-[22px]" />
      <span className="min-w-0 leading-tight">
        <span className={cn("block text-[13px] font-medium", dark ? "text-white/70" : "text-ecrn-secondary")}>{label}</span>
        <span className={cn("mt-px block text-[14.5px] font-semibold tracking-[-0.01em]", dark ? "text-white" : "text-navy")}>{DELTA.name}</span>
      </span>
      {href ? (
        external ? (
          <ArrowUpRight aria-hidden className={cn("ml-1 h-4 w-4 shrink-0", dark ? "text-white/60" : "text-ecrn-secondary")} />
        ) : (
          <ChevronRight aria-hidden className={cn("ml-0.5 h-4 w-4 shrink-0", dark ? "text-white/60" : "text-ecrn-secondary")} />
        )
      ) : null}
    </>
  );
  if (!href) {
    return (
      <span className={cls} style={style}>
        {inner}
      </span>
    );
  }
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener" className={cls} style={style}>
        {inner}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={href} className={cls} style={style}>
      {inner}
    </Link>
  );
}

/**
 * "Powered by Delta Construction Partners" (pass-1 API, kept working).
 *
 *   variant="pill"    the DeltaBadge with "Powered by" (default)
 *   variant="lockup"  the Delta mark and typeset name (DeltaLogo); `compact` makes it header-small
 *   variant="inline"  mark plus one line of text, for running copy
 *
 * Pass `href` to make it a link (internal paths use next/link).
 */
export function PoweredByDelta({
  variant = "pill",
  tone = "dark",
  href,
  compact = false,
  className,
}: {
  variant?: "pill" | "lockup" | "inline";
  tone?: "dark" | "light";
  href?: string;
  /** Lockup only: the smaller (header) size. */
  compact?: boolean;
  className?: string;
}) {
  if (variant === "pill") return <DeltaBadge tone={tone} label="Powered by" href={href} className={className} />;

  if (variant === "lockup") {
    return <DeltaLogo tone={tone} size={compact ? "header" : 26} href={href} label={`Powered by ${DELTA.name}`} className={className} />;
  }

  const dark = tone === "dark";
  const cls = cn("inline-flex items-center gap-2 font-display text-[14px] leading-snug", dark ? "text-white/80" : "text-ecrn-secondary", className);
  const inner = (
    <>
      <DeltaMark className="h-4" />
      <span>
        Powered by <span className={cn("font-medium", dark ? "text-white" : "text-navy")}>{DELTA.name}</span>
      </span>
    </>
  );
  if (!href) return <span className={cls}>{inner}</span>;
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noopener" className={cn(cls, "min-h-11")}>
        {inner}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link href={href} className={cn(cls, "min-h-11")}>
      {inner}
    </Link>
  );
}
