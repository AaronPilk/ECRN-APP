"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { clearDemoData } from "@/lib/admin/demo";
import { CONFIRM_WORD, type ClearDemoState } from "@/components/admin/settings/shared";
import { escapeLike } from "./data";

/**
 * Settings mutations: who has admin access, and removing demo data.
 *
 * Owners only: every action re-checks `requireAdmin()`, and Row Level Security
 * (plus the admin check inside the database functions) refuses everyone else.
 */

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const EmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Enter an email address.")
  .max(254, "That email is too long.")
  .email("That email doesn't look right.");

/** Back to the owners panel with a message. `redirect` never returns. */
function backToOwners(params: { message?: string; error?: string }): never {
  const qs = new URLSearchParams();
  if (params.message) qs.set("message", params.message);
  if (params.error) qs.set("error", params.error);
  redirect(`/admin/settings?${qs.toString()}#owners`);
}

function refresh() {
  revalidatePath("/admin/settings");
  revalidatePath("/(app)/admin", "layout");
}

async function allowlistEmails(sb: Supabase): Promise<{ rows: string[]; error: string | null }> {
  const { data, error } = await sb.from("admin_allowlist").select("email").limit(1000);
  if (error) return { rows: [], error: error.message };
  return { rows: (data ?? []).map((r) => r.email as string), error: null };
}

/** Accounts whose email is exactly this one (case-insensitive). */
async function accountsFor(sb: Supabase, email: string): Promise<{ id: string; role: string; onboarded: boolean }[]> {
  const { data } = await sb.from("profiles").select("id, email, role, onboarded").ilike("email", escapeLike(email)).limit(10);
  return ((data ?? []) as { id: string; email: string; role: string; onboarded: boolean }[]).filter(
    (p) => p.email.trim().toLowerCase() === email
  );
}

// ── owners ───────────────────────────────────────────────────────────

/** Put an email on the admin list. If that person already has an account, it becomes an admin now. */
export async function addOwnerAction(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const parsed = EmailSchema.safeParse(formData.get("email"));
  if (!parsed.success) backToOwners({ error: parsed.error.issues[0]?.message ?? "Enter a valid email address." });
  const email = parsed.data;

  const sb = await createSupabaseServerClient();
  const list = await allowlistEmails(sb);
  if (list.error) backToOwners({ error: `Couldn't read the owner list: ${list.error}` });

  const alreadyListed = list.rows.some((e) => e.trim().toLowerCase() === email);
  if (!alreadyListed) {
    const { error } = await sb.from("admin_allowlist").insert({ email });
    // 23505 = someone added the same email a moment ago, which is fine.
    if (error && error.code !== "23505") backToOwners({ error: `Couldn't add ${email}: ${error.message}` });
  }

  const accounts = await accountsFor(sb, email);
  let promoted = 0;
  for (const account of accounts) {
    if (account.role === "admin" && account.onboarded) continue;
    const { error } = await sb.from("profiles").update({ role: "admin", onboarded: true }).eq("id", account.id);
    if (error) {
      refresh();
      backToOwners({ error: `${email} is on the list, but their account could not be updated: ${error.message}` });
    }
    promoted += 1;
    await sb.from("activity_logs").insert({
      actor_user_id: me.id,
      entity_type: "profile",
      entity_id: account.id,
      action: "role_set",
      metadata: { role: "admin", email, via: "owners_list" },
    });
  }

  refresh();
  if (accounts.length === 0) {
    backToOwners({ message: `${email} is on the list. They become an admin when they sign up with that email.` });
  }
  if (promoted === 0 && alreadyListed) backToOwners({ message: `${email} is already an owner.` });
  backToOwners({ message: `${email} is now an owner. Their account has admin access.` });
}

/**
 * Take an email off the admin list and turn that account back into a regular
 * member. You can't remove yourself, and the list can never end up empty.
 */
export async function removeOwnerAction(formData: FormData): Promise<void> {
  const me = await requireAdmin();
  const parsed = EmailSchema.safeParse(formData.get("email"));
  if (!parsed.success) backToOwners({ error: "Pick an owner to remove." });
  const email = parsed.data;

  if (email === me.email.trim().toLowerCase()) {
    backToOwners({ error: "You can't remove yourself. Another owner has to do it." });
  }

  const sb = await createSupabaseServerClient();
  const accounts = await accountsFor(sb, email);
  if (accounts.some((a) => a.id === me.id)) {
    backToOwners({ error: "You can't remove yourself. Another owner has to do it." });
  }

  const list = await allowlistEmails(sb);
  if (list.error) backToOwners({ error: `Couldn't read the owner list: ${list.error}` });
  const targets = list.rows.filter((e) => e.trim().toLowerCase() === email);
  const remaining = list.rows.length - targets.length;
  if (remaining < 1) {
    backToOwners({ error: "There has to be at least one owner on the list. Add another owner first." });
  }

  if (targets.length > 0) {
    const { error } = await sb.from("admin_allowlist").delete().in("email", targets);
    if (error) backToOwners({ error: `Couldn't remove ${email}: ${error.message}` });
  }

  let demoted = 0;
  for (const account of accounts) {
    if (account.role !== "admin") continue;
    const { error } = await sb.from("profiles").update({ role: "referral_partner" }).eq("id", account.id).neq("id", me.id);
    if (error) {
      refresh();
      backToOwners({ error: `${email} is off the list, but their account still has admin access: ${error.message}` });
    }
    demoted += 1;
    await sb.from("activity_logs").insert({
      actor_user_id: me.id,
      entity_type: "profile",
      entity_id: account.id,
      action: "role_set",
      metadata: { role: "referral_partner", email, via: "owners_list" },
    });
  }

  refresh();
  if (targets.length === 0 && demoted === 0) backToOwners({ message: `${email} was not an owner.` });
  backToOwners({
    message: demoted > 0 ? `${email} is no longer an owner. Their account is a regular member now.` : `${email} is off the owner list.`,
  });
}

// ── demo data ────────────────────────────────────────────────────────

/** Remove every demo row. Needs the word REMOVE typed into the form. */
export async function clearDemoDataAction(_prev: ClearDemoState, formData: FormData): Promise<ClearDemoState> {
  await requireAdmin();
  const typed = String(formData.get("confirm") ?? "").trim();
  if (typed !== CONFIRM_WORD) return { status: "error", message: `Type ${CONFIRM_WORD} to confirm.` };

  const { removed, error } = await clearDemoData();
  if (error || !removed) {
    return { status: "error", message: `Nothing was removed. ${error ?? "The database did not answer."}` };
  }
  refresh();
  return { status: "done", removed };
}
