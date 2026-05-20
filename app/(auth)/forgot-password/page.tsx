import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

export default function ForgotPasswordPage() {
  return (
    <Card className="p-7 animate-slide-up">
      <h1 className="text-2xl font-bold tracking-tight text-ecrn-ink">Reset your password</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Enter your email and we&apos;ll send a reset link.
      </p>

      <form className="mt-7 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
            disabled
          />
        </div>
        <Button type="submit" variant="dark" fullWidth size="lg" disabled className="mt-2">
          Send reset link
        </Button>
      </form>

      <div className="mt-5 p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 leading-relaxed">
        Password reset wires up in Batch 2 once Supabase Auth is connected. Today, you can log in
        with any signed-up email.
      </div>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center text-sm">
        <Link href="/login" className="font-medium text-ecrn-ink hover:underline">
          Back to log in
        </Link>
      </div>
    </Card>
  );
}
