import Link from "next/link";

export const metadata = { title: "Page not found", robots: { index: false, follow: true } };

/** Real 404 (status 404), with links back into the site. */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-ecrn-paper flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-ecrn-green-text">404</p>
        <h1 className="mt-3 font-display text-[40px] leading-tight font-semibold tracking-[-0.03em] text-ecrn-ink">That page isn&apos;t here</h1>
        <p className="mt-3 text-[16px] text-ecrn-secondary">It may have moved, or the job may be filled.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3 text-[15px] font-medium">
          <Link href="/" className="text-ecrn-green-text">Home</Link>
          <Link href="/jobs" className="text-ecrn-green-text">Open jobs</Link>
          <Link href="/how-it-works" className="text-ecrn-green-text">How it works</Link>
          <Link href="/start" className="text-ecrn-green-text">Open the app</Link>
        </div>
      </div>
    </div>
  );
}
