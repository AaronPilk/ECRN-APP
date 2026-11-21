import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export interface TocItem {
  /** The id on the section's <h2>. */
  id: string;
  /** Navigation label (may be shorter than the heading). */
  label: string;
}

/**
 * A legal document for reading on a phone: 17 px body at about 68
 * characters a line, clear heading levels, and a table of contents that is a
 * one-line disclosure on phones and a sticky list beside the text on desktop.
 * The wording itself comes from the page, untouched.
 */
export function LegalDoc({ toc, children }: { toc: TocItem[]; children: ReactNode }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-16">
      <nav aria-label="On this page" className="lg:sticky lg:top-[calc(var(--site-header-total)+2rem)] lg:self-start">
        <details className="rounded-[18px] bg-white shadow-[inset_0_0_0_1px_#D9DFD8] lg:hidden">
          <summary className="inner-toc-summary">
            <span>
              On this page
              <span className="ml-2 font-medium tabular-nums text-ecrn-secondary">{toc.length} sections</span>
            </span>
            <ChevronDown aria-hidden className="h-5 w-5 text-ecrn-secondary" />
          </summary>
          <ol className="border-t border-ecrn-line px-[1.125rem] pb-2 pt-1">
            {toc.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className="inner-toc-link">
                  {t.label}
                </a>
              </li>
            ))}
          </ol>
        </details>

        <div className="hidden lg:block">
          <p className="font-display text-[13px] font-semibold tracking-[0.01em] text-ecrn-secondary">On this page</p>
          <ol className="mt-3 border-l border-ecrn-line">
            {toc.map((t) => (
              <li key={t.id}>
                <a href={`#${t.id}`} className="inner-toc-link -ml-px border-l border-transparent pl-4">
                  {t.label}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </nav>

      <article className="inner-legal min-w-0">{children}</article>
    </div>
  );
}
