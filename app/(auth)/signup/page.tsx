import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { GroupField } from "@/components/ui/GroupField";
import { getReferrerDisplayName } from "@/lib/data/repository";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { signupAction } from "../actions";

interface PageProps {
  searchParams: Promise<{ via?: string; ref?: string; code?: string; error?: string }>;
}

/** URL params can repeat; take the first value. */
const first = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] : v) ?? "";

/** The Delta team member behind an invite code, or null if the code isn't theirs. */
async function resolveRecruiter(code: string): Promise<{ code: string; name: string; title: string | null } | null> {
  try {
    const sb = await createSupabaseServerClient();
    const { data, error } = await sb.rpc("resolve_invite_code", { p_code: code });
    if (error || !data || typeof data !== "object") return null;
    const r = data as { kind?: string; code?: string; name?: string; title?: string | null };
    if (r.kind !== "staff" || !r.name) return null;
    return { code: String(r.code ?? code).toUpperCase(), name: r.name, title: r.title?.trim() || null };
  } catch {
    return null;
  }
}

/** One screen: name, phone, email, password → straight into the onboarding quiz. */
export default async function SignupPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const ref = first(sp.ref);
  // Recruiter codes are letters and digits only (ecrn.com/r/CODE).
  const code = first(sp.code).replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 24);

  const [referrerName, recruiter] = await Promise.all([
    ref ? getReferrerDisplayName(ref) : null,
    code ? resolveRecruiter(code) : null,
  ]);

  return (
    <div className="animate-slide-up">
      {recruiter ? (
        <div className="mb-5 rounded-[14px] bg-ecrn-action-surface px-4 py-3">
          <p className="text-[15px] text-ecrn-ink">
            Invited by <span className="font-semibold">{recruiter.name}</span>
          </p>
          <p className="mt-0.5 text-[13px] text-ecrn-green-text">
            {recruiter.title ? `${recruiter.title}, ` : ""}Delta Construction Partners
          </p>
        </div>
      ) : (
        referrerName && (
          <div className="mb-5 rounded-[14px] bg-ecrn-action-surface px-4 py-3">
            <p className="t-eyebrow !text-ecrn-green-text">Invited by an ECRN partner</p>
            <p className="mt-1 text-[14px] text-ecrn-ink">
              <span className="font-semibold">{referrerName}</span> invited you to join their network.
            </p>
          </div>
        )
      )}

      <h1 className="t-page !text-[34px] !leading-[37px]">Create your account</h1>
      <p className="mt-2 text-[15px] text-ecrn-secondary">Takes about a minute. Free, no spam.</p>

      <FormMessage error={sp.error} className="mt-5" />

      <form action={signupAction} className="mt-6 space-y-4">
        {referrerName && <input type="hidden" name="invitedBy" value={ref} />}
        {recruiter && <input type="hidden" name="inviteCode" value={recruiter.code} />}

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

        {/* Optional and out of the way: nobody has to open this to sign up. */}
        {!recruiter && (
          <details open={code !== ""} className="px-1">
            <summary className="inline-block list-none [&::-webkit-details-marker]:hidden cursor-pointer select-none py-1 text-[14px] font-medium text-ecrn-green-text">
              Have an invite code?
            </summary>
            <div className="group-surface mt-2">
              <label className="group-row cursor-text">
                <span className="text-[15px] text-ecrn-ink shrink-0">Invite code</span>
                <input
                  name="inviteCode"
                  defaultValue={code}
                  maxLength={24}
                  autoComplete="off"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Optional"
                  className="min-w-0 flex-1 text-right bg-transparent outline-none text-[16px] uppercase text-ecrn-ink placeholder:normal-case placeholder:text-ecrn-secondary/70"
                />
              </label>
            </div>
          </details>
        )}

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
