import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import Link from "next/link";
import { DeltaLockup } from "@/components/ui/DeltaLockup";
import { getNavForRole } from "./nav-config";
import { RoleSwitcher } from "@/components/dev/RoleSwitcher";
import type { Profile } from "@/types";
import { DEMO_MODE } from "@/lib/supabase/env";

interface AppShellProps {
  profile: Profile;
  children: ReactNode;
}

/**
 * The single logged-in app shell. Picks navigation based on role:
 *   - desktop: left sidebar
 *   - mobile: floating glass-blur bottom nav
 *
 * The page content is rendered into the middle column with safe-area
 * padding for iOS home-bar.
 *
 * RoleSwitcher only renders when NEXT_PUBLIC_DEMO_MODE=true.
 */
function initials(p: Profile): string {
  const s = `${p.firstName?.[0] ?? ""}${p.lastName?.[0] ?? ""}`.trim();
  return (s || p.email[0]).toUpperCase();
}

export function AppShell({ profile, children }: AppShellProps) {
  const items = getNavForRole(profile.role, profile.intent === "both");
  // Only the shared demo accounts see the demo role switcher.
  const isMockMode = DEMO_MODE && profile.email.endsWith("@demo.goecrn.com");

  return (
    <div className="min-h-screen flex bg-ecrn-paper">
      <Sidebar
        items={items}
        user={{
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          role: profile.role,
        }}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-30 bg-ecrn-paper/90 backdrop-blur-xl pt-safe">
          <div className="h-[60px] mx-[22px] flex items-center justify-between border-b border-ecrn-line">
            <DeltaLockup />
            <Link
              href={profile.role === "candidate" ? "/candidate/profile" : profile.role === "admin" ? "/admin/settings" : "/profile"}
              aria-label="Your profile"
              className="w-9 h-9 shrink-0 rounded-full bg-ecrn-carbon text-white flex items-center justify-center text-[12px] font-semibold tracking-wide"
            >
              {initials(profile)}
            </Link>
          </div>
        </header>

        <main className="flex-1 pb-28 lg:pb-8">{children}</main>

        <MobileNav items={items} />
      </div>

      {isMockMode && (
        <RoleSwitcher currentRole={profile.role} currentEmail={profile.email} />
      )}
    </div>
  );
}
