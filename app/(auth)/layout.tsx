import Link from "next/link";
import { DeltaLockup } from "@/components/ui/DeltaLockup";

/**
 * Shared layout for /login, /signup, /forgot-password, /onboarding.
 * Centered card on a soft light background.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ecrn-paper flex flex-col">
      <header className="px-[22px] sm:px-8 py-4 pt-safe-plus">
        <Link href="/" className="inline-flex">
          <DeltaLockup />
        </Link>
      </header>
      <main className="flex-1 flex items-start sm:items-center justify-center px-[22px] sm:px-8 pb-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="text-center text-xs text-ecrn-secondary/80 pb-6 pb-safe space-x-3">
        <span>A Delta Construction Partners Initiative</span>
        <Link href="/privacy" className="hover:text-slate-600">Privacy</Link>
        <Link href="/terms" className="hover:text-slate-600">Terms</Link>
        <Link href="/support" className="hover:text-slate-600">Support</Link>
      </footer>
    </div>
  );
}
