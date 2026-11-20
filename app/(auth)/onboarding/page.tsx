import { redirect } from "next/navigation";
import { getCurrentProfile, homeForRole } from "@/lib/auth/session";
import { OnboardingQuiz } from "@/components/onboarding/OnboardingQuiz";

export default async function OnboardingPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login?next=/onboarding");
  if (profile.role === "admin") redirect("/admin");
  if (profile.onboardingCompletedAt) redirect(homeForRole(profile.role, true));

  return <OnboardingQuiz userId={profile.id} firstName={profile.firstName} />;
}
