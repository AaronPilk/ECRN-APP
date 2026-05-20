import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentProfile } from "@/lib/auth/mock";

/**
 * Layout for every authenticated page. Anything under (app) requires a
 * profile in the session cookie; we redirect to /login otherwise.
 */
export default async function AuthedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }
  // After redirect() (which throws), profile is guaranteed to be non-null.
  return <AppShell profile={profile!}>{children}</AppShell>;
}
