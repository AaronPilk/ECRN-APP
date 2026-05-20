import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { loginAction } from "../actions";

export default function LoginPage() {
  return (
    <Card className="p-7 animate-slide-up">
      <h1 className="text-2xl font-bold tracking-tight text-delta-ink">Welcome back</h1>
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
          className="text-sm text-slate-500 hover:text-delta-ink"
        >
          Forgot password?
        </Link>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center text-sm">
        <span className="text-slate-500">New to ECRN?</span>{" "}
        <Link href="/signup" className="font-medium text-delta-ink hover:underline">
          Create an account
        </Link>
      </div>

      <div className="mt-6 p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 text-xs text-amber-900 leading-relaxed">
        <strong>V1 build note:</strong> auth is currently passwordless / mock. Enter any email
        that's been signed up — you'll be logged in as that profile. Real Supabase auth lands in
        Batch 2.
      </div>
    </Card>
  );
}
