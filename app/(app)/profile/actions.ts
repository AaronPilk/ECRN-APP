"use server";

import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/session";
import { deleteMyAccount, registerDeviceToken } from "@/lib/data/repository";

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
    await deleteMyAccount();
  } catch (e) {
    redirect("/profile/delete?error=" + encodeURIComponent(e instanceof Error ? e.message : "Couldn't delete account"));
  }
  redirect("/login?message=" + encodeURIComponent("Your account has been deleted."));
}
