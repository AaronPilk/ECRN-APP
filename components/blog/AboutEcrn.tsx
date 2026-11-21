import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DeltaMark } from "@/components/ui/DeltaLockup";
import { AUTHORS, type AuthorKey } from "@/lib/blog/types";
import { BRAND } from "@/lib/site";
import { cn } from "@/lib/utils/cn";

const LINK =
  "inline-flex min-h-[44px] items-center gap-1 text-[15.5px] font-semibold text-ecrn-green-text underline-offset-[3px] " +
  "[@media(hover:hover)_and_(pointer:fine)]:hover:underline";

/**
 * Who is behind the blog: the ECRN team, and Delta Construction Partners
 * behind ECRN. Facts come from lib/site.ts only. Pass `author` on a post to
 * add the "written by" line.
 */
export function AboutEcrn({ author, headingId = "about-ecrn-heading", className }: { author?: AuthorKey; headingId?: string; className?: string }) {
  return (
    <section aria-labelledby={headingId} className={cn("rounded-[22px] border border-ecrn-line bg-ecrn-paper p-6 sm:p-8", className)}>
      <h2 id={headingId} className="font-display text-[22px] font-semibold leading-tight tracking-[-0.02em] text-ecrn-ink">
        About ECRN
      </h2>
      <p className="mt-3 text-[16px] leading-relaxed text-ecrn-secondary">
        {author && (
          <>
            This guide was written by the <span className="font-medium text-ecrn-ink">{AUTHORS[author].name}</span>.{" "}
          </>
        )}
        ECRN, the {BRAND.legalName}, is a free referral network and job board for electrical construction. One account lets you
        apply to open roles and refer people you know.
      </p>

      <div className="mt-5 flex items-start gap-3.5 rounded-[16px] border border-[#C9DEFA] bg-white px-4 py-4 sm:px-5">
        {/* The name is in the text beside it, so the mark is decorative here. */}
        <span aria-hidden className="mt-1 shrink-0">
          <DeltaMark className="h-6" />
        </span>
        <p className="text-[15.5px] leading-relaxed text-ecrn-secondary">
          <span className="block font-display text-[16px] font-semibold text-navy">Powered by Delta Construction Partners</span>
          ECRN is an initiative of{" "}
          <a
            href={BRAND.parent.url}
            rel="noopener"
            className="py-[13px] font-medium text-cobalt underline decoration-cobalt/30 underline-offset-[3px] [@media(hover:hover)_and_(pointer:fine)]:hover:decoration-cobalt"
          >
            Delta Construction Partners
          </a>
          , a construction recruiting firm that has been recruiting since {BRAND.parent.foundingDate} and has 30+ recruiters.
        </p>
      </div>

      <p className="mt-4 flex flex-wrap gap-x-6">
        <Link href="/about" className={LINK}>
          Who is behind ECRN <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <Link href="/how-it-works" className={LINK}>
          How ECRN works <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </p>
    </section>
  );
}
