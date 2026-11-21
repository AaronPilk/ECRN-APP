import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
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

/** Delta's mark. Decorative by default: pair it with the name in text. */
export function DeltaMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/delta-mark.png" alt="" width={400} height={319} decoding="async" className={cn("h-5 w-auto shrink-0", className)} />
  );
}

/**
 * "Powered by Delta Construction Partners".
 *
 *   variant="pill"    glass pill for dark heroes (default); a white pill with tone="light"
 *   variant="lockup"  mark plus two short lines, for headers, footers and menus
 *   variant="inline"  mark plus one line of text
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
  /** Lockup only: show just "Delta" below md (the full name stays available to screen readers). */
  compact?: boolean;
  className?: string;
}) {
  const dark = tone === "dark";
  let inner: ReactNode;
  let cls: string;

  if (variant === "lockup") {
    cls = cn("inline-flex min-w-0 items-center gap-2 sm:gap-2.5", className);
    inner = (
      <>
        <DeltaMark className="h-[17px] sm:h-5" />
        <span className="min-w-0 leading-[1.12]">
          <span className={cn("block text-[9.5px] tracking-[0.02em] sm:text-[10.5px]", dark ? "text-white/[0.74]" : "text-ecrn-secondary")}>Powered by</span>
          <span className={cn("block truncate font-display text-[12.5px] font-medium tracking-[-0.005em] sm:text-[13.5px]", dark ? "text-[#C8E0FF]" : "text-cobalt")}>
            Delta
            <span className={compact ? "hidden md:inline" : undefined}> Construction Partners</span>
          </span>
        </span>
      </>
    );
  } else if (variant === "inline") {
    cls = cn("inline-flex items-center gap-2 font-display text-[14px]", dark ? "text-white/80" : "text-ecrn-secondary", className);
    inner = (
      <>
        <DeltaMark className="h-4" />
        <span>
          Powered by <span className={cn("font-medium", dark ? "text-white" : "text-navy")}>{DELTA.name}</span>
        </span>
      </>
    );
  } else {
    cls = cn(
      "inline-flex h-9 max-w-full items-center gap-2 whitespace-nowrap rounded-full pl-2.5 font-display text-[12.5px] min-[380px]:text-[13px]",
      href ? "site-hit pr-2" : "pr-3.5",
      dark ? "site-glass site-glass-thin" : "bg-white text-ecrn-secondary shadow-[0_0_0_1px_rgba(15,22,18,0.08),0_1px_2px_rgba(15,22,18,0.05)]",
      className
    );
    inner = (
      <>
        <DeltaMark className="h-4" />
        <span className={dark ? "text-white/80" : undefined}>
          Powered by <span className={cn("font-medium", dark ? "text-white" : "text-navy")}>{DELTA.name}</span>
        </span>
        {href ? <ChevronRight aria-hidden className={cn("h-3.5 w-3.5", dark ? "text-white/60" : "text-ecrn-secondary")} /> : null}
      </>
    );
  }

  if (!href) return <span className={cls}>{inner}</span>;
  const label = `Powered by ${DELTA.name}`;
  if (/^https?:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener" aria-label={`${label} (opens in a new tab)`} className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} aria-label={label} className={cls}>
      {inner}
    </Link>
  );
}
