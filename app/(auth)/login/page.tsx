import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormMessage } from "@/components/ui/FormMessage";
import { safeNext } from "@/lib/auth/redirect";
import { SubmitButton } from "../SubmitButton";
import { loginAction, magicLinkAction } from "../actions";

interface PageProps {
  searchParams: Promise<{ error?: string; next?: string; mode?: string; message?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const linkMode = sp.mode === "link";
  const next = safeNext(sp.next) ?? "";

  return (
    <div className="space-y-4 animate-slide-up">
      <Card className="p-5 sm:p-7">
        <h1 className="text-2xl font-bold tracking-tight text-ecrn-ink">Welcome back</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          {linkMode
            ? "We'll email you a one-tap login link. No password needed."
            : "Log in to your ECRN account."}
        </p>

        {/* Mode switch */}
        <div className="mt-6 grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 text-sm font-medium">
          <Link
            href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className={`flex min-h-11 items-center justify-center text-center px-2 py-2 rounded-lg transition-colors ${
              !linkMode ? "bg-white shadow-soft text-ecrn-ink" : "text-slate-500"
            }`}
          >
            Password
          </Link>
          <Link
            href={`/login?mode=link${next ? `&next=${encodeURIComponent(next)}` : ""}`}
            className={`flex min-h-11 items-center justify-center text-center px-2 py-2 rounded-lg transition-colors ${
              linkMode ? "bg-white shadow-soft text-ecrn-ink" : "text-slate-500"
            }`}
          >
            Email me a link
          </Link>
        </div>

        <FormMessage error={sp.error} message={sp.message} className="mt-5" />

        {linkMode ? (
          <form action={magicLinkAction} className="mt-5 space-y-4">
            <input type="hidden" name="next" value={next} />
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} />
            </div>
            <SubmitButton variant="dark" fullWidth size="lg" pendingLabel="Sending link…">
              Send login link
            </SubmitButton>
          </form>
        ) : (
          <form action={loginAction} className="mt-5 space-y-4">
            <input type="hidden" name="next" value={next} />
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-xs text-slate-500 hover:text-ecrn-ink mb-1.5">
                  Forgot password?
                </Link>
              </div>
              <Input id="password" name="password" type="password" required autoComplete="current-password" />
            </div>
            <SubmitButton variant="dark" fullWidth size="lg" pendingLabel="Logging in…">
              Log in
            </SubmitButton>
          </form>
        )}

        <div className="mt-5 pt-4 border-t border-slate-100 text-center text-sm">
          <span className="text-slate-500">New to ECRN?</span>{" "}
          <Link href="/signup" className="font-medium text-ecrn-ink hover:underline">
            Create an account
          </Link>
        </div>
      </Card>
    </div>
  );
}
