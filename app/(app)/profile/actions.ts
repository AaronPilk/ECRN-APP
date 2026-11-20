"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteMyAccount, registerDeviceToken } from "@/lib/data/repository";

export interface ClaimInviteCodeState {
  ok: boolean;
  /** The recruiter's name, once connected. */
  name?: string;
  error?: string;
  /** What the member typed, so the field keeps it after an error. */
  code?: string;
}

/**
 * A member who signed up without a recruiter's link (for example straight from
 * the App Store) adds the recruiter's code afterwards. The database function
 * does the linking and refuses if they already have a recruiter.
 */
export async function claimInviteCodeAction(
  _prev: ClaimInviteCodeState,
  formData: FormData
): Promise<ClaimInviteCodeState> {
  const raw = formData.get("code");
  const code = (typeof raw === "string" ? raw : "").replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 24);

  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, code, error: "Please log in again to add a code." };
  if (code.length < 3) return { ok: false, code, error: "Enter the code your recruiter gave you." };

  try {
    const sb = await createSupabaseServerClient();
    const { data, error } = await sb.rpc("claim_invite_code", { p_code: code });
    if (error) {
      if (/recognized/i.test(error.message)) {
        return { ok: false, code, error: "That code isn't recognized. Check it with your recruiter and try again." };
      }
      if (/already linked/i.test(error.message)) {
        return { ok: false, code, error: "Your account is already connected with a recruiter." };
      }
      return { ok: false, code, error: "We couldn't connect you just now. Please try again." };
    }
    const name = String((data as { name?: string } | null)?.name ?? "").trim();
    revalidatePath("/profile");
    return { ok: true, name: name || "your recruiter" };
  } catch {
    return { ok: false, code, error: "We couldn't connect you just now. Please try again." };
  }
}

/** Called by the app after the user allows notifications. */
export async function registerPushTokenAction(
  token: string,
  platform: "ios" | "android"
): Promise<{ ok: boolean; error?: string }> {
  const profile = await getCurrentProfile();
  if (!profile) return { ok: false, error: "Not signed in" };
  if (typeof token !== "string" || !token || (platform !== "ios" && platform !== "android")) {
    return { ok: false, error: "Invalid token" };
  }
  try {
    await registerDeviceToken(token, platform);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Couldn't save token" };
  }
}

/** Permanently delete the signed-in account (App Store requirement). */
export async function deleteAccountAction(formData: FormData): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  if (String(formData.get("confirm") ?? "").trim().toUpperCase() !== "DELETE") {
    redirect("/profile/delete?error=" + encodeURIComponent('Type DELETE to confirm.'));
  }
  try {
    // Remove resume files first (Storage API; the DB function can't touch storage).
    const sb = await createSupabaseServerClient();
    const { data: files } = await sb.storage.from("resumes").list(profile.id, { limit: 100 });
    if (files?.length) await sb.storage.from("resumes").remove(files.map((f) => `${profile.id}/${f.name}`));
    await deleteMyAccount();
  } catch (e) {
    redirect("/profile/delete?error=" + encodeURIComponent(e instanceof Error ? e.message : "Couldn't delete account"));
  }
  redirect("/login?message=" + encodeURIComponent("Your account has been deleted."));
}
