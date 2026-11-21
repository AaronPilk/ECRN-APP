import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { CoBrandLockup, DELTA } from "@/components/site/Blocks";
import { AUTHORS, type AuthorKey } from "@/lib/blog/types";
import { BRAND } from "@/lib/site";
import { cn } from "@/lib/utils/cn";

const LINK =
  "inline-flex min-h-[44px] items-center gap-1.5 font-display text-[15.5px] font-semibold tracking-[-0.01em] text-[#91F9B3] " +
  "transition-opacity duration-150 active:opacity-70 [@media(hover:hover)_and_(pointer:fine)]:hover:underline underline-offset-[3px]";

/** Delta's colour as a faint light from the top right. */
const LIGHT = { backgroundImage: "radial-gradient(30rem 20rem at 112% -24%, rgba(6,85,206,0.42), transparent 70%)" };

/**
 * Who is behind the blog: the ECRN team, and Delta Construction Partners
 * behind ECRN, with the site's ECRN and Delta lockup (CoBrandLockup) on top,
 * at the header size, which fits one row at 360 px. This is the one Delta statement on
 * a post (recruiting since 2008, 30+ recruiters, national contractor
 * relationships, a link to Delta's site). Facts come from lib/site.ts and
 * components/site/Delta.tsx only. Pass `author` on a post to add the
 * "written by" line.
 */
export function AboutEcrn({ author, headingId = "about-ecrn-heading", className }: { author?: AuthorKey; headingId?: string; className?: string }) {
  return (
    <section
      aria-labelledby={headingId}
      className={cn("site-tone-dark relative isolate overflow-clip rounded-[22px] bg-ecrn-black px-5 pb-3 pt-6 text-white sm:rounded-[26px] sm:px-8 sm:pb-4 sm:pt-8", className)}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10" style={LIGHT} />

      <CoBrandLockup tone="dark" size="header" />

      <h2 id={headingId} className="mt-6 font-display text-[22px] font-semibold leading-tight tracking-[-0.02em] sm:mt-7">
        About ECRN
      </h2>
      <p className="mt-2.5 text-pretty text-[16px] leading-[1.6] text-white/80">
        {author && (
          <>
            This guide was written by the <span className="font-medium text-white">{AUTHORS[author].name}</span>.{" "}
          </>
        )}
        ECRN, the {BRAND.legalName}, is a free referral network and job board for electrical construction. One account lets you
        apply to open roles and refer people you know.
      </p>
      <p className="mt-3 text-pretty text-[16px] leading-[1.6] text-white/80">
        ECRN is an initiative of{" "}
        <a
          href={DELTA.url}
          target="_blank"
          rel="noopener"
          className="py-[11px] font-medium text-white underline decoration-white/35 underline-offset-[3px] [@media(hover:hover)_and_(pointer:fine)]:hover:decoration-white"
        >
          {DELTA.name}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        , a construction recruiting firm recruiting since {DELTA.since}, with {DELTA.recruiters} recruiters and national contractor
        relationships. Delta&apos;s recruiters do the recruiting behind ECRN.
      </p>

      <div className="mt-5 flex flex-col border-t border-white/10 pt-2 sm:flex-row sm:flex-wrap sm:gap-x-7">
        <Link href="/about" className={LINK}>
          Who is behind ECRN <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        </Link>
        <Link href="/how-it-works" className={LINK}>
          How ECRN works <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
        </Link>
        <a href={DELTA.url} target="_blank" rel="noopener" className={LINK}>
          {DELTA.domain}
          <span className="sr-only"> (opens in a new tab)</span>
          <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
        </a>
      </div>
    </section>
  );
}
