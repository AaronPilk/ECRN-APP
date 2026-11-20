export const SUPPORT_EMAIL = "aaron@skyway.media";
export const LEGAL_UPDATED = "November 20, 2026";

/** Legal/support content wrapper. The site header and footer come from the (site) layout. */
export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
      <h1 className="font-display text-[38px] leading-tight font-semibold tracking-[-0.03em] text-ecrn-ink">{title}</h1>
      <p className="mt-2 text-sm text-ecrn-secondary">Last updated {LEGAL_UPDATED}</p>
      <article className="mt-8 space-y-6 text-[16px] leading-relaxed text-ecrn-secondary [&_h2]:font-display [&_h2]:text-[22px] [&_h2]:font-semibold [&_h2]:text-ecrn-ink [&_h2]:mt-10 [&_h3]:font-semibold [&_h3]:text-ecrn-ink [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_a]:text-ecrn-green-text [&_a]:underline [&_strong]:text-ecrn-ink">
        {children}
      </article>
    </div>
  );
}
