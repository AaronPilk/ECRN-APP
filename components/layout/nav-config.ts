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
  | "sync"
  | "routing"
  | "team"
  | "activity"
  | "members";

export interface NavItem {
  label: string;
  href: string;
  icon: IconName;
  /** Optional sidebar group heading (admin). */
  section?: string;
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
  { label: "Dashboard", href: "/admin", icon: "dashboard", section: "Overview" },
  { label: "Routing", href: "/admin/routing", icon: "routing", section: "Overview" },
  { label: "Activity", href: "/admin/activity", icon: "activity", section: "Overview" },
  { label: "Members", href: "/admin/members", icon: "members", section: "People" },
  { label: "Candidates", href: "/admin/candidates", icon: "candidates", section: "People" },
  { label: "Team", href: "/admin/team", icon: "team", section: "People" },
  { label: "Jobs", href: "/admin/jobs", icon: "jobs", section: "Pipeline" },
  { label: "Applications", href: "/admin/applications", icon: "applications", section: "Pipeline" },
  { label: "Referrals", href: "/admin/referrals", icon: "referrals", section: "Pipeline" },
  { label: "Payouts", href: "/admin/payouts", icon: "earnings", section: "Pipeline" },
  { label: "Companies", href: "/admin/companies", icon: "companies", section: "Pipeline" },
  { label: "Integrations", href: "/admin/sync", icon: "sync", section: "System" },
  { label: "Settings", href: "/admin/settings", icon: "settings", section: "System" },
];

export function getNavForRole(role: UserRole): NavItem[] {
  return role === "admin" ? adminNav : memberNav;
}
