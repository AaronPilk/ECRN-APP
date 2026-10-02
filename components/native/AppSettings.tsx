"use client";

import { useEffect, useState } from "react";
import { Preferences } from "@capacitor/preferences";
import { BiometricAuth } from "@aparajita/capacitor-biometric-auth";
import { Bell, Fingerprint } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { isNativeApp } from "@/lib/native/platform";
import { enablePush, getPushState, type PushState } from "@/lib/native/push";
import { APP_LOCK_KEY } from "./NativeBootstrap";

/** App-only settings: Face ID lock + push notifications. Hidden on the web. */
export function AppSettings() {
  const [native, setNative] = useState(false);
  const [lockAvailable, setLockAvailable] = useState(false);
  const [lockOn, setLockOn] = useState(false);
  const [push, setPush] = useState<PushState>("unsupported");
  const [pushMsg, setPushMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isNativeApp()) return;
    setNative(true);
    void BiometricAuth.checkBiometry()
      .then((r) => setLockAvailable(r.isAvailable || r.deviceIsSecure))
      .catch(() => {});
    void Preferences.get({ key: APP_LOCK_KEY }).then(({ value }) => setLockOn(value === "on"));
    void getPushState().then(setPush);
  }, []);

  if (!native) return null;

  async function toggleLock() {
    setBusy(true);
    try {
      if (!lockOn) {
        await BiometricAuth.authenticate({ reason: "Turn on Face ID lock", allowDeviceCredential: true });
        await Preferences.set({ key: APP_LOCK_KEY, value: "on" });
        setLockOn(true);
      } else {
        await Preferences.remove({ key: APP_LOCK_KEY });
        setLockOn(false);
      }
    } catch {
      /* cancelled */
    } finally {
      setBusy(false);
    }
  }

  async function turnOnPush() {
    setBusy(true);
    setPushMsg(null);
    const res = await enablePush();
    setBusy(false);
    if (res.ok) {
      setPush("on");
      setPushMsg("You'll get updates when your referrals move or payouts change.");
    } else if (res.error === "denied") {
      setPush("denied");
    } else {
      setPushMsg("Notifications aren't available in this build yet.");
    }
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-ecrn-ink mb-3">App settings</h2>
      <Card>
        <CardContent className="py-5 space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-100 grid place-items-center text-ecrn-ink">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold text-ecrn-ink">Face ID lock</div>
              <p className="text-sm text-slate-500 mt-0.5">
                {lockAvailable
                  ? "Require Face ID or your passcode to open ECRN."
                  : "Set up Face ID or a passcode on this phone to use this."}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={lockOn}
              disabled={!lockAvailable || busy}
              onClick={() => void toggleLock()}
              className={`relative shrink-0 w-12 h-7 rounded-full transition-colors disabled:opacity-40 ${
                lockOn ? "bg-ecrn-green" : "bg-slate-300"
              }`}
            >
              <span
                className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all ${
                  lockOn ? "left-[1.375rem]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          <div className="flex items-start gap-3 pt-5 border-t border-slate-100">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-100 grid place-items-center text-ecrn-ink">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold text-ecrn-ink">Notifications</div>
              <p className="text-sm text-slate-500 mt-0.5">
                {push === "on"
                  ? "On — we'll let you know when something changes."
                  : push === "denied"
                    ? "Off. Turn them on in Settings → ECRN → Notifications."
                    : "Get notified when a referral moves forward or a payout is approved."}
              </p>
              {pushMsg && <p className="text-xs text-slate-500 mt-1.5">{pushMsg}</p>}
            </div>
            {push === "off" && (
              <Button size="sm" variant="primary" onClick={() => void turnOnPush()} loading={busy}>
                Turn on
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
