import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

/**
 * Shared layout for /login, /signup, /forgot-password, /onboarding.
 * Centered card on a soft light background.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-delta-mist flex flex-col">
      <header className="px-5 sm:px-8 py-5">
        <Link href="/" className="inline-flex">
          <Logo />
        </Link>
      </header>
      <main className="flex-1 flex items-start sm:items-center justify-center px-5 sm:px-8 pb-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="text-center text-xs text-slate-400 pb-6">
        A Delta Construction Partners Initiative
      </footer>
    </div>
  );
}
