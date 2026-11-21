"use client";

import { PushNotifications } from "@capacitor/push-notifications";
import { isNativeApp, nativePlatform } from "./platform";
import { registerPushTokenAction } from "@/app/(app)/profile/actions";

let listeners: Promise<void> | null = null;
const registrationWaiters = new Set<(ok: boolean, error?: string) => void>();

function notifyRegistration(ok: boolean, error?: string) {
  for (const callback of registrationWaiters) callback(ok, error);
  registrationWaiters.clear();
}

function attachListeners(): Promise<void> {
  if (listeners) return listeners;
  listeners = (async () => {
    const registration = await PushNotifications.addListener("registration", async (token) => {
      const platform = nativePlatform();
      if (platform === "web") return;
      try {
        const res = await registerPushTokenAction(token.value, platform);
        notifyRegistration(res.ok, res.error);
      } catch {
        notifyRegistration(false, "Couldn't save notification preferences. Try again.");
      }
    });
    try {
      await PushNotifications.addListener("registrationError", (err) => notifyRegistration(false, err.error));
    } catch (error) {
      await registration.remove();
      throw error;
    }
  })().catch((error) => { listeners = null; throw error; });
  return listeners;
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
    const onDone = (ok: boolean, error?: string) => {
      clearTimeout(timer);
      registrationWaiters.delete(onDone);
      resolve({ ok, error });
    };
    const timer = setTimeout(() => onDone(false, "No response from Apple/Google"), 15000);
    registrationWaiters.add(onDone);
    // Register only after listeners are ready; retrying must not attach another
    // pair of listeners and multiply server writes for every future token.
    void attachListeners().then(() => PushNotifications.register()).catch(() => onDone(false, "Notifications aren't available right now."));
  });
}

/** On app launch: if already allowed, refresh this device's token silently. */
export async function refreshPushRegistration(): Promise<void> {
  if (!isNativeApp()) return;
  const perm = await PushNotifications.checkPermissions().catch(() => null);
  if (perm?.receive !== "granted") return;
  await attachListeners();
  await PushNotifications.register();
}
