import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toStaff } from "@/lib/data/mappers";
import type { Staff, StaffRole } from "@/types";

/**
 * Delta team (owners, account managers, recruiters). Admin-only: Row Level
 * Security returns nothing for anyone else.
 */
export const listStaff = cache(async (): Promise<Staff[]> => {
  const sb = await createSupabaseServerClient();
  const { data, error } = await sb.from("staff").select("*").order("first_name");
  if (error) throw new Error(`listStaff: ${error.message}`);
  return (data ?? []).map(toStaff);
});

export async function getStaffMap(): Promise<Map<string, Staff>> {
  return new Map((await listStaff()).map((s) => [s.id, s]));
}

export async function getStaffById(id: string): Promise<Staff | null> {
  return (await getStaffMap()).get(id) ?? null;
}

export function staffName(s?: Pick<Staff, "firstName" | "lastName"> | null): string {
  return s ? `${s.firstName} ${s.lastName}`.trim() : "—";
}

export const STAFF_ROLE_LABEL: Record<StaffRole, string> = {
  owner: "Owner",
  account_manager: "Account manager",
  recruiter: "Recruiter",
};

/** Active account managers (owners can own jobs too) and recruiters, for pickers. */
export function splitStaff(all: Staff[]): { accountManagers: Staff[]; recruiters: Staff[] } {
  const active = all.filter((s) => s.isActive);
  return {
    accountManagers: active.filter((s) => s.staffRole !== "recruiter"),
    recruiters: active.filter((s) => s.staffRole === "recruiter"),
  };
}

/** Public sign-up link for a team member's code. */
export function inviteUrl(code: string, origin = "https://ecrn.com"): string {
  return `${origin.replace(/\/$/, "")}/r/${code}`;
}
