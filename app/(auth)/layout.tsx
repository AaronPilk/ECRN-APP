import Link from "next/link";
import { DeltaLockup } from "@/components/ui/DeltaLockup";

/** App and auth screens stay out of search results. */
export const metadata = { robots: { index: false, follow: false } };

/**
 * Shared layout for /login, /signup, /forgot-password, /onboarding.
 * Keep the logo, form and footer together. Auto margins center short forms;
 * long forms remain in normal document flow and can scroll above the keyboard.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex min-h-dvh flex-col items-center bg-ecrn-paper px-5 sm:px-8"
      style={{
        paddingTop: "max(1.5rem, calc(env(safe-area-inset-top, 0px) + 1rem))",
        paddingBottom: "max(1.5rem, calc(env(safe-area-inset-bottom, 0px) + 1rem))",
      }}
    >
      <div className="my-auto w-full max-w-md">
        <header className="mb-6 flex justify-center">
          <Link href="/" aria-label="ECRN home" className="inline-flex min-h-11 items-center">
            <DeltaLockup />
          </Link>
        </header>
        <main>{children}</main>
        <footer className="mt-6 flex flex-col items-center text-center text-xs text-ecrn-secondary/80">
          <p>A Delta Construction Partners Initiative</p>
          <nav aria-label="Account information" className="mt-1 flex flex-wrap justify-center gap-x-5">
            <Link href="/privacy" className="inline-flex min-h-11 items-center px-1 hover:text-slate-600">Privacy</Link>
            <Link href="/terms" className="inline-flex min-h-11 items-center px-1 hover:text-slate-600">Terms</Link>
            <Link href="/support" className="inline-flex min-h-11 items-center px-1 hover:text-slate-600">Support</Link>
          </nav>
        </footer>
      </div>
    </div>
  );
}
