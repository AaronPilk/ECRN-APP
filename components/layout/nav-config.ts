import type { UserRole } from "@/types";

/**
 * Navigation config — pure data, no function references.
 *
 * Why string `iconName` instead of `icon: LucideIcon`:
 *   The AppShell is a Server Component (it reads the session). MobileNav and
 *   Sidebar are Client Components. Next.js App Router cannot serialize
 *   function references across the server→client boundary — passing a Lucide
 *   icon function in props throws a runtime error. So we keep this file
 *   serializable (just strings + strings) and resolve the icon name to the
 *   actual component inside the client component via `iconMap`.
 */

export type IconName =
  | "dashboard"
  | "referrals"
  | "jobs"
  | "earnings"
  | "profile"
  | "applications"
  | "candidates"
  | "companies"
  | "users"
  | "settings"
  | "sync";

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
}

/** Every member gets the same app: anyone can apply or refer. */
export const memberNav: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: "dashboard" },
  { label: "Jobs", href: "/jobs", icon: "jobs" },
  { label: "Referrals", href: "/referrals", icon: "referrals" },
  { label: "Earnings", href: "/earnings", icon: "earnings" },
  { label: "Profile", href: "/profile", icon: "profile" },
];

export const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Candidates", href: "/admin/candidates", icon: "candidates" },
  { label: "Referrals", href: "/admin/referrals", icon: "referrals" },
  { label: "Jobs", href: "/admin/jobs", icon: "jobs" },
  { label: "Companies", href: "/admin/companies", icon: "companies" },
  { label: "Payouts", href: "/admin/payouts", icon: "earnings" },
  { label: "Users", href: "/admin/users", icon: "users" },
  { label: "Bullhorn sync", href: "/admin/sync", icon: "sync" },
  { label: "Settings", href: "/admin/settings", icon: "settings" },
];

export function getNavForRole(role: UserRole): NavItem[] {
  return role === "admin" ? adminNav : memberNav;
}
