import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getCurrentProfile } from "@/lib/auth/mock";
import { setRoleAction } from "../actions";

const ROLE_OPTIONS = [
  {
    role: "referral_partner",
    title: "I want to refer people",
    body: "Upload contacts you know in the construction trades. Earn when Delta places them.",
    icon: "↗",
  },
  {
    role: "candidate",
    title: "I'm looking for a job",
    body: "Browse confidential roles at top-ENR contractors and apply directly.",
    icon: "→",
  },
  {
    role: "company_contact",
    title: "I'm hiring",
    body: "Submit a hiring need and Delta's team will reach out with candidates.",
    icon: "+",
  },
] as const;

export default async function OnboardingPage() {
  const maybeProfile = await getCurrentProfile();
  if (!maybeProfile) redirect("/login");
  const profile = maybeProfile!;

  return (
    <div className="space-y-4 animate-slide-up">
      <div className="text-center mb-2">
        <p className="text-xs font-semibold tracking-[0.18em] uppercase text-ecrn-amber-dark">
          Welcome to ECRN
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-delta-ink">
          What brings you here?
        </h1>
        <p className="mt-2 text-slate-500 text-[15px]">
          Pick one — you can change this later.
        </p>
      </div>

      <div className="space-y-3">
        {ROLE_OPTIONS.map((opt) => (
          <form key={opt.role} action={setRoleAction}>
            <input type="hidden" name="profileId" value={profile.id} />
            <input type="hidden" name="role" value={opt.role} />
            <button
              type="submit"
              className="w-full text-left group"
              aria-label={opt.title}
            >
              <Card className="p-5 hover:shadow-float hover:border-delta-navy/40 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 shrink-0 rounded-2xl bg-delta-navy text-white grid place-items-center text-lg font-semibold">
                    {opt.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold text-delta-ink">{opt.title}</div>
                    <div className="mt-1 text-sm text-slate-500 leading-relaxed">{opt.body}</div>
                  </div>
                  <div className="text-slate-300 group-hover:text-delta-navy text-lg">→</div>
                </div>
              </Card>
            </button>
          </form>
        ))}
      </div>

      <p className="text-center text-xs text-slate-400 pt-2">
        Logged in as <span className="font-medium text-slate-600">{profile.email}</span>{" "}
        ·{" "}
        <Link href="/api/logout" className="underline">
          not you?
        </Link>
      </p>
    </div>
  );
}
