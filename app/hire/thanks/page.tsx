import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

export default function HireThanksPage() {
  return (
    <div className="min-h-screen bg-delta-mist flex flex-col">
      <header className="px-5 sm:px-8 py-5">
        <Link href="/"><Logo /></Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-5 sm:px-8">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 grid place-items-center text-2xl">✓</div>
          <h1 className="mt-5 text-2xl font-bold text-delta-ink">We&apos;ve got it.</h1>
          <p className="mt-2 text-slate-600">
            Your hiring need is in front of Delta&apos;s recruiting team. Someone will reach out
            shortly.
          </p>
          <Link href="/" className="block mt-6">
            <Button variant="secondary" fullWidth>
              Back to home
            </Button>
          </Link>
        </Card>
      </main>
    </div>
  );
}
