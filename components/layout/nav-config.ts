import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  DollarSign,
  User,
  FileText,
  Building2,
  Settings,
  ClipboardList,
} from "lucide-react";
import type { UserRole } from "@/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const referralPartnerNav: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Referrals", href: "/referrals", icon: Users },
  { label: "Jobs", href: "/jobs", icon: Briefcase },
  { label: "Earnings", href: "/earnings", icon: DollarSign },
  { label: "Profile", href: "/profile", icon: User },
];

export const candidateNav: NavItem[] = [
  { label: "Dashboard", href: "/candidate", icon: LayoutDashboard },
  { label: "Jobs", href: "/candidate/jobs", icon: Briefcase },
  { label: "Applications", href: "/candidate/applications", icon: FileText },
  { label: "Profile", href: "/candidate/profile", icon: User },
];

export const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Candidates", href: "/admin/candidates", icon: Users },
  { label: "Referrals", href: "/admin/referrals", icon: ClipboardList },
  { label: "Jobs", href: "/admin/jobs", icon: Briefcase },
  { label: "Companies", href: "/admin/companies", icon: Building2 },
  { label: "Payouts", href: "/admin/payouts", icon: DollarSign },
  { label: "Users", href: "/admin/users", icon: User },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function getNavForRole(role: UserRole): NavItem[] {
  switch (role) {
    case "admin":
      return adminNav;
    case "candidate":
      return candidateNav;
    case "referral_partner":
    case "company_contact":
    default:
      return referralPartnerNav;
  }
}
