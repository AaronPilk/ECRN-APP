import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { GroupField } from "@/components/ui/GroupField";
import { getReferrerDisplayName } from "@/lib/data/repository";
import { signupAction } from "../actions";

interface PageProps {
  searchParams: Promise<{ via?: string; ref?: string; error?: string }>;
}

/** One screen: name, phone, email, password → straight into the onboarding quiz. */
export default async function SignupPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const ref = sp.ref ?? "";
  const referrerName = ref ? await getReferrerDisplayName(ref) : null;

  return (
    <div className="animate-slide-up">
      {referrerName && (
        <div className="mb-5 rounded-[14px] bg-ecrn-action-surface px-4 py-3">
          <p className="t-eyebrow !text-ecrn-green-text">Invited by an ECRN partner</p>
          <p className="mt-1 text-[14px] text-ecrn-ink">
            <span className="font-semibold">{referrerName}</span> invited you to join their network.
          </p>
        </div>
      )}

      <h1 className="t-page !text-[34px] !leading-[37px]">Create your account</h1>
      <p className="mt-2 text-[15px] text-ecrn-secondary">Takes about a minute. Free, no spam.</p>

      <FormMessage error={sp.error} className="mt-5" />

      <form action={signupAction} className="mt-6 space-y-4">
        {referrerName && <input type="hidden" name="invitedBy" value={ref} />}

        <div className="group-surface">
          <GroupField label="First name" name="firstName" required autoComplete="given-name" autoCapitalize="words" placeholder="Alex" />
          <GroupField label="Last name" name="lastName" required autoComplete="family-name" autoCapitalize="words" placeholder="Morgan" />
          <GroupField label="Phone" name="phone" type="tel" inputMode="tel" required autoComplete="tel" placeholder="(555) 555-0123" />
          <GroupField label="Email" name="email" type="email" inputMode="email" required autoComplete="email" autoCapitalize="none" placeholder="you@email.com" />
          <GroupField
            label="Password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            placeholder="8+ characters"
          />
        </div>

        <Button type="submit" fullWidth size="lg">
          Continue
        </Button>
      </form>

      <p className="mt-5 text-[12px] text-ecrn-secondary text-center leading-relaxed">
        By continuing you agree to the{" "}
        <Link href="/terms" className="underline">Terms</Link> and{" "}
        <Link href="/privacy" className="underline">Privacy Policy</Link>, and to receive messages about your referrals
        and opportunities. Opt out anytime.
      </p>

      <p className="mt-6 pt-6 border-t border-ecrn-line text-center text-[14px]">
        <span className="text-ecrn-secondary">Already have an account?</span>{" "}
        <Link href="/login" className="font-medium text-ecrn-green-text">
          Log in
        </Link>
      </p>
    </div>
  );
}
