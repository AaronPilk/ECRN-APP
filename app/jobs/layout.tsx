import "../(site)/site.css";
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
    <div className="site-root flex min-h-screen flex-col bg-ecrn-paper">
      <JsonLd data={organizationJsonLd()} />
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
