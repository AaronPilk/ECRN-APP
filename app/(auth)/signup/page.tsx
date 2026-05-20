import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { signupAction } from "../actions";

export default function SignupPage() {
  return (
    <Card className="p-7 animate-slide-up">
      <h1 className="text-2xl font-bold tracking-tight text-delta-ink">Create your account</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Join the ECRN network. Free to join — no fees, no spam.
      </p>

      <form action={signupAction} className="mt-7 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="firstName">First name</Label>
            <Input id="firstName" name="firstName" required autoComplete="given-name" />
          </div>
          <div>
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" name="lastName" required autoComplete="family-name" />
          </div>
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            inputMode="email"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <Button type="submit" variant="dark" fullWidth size="lg" className="mt-2">
          Create account
        </Button>
      </form>

      <p className="mt-6 text-xs text-slate-500 text-center leading-relaxed">
        By creating an account you agree to receive transactional notifications from ECRN about your
        referrals and applications. You can opt out at any time.
      </p>

      <div className="mt-6 pt-6 border-t border-slate-100 text-center text-sm">
        <span className="text-slate-500">Already have an account?</span>{" "}
        <Link href="/login" className="font-medium text-delta-ink hover:underline">
          Log in
        </Link>
      </div>
    </Card>
  );
}
