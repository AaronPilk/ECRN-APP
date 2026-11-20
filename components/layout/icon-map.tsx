"use client";

import {
  LayoutGrid as LayoutDashboard,
  Users,
  Briefcase,
  Wallet as DollarSign,
  User,
  FileText,
  Building2,
  Settings,
  RefreshCw,
  Split,
  Contact,
  Activity,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { IconName } from "./nav-config";

/**
 * String → Lucide-component lookup.
 *
 * Lives in a "use client" file so we never pass function refs through the
 * server→client boundary. NavItem stores `icon: IconName` (a string); the
 * client components resolve it here.
 */
export const iconMap: Record<IconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  referrals: Users,
  jobs: Briefcase,
  earnings: DollarSign,
  profile: User,
  applications: FileText,
  candidates: Users,
  companies: Building2,
  users: User,
  settings: Settings,
  sync: RefreshCw,
  routing: Split,
  team: Contact,
  activity: Activity,
  members: UsersRound,
};
