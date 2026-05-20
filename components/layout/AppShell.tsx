import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";
import { Logo } from "@/components/ui/Logo";
import { getNavForRole } from "./nav-config";
import type { Profile } from "@/types";

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
 */
export function AppShell({ profile, children }: AppShellProps) {
  const items = getNavForRole(profile.role);
  return (
    <div className="min-h-screen flex bg-delta-mist">
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
        <header className="lg:hidden sticky top-0 z-30 glass border-b border-slate-200/60 pt-safe">
          <div className="h-14 px-4 flex items-center justify-between">
            <Logo />
            <div className="w-9 h-9 rounded-full bg-delta-navy text-white flex items-center justify-center text-sm font-semibold">
              {(profile.firstName?.[0] ?? profile.email[0]).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 pb-28 lg:pb-8">{children}</main>

        <MobileNav items={items} />
      </div>
    </div>
  );
}
