import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentProfile } from "@/lib/auth/session";

/**
 * Layout for every signed-in page. Middleware already bounces signed-out
 * visitors; this also sends people who haven't picked a role to onboarding.
 */
export default async function AuthedAppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (!profile.onboarded && profile.role !== "admin") redirect("/onboarding");
  return <AppShell profile={profile}>{children}</AppShell>;
}
