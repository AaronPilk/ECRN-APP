"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { App } from "@capacitor/app";
import { Preferences } from "@capacitor/preferences";
import { SplashScreen } from "@capacitor/splash-screen";
import { StatusBar, Style } from "@capacitor/status-bar";
import { BiometricAuth } from "@aparajita/capacitor-biometric-auth";
import { isNativeApp, nativePlatform } from "@/lib/native/platform";
import { refreshPushRegistration } from "@/lib/native/push";

export const APP_LOCK_KEY = "ecrn_app_lock";
const RELOCK_AFTER_MS = 60_000;

/**
 * Runs only inside the iOS/Android app:
 *   - status bar + splash screen
 *   - Android hardware back button
 *   - optional Face ID / fingerprint lock (Profile → Security)
 */
export function NativeBootstrap() {
  const [native, setNative] = useState(false);
  const [locked, setLocked] = useState(false);
  const backgroundedAt = useRef<number | null>(null);
  const unlocking = useRef(false);

  const unlock = useCallback(async () => {
    if (unlocking.current) return;
    unlocking.current = true;
    try {
      await BiometricAuth.authenticate({
        reason: "Unlock ECRN",
        cancelTitle: "Cancel",
        allowDeviceCredential: true,
        iosFallbackTitle: "Use passcode",
        androidTitle: "Unlock ECRN",
      });
      setLocked(false);
    } catch {
      // stay locked; user can tap Unlock again
    } finally {
      unlocking.current = false;
    }
  }, []);

  const lockIfEnabled = useCallback(async () => {
    const { value } = await Preferences.get({ key: APP_LOCK_KEY });
    if (value === "on") {
      setLocked(true);
      void unlock();
    }
  }, [unlock]);

  useEffect(() => {
    if (!isNativeApp()) return;
    setNative(true);
    document.documentElement.classList.add("native-app");

    void StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    if (nativePlatform() === "android") {
      void StatusBar.setBackgroundColor({ color: "#FFFFFF" }).catch(() => {});
    }
    void SplashScreen.hide().catch(() => {});
    void BiometricAuth.checkBiometry().catch(() => {});
    void lockIfEnabled();
    void refreshPushRegistration().catch(() => {});

    const subs = [
      App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) window.history.back();
        else void App.minimizeApp();
      }),
      App.addListener("pause", () => {
        backgroundedAt.current = Date.now();
      }),
      App.addListener("resume", () => {
        const away = backgroundedAt.current ? Date.now() - backgroundedAt.current : 0;
        backgroundedAt.current = null;
        if (away > RELOCK_AFTER_MS) void lockIfEnabled();
      }),
    ];
    return () => {
      subs.forEach((p) => p.then((h) => h.remove()).catch(() => {}));
    };
  }, [lockIfEnabled]);

  if (!native || !locked) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-ecrn-black flex flex-col items-center justify-center text-white px-8 text-center">
      <svg width="64" height="64" viewBox="0 0 32 32" fill="none" aria-hidden>
        <path d="M16 4 L29 27 L3 27 Z" stroke="#16C172" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M16 12 L24 26 L8 26 Z" fill="#FFFFFF" />
      </svg>
      <h1 className="mt-6 text-xl font-semibold">ECRN is locked</h1>
      <p className="mt-2 text-sm text-white/60">Unlock to see your referrals and earnings.</p>
      <button
        type="button"
        onClick={() => void unlock()}
        className="mt-8 px-8 py-3.5 rounded-2xl bg-ecrn-green text-ecrn-black font-semibold"
      >
        Unlock
      </button>
    </div>
  );
}
