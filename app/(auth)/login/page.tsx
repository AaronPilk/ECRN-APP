import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { FormMessage } from "@/components/ui/FormMessage";
import { DEMO_MODE } from "@/lib/supabase/env";
import { loginAction, magicLinkAction, demoLoginAction } from "../actions";

interface PageProps {
  searchParams: Promise<{ error?: string; next?: string; mode?: string; message?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const linkMode = sp.mode === "link";
  const next = sp.next && sp.next.startsWith("/") ? sp.next : "";

  return (
    <div className="space-y-4 animate-slide-up">
      <Card className="p-7">
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
            className={`text-center py-2 rounded-lg transition-colors ${
              !linkMode ? "bg-white shadow-soft text-ecrn-ink" : "text-slate-500"
            }`}
          >
            Password
          </Link>
          <Link
            href={`/login?mode=link${next ? `&next=${encodeURIComponent(next)}` : ""}`}
            className={`text-center py-2 rounded-lg transition-colors ${
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
              <Input id="email" name="email" type="email" required autoComplete="email" inputMode="email" autoFocus />
            </div>
            <Button type="submit" variant="dark" fullWidth size="lg">
              Send login link
            </Button>
          </form>
        ) : (
          <form action={loginAction} className="mt-5 space-y-4">
            <input type="hidden" name="next" value={next} />
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" inputMode="email" autoFocus />
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
            <Button type="submit" variant="dark" fullWidth size="lg">
              Log in
            </Button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-slate-100 text-center text-sm">
          <span className="text-slate-500">New to ECRN?</span>{" "}
          <Link href="/signup" className="font-medium text-ecrn-ink hover:underline">
            Create an account
          </Link>
        </div>
      </Card>

      {DEMO_MODE && (
        <Card className="p-5 border-dashed border-emerald-300/70 bg-emerald-50/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-emerald-700">
              Demo accounts
            </span>
            <span className="h-px flex-1 bg-emerald-200/60" />
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Preview ECRN with sample data. These accounts only see demo records.
          </p>
          <div className="mt-4 space-y-2">
            <DemoButton role="referral_partner" title="Referral Partner" subtitle="What a network ambassador sees" />
            <DemoButton role="candidate" title="Job Seeker" subtitle="What someone looking for a role sees" />
          </div>
        </Card>
      )}
    </div>
  );
}

function DemoButton({ role, title, subtitle }: { role: string; title: string; subtitle: string }) {
  return (
    <form action={demoLoginAction}>
      <input type="hidden" name="role" value={role} />
      <button
        type="submit"
        className="w-full text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-ecrn-green/40 hover:shadow-soft transition-all"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-ecrn-ink">{title}</div>
            <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>
          </div>
          <span className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-ecrn-green/15 text-emerald-700 border-ecrn-green/30">
            Open demo →
          </span>
        </div>
      </button>
    </form>
  );
}
