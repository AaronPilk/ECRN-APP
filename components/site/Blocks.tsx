import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Faq } from "@/lib/site";

export function Container({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("max-w-6xl mx-auto px-5 sm:px-8", className)}>{children}</div>;
}

export function Eyebrow({ children, light }: { children: ReactNode; light?: boolean }) {
  return <p className={cn("font-mono text-[12px] uppercase tracking-[0.16em]", light ? "text-[#91F9B3]" : "text-ecrn-green-text")}>{children}</p>;
}

export function CtaLink({ href, children, variant = "primary", className }: { href: string; children: ReactNode; variant?: "primary" | "ghost" | "dark"; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 h-[50px] px-6 rounded-[15px] text-[16px] font-semibold transition",
        variant === "primary" && "bg-gradient-to-b from-ecrn-action-bright to-ecrn-green text-ecrn-action-ink border border-[#13B66B] shadow-action hover:brightness-105",
        variant === "ghost" && "border border-white/30 text-white hover:bg-white/10",
        variant === "dark" && "bg-ecrn-black text-white hover:bg-ecrn-ink",
        className
      )}
    >
      {children}
    </Link>
  );
}

/** Page hero for inner pages: answer-first intro under the H1. */
export function PageHero({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: ReactNode; children?: ReactNode }) {
  return (
    <section className="bg-ecrn-black text-white">
      <Container className="py-14 sm:py-20">
        <Eyebrow light>{eyebrow}</Eyebrow>
        <h1 className="mt-3 font-display text-[40px] sm:text-[56px] leading-[1.04] font-semibold tracking-[-0.035em] max-w-3xl">{title}</h1>
        <div className="mt-5 max-w-2xl text-[17px] sm:text-[19px] leading-relaxed text-white/80">{intro}</div>
        {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
      </Container>
    </section>
  );
}

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-[13px] text-ecrn-secondary">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((it, i) => (
          <li key={it.path} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5" />}
            {i < items.length - 1 ? (
              <Link href={it.path} className="hover:text-ecrn-ink">
                {it.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-ecrn-ink">
                {it.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** FAQ list rendered as real on-page content (matched by FAQPage JSON-LD). */
export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="divide-y divide-ecrn-line border-y border-ecrn-line">
      {faqs.map((f) => (
        <details key={f.q} className="group py-5" open>
          <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
            <h3 className="font-display text-[19px] font-semibold text-ecrn-ink">{f.q}</h3>
            <ChevronRight className="w-5 h-5 mt-1 shrink-0 text-ecrn-secondary transition-transform group-open:rotate-90" />
          </summary>
          <p className="mt-2 text-[16px] leading-relaxed text-ecrn-secondary max-w-3xl">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-ecrn-black text-white">
      <div className="absolute inset-0 bg-[url('/brand/jobsite-800.webp')] bg-cover bg-center opacity-20" aria-hidden />
      <Container className="relative py-16 sm:py-24 text-center">
        <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-[#91F9B3]">#BuiltForLeaders · #BuiltOnTrust</p>
        <h2 className="mt-3 font-display text-[34px] sm:text-[48px] leading-[1.05] font-semibold tracking-[-0.03em]">
          Your network has value. Start getting paid for it.
        </h2>
        <p className="mt-4 text-[17px] text-white/75 max-w-xl mx-auto">
          ECRN is the only structured referral network built exclusively for electrical construction. Free to join.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <CtaLink href="/signup">Sign up free</CtaLink>
          <CtaLink href="/jobs" variant="ghost">
            Browse open jobs
          </CtaLink>
        </div>
      </Container>
    </section>
  );
}
