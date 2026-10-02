import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toProfile } from "@/lib/data/mappers";
import type { Profile, UserRole } from "@/types";

/**
 * The signed-in user's profile, or null. Cached per request so layouts and
 * pages can both call it without extra round trips.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return data ? toProfile(data) : null;
});

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/dashboard");
  return profile;
}

/** Where each role lands after signing in. */
export function homeForRole(role: UserRole, onboarded = true): string {
  if (!onboarded && role !== "admin") return "/onboarding";
  switch (role) {
    case "admin":
      return "/admin";
    case "candidate":
      return "/candidate";
    case "company_contact":
      return "/hire";
    default:
      return "/dashboard";
  }
}
