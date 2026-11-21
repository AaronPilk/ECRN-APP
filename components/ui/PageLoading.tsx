/** Stream a stable page placeholder while the next screen's data loads. */
export function PageLoading() {
  return (
    <div role="status" aria-live="polite" className="mx-auto max-w-3xl px-[22px] sm:px-6 pt-5 pb-8 space-y-5">
      <span className="sr-only">Loading page…</span>
      <div aria-hidden="true" className="space-y-4">
        <div className="h-3 w-24 rounded bg-ecrn-line/70" />
        <div className="h-10 w-56 max-w-full rounded-lg bg-ecrn-line/70" />
        <div className="h-4 w-64 max-w-full rounded bg-ecrn-line/50" />
        <div className="h-44 rounded-[22px] border border-ecrn-line bg-white" />
        <div className="h-24 rounded-[16px] border border-ecrn-line bg-white" />
      </div>
    </div>
  );
}
