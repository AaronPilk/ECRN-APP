import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { SiteHeader, SiteFooter, JsonLd } from "@/components/site/SiteChrome";
import { getCurrentProfile } from "@/lib/auth/session";
import { organizationJsonLd } from "@/lib/site";

/**
 * Jobs are public (indexable job board) and also part of the member app.
 * Signed-in members see them inside the app; visitors see the website.
 */
export default async function JobsLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (profile) {
    if (!profile.onboarded && profile.role !== "admin") redirect("/onboarding");
    return <AppShell profile={profile}>{children}</AppShell>;
  }
  return (
    <div className="min-h-screen flex flex-col bg-ecrn-paper">
      <JsonLd data={organizationJsonLd()} />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
