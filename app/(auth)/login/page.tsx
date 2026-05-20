import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { loginAction, demoLoginAction } from "../actions";

export default function LoginPage() {
  return (
    <div className="space-y-4 animate-slide-up">
      <Card className="p-7">
        <h1 className="text-2xl font-bold tracking-tight text-ecrn-ink">Welcome back</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Log in with the email you used to sign up.
        </p>

        <form action={loginAction} className="mt-7 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              autoFocus
            />
          </div>

          <Button type="submit" variant="dark" fullWidth size="lg" className="mt-2">
            Log in
          </Button>
        </form>

        <div className="mt-5 text-center">
          <Link
            href="/forgot-password"
            className="text-sm text-slate-500 hover:text-ecrn-ink"
          >
            Forgot password?
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 text-center text-sm">
          <span className="text-slate-500">New to ECRN?</span>{" "}
          <Link href="/signup" className="font-medium text-ecrn-ink hover:underline">
            Create an account
          </Link>
        </div>
      </Card>

      {/* ────────────────────────────────────────────────────────
          Demo panel — visible while we're on mock data (V1).
          Hidden automatically once NEXT_PUBLIC_SUPABASE_URL is set.
       ──────────────────────────────────────────────────────── */}
      {!process.env.NEXT_PUBLIC_SUPABASE_URL && (
        <Card className="p-5 border-dashed border-emerald-300/70 bg-emerald-50/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-emerald-700">
              Dev preview
            </span>
            <span className="h-px flex-1 bg-emerald-200/60" />
          </div>
          <h2 className="text-sm font-semibold text-ecrn-ink">Switch user view</h2>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            Tap a button below to instantly log in as that user type. You can switch any time.
          </p>

          <div className="mt-4 space-y-2">
            <DemoButton
              role="referral_partner"
              title="Referral Partner"
              subtitle="What a network ambassador sees"
              accent="green"
            />
            <DemoButton
              role="candidate"
              title="Job Seeker / Candidate"
              subtitle="What someone looking for a role sees"
              accent="blue"
            />
            <DemoButton
              role="admin"
              title="Admin (Aaron)"
              subtitle="What the Delta team sees"
              accent="dark"
            />
          </div>

          <p className="mt-4 text-[10px] text-slate-500 leading-relaxed">
            This panel only appears while ECRN is running on mock data. Once Supabase is connected
            (Batch 2+), it&apos;ll disappear and real auth takes over.
          </p>
        </Card>
      )}
    </div>
  );
}

function DemoButton({
  role,
  title,
  subtitle,
  accent,
}: {
  role: "admin" | "referral_partner" | "candidate";
  title: string;
  subtitle: string;
  accent: "green" | "blue" | "dark";
}) {
  const accentStyles: Record<typeof accent, string> = {
    green: "bg-ecrn-green/15 text-ecrn-green border-ecrn-green/30",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
    dark: "bg-ecrn-black/10 text-ecrn-ink border-ecrn-black/20",
  };
  return (
    <form action={demoLoginAction}>
      <input type="hidden" name="role" value={role} />
      <button
        type="submit"
        className="w-full text-left p-3 rounded-xl bg-white border border-slate-200 hover:border-ecrn-green/40 hover:shadow-soft transition-all group"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-ecrn-ink">{title}</div>
            <div className="text-xs text-slate-500 mt-0.5">{subtitle}</div>
          </div>
          <span
            className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border ${accentStyles[accent]}`}
          >
            Sign in →
          </span>
        </div>
      </button>
    </form>
  );
}
