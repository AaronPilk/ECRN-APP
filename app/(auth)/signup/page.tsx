import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { signupAction } from "../actions";
import { getProfileById } from "@/lib/data/repository";

interface PageProps {
  searchParams?: { via?: string; ref?: string };
}

export default async function SignupPage({ searchParams }: PageProps) {
  const ref = searchParams?.ref ?? "";
  const fromInvite = searchParams?.via === "invite" && Boolean(ref);

  // If we can resolve the referrer's profile, show a friendly banner.
  const referrer = fromInvite ? await getProfileById(ref) : null;

  return (
    <Card className="p-7 animate-slide-up">
      {fromInvite && (
        <div className="mb-5 p-3 rounded-xl bg-ecrn-green/10 border border-ecrn-green/30">
          <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-700 font-semibold">
            Invited by an ECRN partner
          </div>
          <p className="mt-1 text-sm text-ecrn-ink">
            {referrer ? (
              <>
                <span className="font-semibold">
                  {referrer.firstName ?? "An ECRN partner"} {referrer.lastName ?? ""}
                </span>{" "}
                invited you to join their network.
              </>
            ) : (
              "Welcome — you were sent here by an ECRN partner."
            )}
          </p>
        </div>
      )}

      <h1 className="text-2xl font-bold tracking-tight text-ecrn-ink">Create your account</h1>
      <p className="mt-1.5 text-sm text-slate-500">
        Join the ECRN network. Free to join — no fees, no spam.
      </p>

      <form action={signupAction} className="mt-7 space-y-4">
        {ref && <input type="hidden" name="invitedBy" value={ref} />}

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
        <Link href="/login" className="font-medium text-ecrn-ink hover:underline">
          Log in
        </Link>
      </div>
    </Card>
  );
}
