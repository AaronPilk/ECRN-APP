import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

export const SUPPORT_EMAIL = "aaron@skyway.media";
export const LEGAL_UPDATED = "October 2, 2026";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ecrn-mist">
      <header className="px-5 sm:px-8 py-5 pt-safe-plus flex items-center justify-between max-w-3xl mx-auto">
        <Link href="/">
          <Logo />
        </Link>
        <Link href="/start" className="text-sm text-slate-500 hover:text-ecrn-ink">
          Open ECRN →
        </Link>
      </header>
      <main className="max-w-3xl mx-auto px-5 sm:px-8 pb-16">
        <h1 className="text-3xl font-bold tracking-tight text-ecrn-ink">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">Last updated {LEGAL_UPDATED}</p>
        <article className="mt-8 space-y-6 text-[15px] leading-relaxed text-slate-700 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-ecrn-ink [&_h2]:mt-8 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-emerald-700 [&_a]:underline">
          {children}
        </article>
        <footer className="mt-12 pt-6 border-t border-slate-200 text-sm text-slate-500 flex flex-wrap gap-4">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/support">Support</Link>
          <span>ECRN · A Delta Construction Partners initiative</span>
        </footer>
      </main>
    </div>
  );
}
