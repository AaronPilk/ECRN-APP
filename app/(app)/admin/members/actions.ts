"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logActivity } from "@/lib/data/repository";
import { isUuid } from "@/lib/admin/members";

/**
 * Admin actions on one member: change who gets recruiter credit, and
 * deactivate / reactivate the account. No delete and no role changes here.
 */

const SOURCES = ["organic", "recruiter", "member_invite"] as const;
type Source = (typeof SOURCES)[number];

function back(memberId: string, kind: "error" | "message", text: string, anchor = ""): never {
  redirect(`/admin/members/${memberId}?${kind}=${encodeURIComponent(text)}${anchor}`);
}

/** Set or clear the recruiter credited with this member's sign-up. */
export async function setMemberRecruiterAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const memberId = String(formData.get("memberId") ?? "");
  if (!isUuid(memberId)) redirect("/admin/members");

  const staffRaw = String(formData.get("staffId") ?? "").trim();
  const sourceRaw = String(formData.get("source") ?? "").trim();
  if (staffRaw && !isUuid(staffRaw)) back(memberId, "error", "Pick a team member from the list.", "#attribution");
  if (!(SOURCES as readonly string[]).includes(sourceRaw)) back(memberId, "error", "Pick how they came in.", "#attribution");
  const staffId = staffRaw || null;

  const sb = await createSupabaseServerClient();
  const { data: before, error: readError } = await sb
    .from("profiles")
    .select("id, role, invited_by, recruited_by_staff_id, signup_source")
    .eq("id", memberId)
    .maybeSingle();
  if (readError) back(memberId, "error", "Could not load this member. Try again.");
  if (!before) redirect("/admin/members");
  if (before.role === "admin") back(memberId, "error", "Admin accounts do not have recruiter credit.");

  if (staffId) {
    const { data: staff } = await sb.from("staff").select("id").eq("id", staffId).maybeSingle();
    if (!staff) back(memberId, "error", "That team member no longer exists.", "#attribution");
  }

  // Keep the two fields consistent: "recruiter code" needs a recruiter, and a recruiter is never "organic".
  let source = sourceRaw as Source;
  if (!staffId && source === "recruiter") source = before.invited_by ? "member_invite" : "organic";
  if (staffId && source === "organic") source = "recruiter";

  const fromStaff = (before.recruited_by_staff_id as string | null) ?? null;
  const fromSource = (before.signup_source as string | null) ?? "organic";
  if (fromStaff === staffId && fromSource === source) back(memberId, "message", "Nothing changed.", "#attribution");

  const { data: updated, error } = await sb
    .from("profiles")
    .update({ recruited_by_staff_id: staffId, signup_source: source })
    .eq("id", memberId)
    .select("id");
  if (error || !updated?.length) back(memberId, "error", error?.message ?? "The change was not saved.", "#attribution");

  await logActivity({
    actorUserId: admin.id,
    entityType: "profile",
    entityId: memberId,
    action: "attribution_changed",
    metadata: { from_staff_id: fromStaff, to_staff_id: staffId, from_source: fromSource, to_source: source },
  });

  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin/members");
  revalidatePath("/admin/team");
  back(memberId, "message", staffId ? "Recruiter credit updated." : "Recruiter credit removed.", "#attribution");
}

/** Deactivate or reactivate a member account (`profiles.is_active`). */
export async function setMemberActiveAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const memberId = String(formData.get("memberId") ?? "");
  if (!isUuid(memberId)) redirect("/admin/members");
  const active = formData.get("active") === "true";

  const sb = await createSupabaseServerClient();
  const { data: before, error: readError } = await sb.from("profiles").select("id, role, is_active").eq("id", memberId).maybeSingle();
  if (readError) back(memberId, "error", "Could not load this member. Try again.");
  if (!before) redirect("/admin/members");
  if (before.role === "admin") back(memberId, "error", "Admin accounts are managed in Settings.");
  if (Boolean(before.is_active) === active) back(memberId, "message", active ? "This account is already active." : "This account is already inactive.");

  const { data: updated, error } = await sb.from("profiles").update({ is_active: active }).eq("id", memberId).select("id");
  if (error || !updated?.length) back(memberId, "error", error?.message ?? "The change was not saved.");

  await logActivity({
    actorUserId: admin.id,
    entityType: "profile",
    entityId: memberId,
    action: active ? "account_reactivated" : "account_deactivated",
  });

  revalidatePath(`/admin/members/${memberId}`);
  revalidatePath("/admin/members");
  back(memberId, "message", active ? "Account reactivated." : "Account deactivated.");
}
