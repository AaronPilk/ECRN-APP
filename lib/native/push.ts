"use client";

import { PushNotifications } from "@capacitor/push-notifications";
import { isNativeApp, nativePlatform } from "./platform";
import { registerPushTokenAction } from "@/app/(app)/profile/actions";

let listenersAttached = false;
let lastError: string | null = null;

function attachListeners(onDone?: (ok: boolean, error?: string) => void) {
  if (listenersAttached && !onDone) return;
  listenersAttached = true;
  void PushNotifications.addListener("registration", async (token) => {
    const platform = nativePlatform();
    if (platform === "web") return;
    const res = await registerPushTokenAction(token.value, platform);
    onDone?.(res.ok, res.error);
  });
  void PushNotifications.addListener("registrationError", (err) => {
    lastError = err.error;
    onDone?.(false, err.error);
  });
}

export type PushState = "unsupported" | "off" | "on" | "denied";

export async function getPushState(): Promise<PushState> {
  if (!isNativeApp()) return "unsupported";
  const p = await PushNotifications.checkPermissions();
  if (p.receive === "granted") return "on";
  if (p.receive === "denied") return "denied";
  return "off";
}

/** Ask for permission (if needed) and register this device for pushes. */
export async function enablePush(): Promise<{ ok: boolean; error?: string }> {
  if (!isNativeApp()) return { ok: false, error: "Only available in the app" };
  let perm = await PushNotifications.checkPermissions();
  if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
    perm = await PushNotifications.requestPermissions();
  }
  if (perm.receive !== "granted") return { ok: false, error: "denied" };

  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve({ ok: false, error: lastError ?? "No response from Apple/Google" }), 15000);
    attachListeners((ok, error) => {
      clearTimeout(timer);
      resolve({ ok, error });
    });
    void PushNotifications.register();
  });
}

/** On app launch: if already allowed, refresh this device's token silently. */
export async function refreshPushRegistration(): Promise<void> {
  if (!isNativeApp()) return;
  const perm = await PushNotifications.checkPermissions().catch(() => null);
  if (perm?.receive !== "granted") return;
  attachListeners();
  await PushNotifications.register().catch(() => {});
}
