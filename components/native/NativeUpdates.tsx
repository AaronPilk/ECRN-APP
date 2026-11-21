"use client";

import { useEffect, useState } from "react";
import { App } from "@capacitor/app";
import { isNativeApp } from "@/lib/native/platform";

const LOADED_VERSION = process.env.NEXT_PUBLIC_ECRN_BUILD_ID ?? "development";
const VIEWING_ROUTES = new Set(["/dashboard", "/jobs", "/earnings", "/referrals"]);

/** Loads new web releases on resume without discarding forms or active dialogs. */
export function NativeUpdates() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!isNativeApp() || LOADED_VERSION === "development") return;
    let disposed = false;
    let checking = false;
    let pausedAt: number | null = null;
    let activeController: AbortController | null = null;

    async function check(canReload: boolean) {
      if (checking || document.visibilityState === "hidden") return;
      checking = true;
      const controller = new AbortController();
      activeController = controller;
      const timeout = setTimeout(() => controller.abort(), 8_000);
      try {
        const response = await fetch("/api/version", {
          cache: "no-store",
          credentials: "omit",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const { version } = await response.json();
        if (disposed || typeof version !== "string" || version === LOADED_VERSION || version === "development") return;
        const safeToReload = VIEWING_ROUTES.has(window.location.pathname)
          && !document.querySelector("dialog[open], [role='dialog']")
          && !(document.activeElement instanceof HTMLInputElement)
          && !(document.activeElement instanceof HTMLTextAreaElement)
          && !(document.activeElement instanceof HTMLSelectElement)
          && !(document.activeElement instanceof HTMLElement && document.activeElement.isContentEditable)
          && !document.querySelector("form[data-dirty='true']");
        // A stale deployment edge must not trap the app in a reload loop.
        const attempted = sessionStorage.getItem("ecrn-release-reload");
        if (canReload && safeToReload && attempted !== version) {
          sessionStorage.setItem("ecrn-release-reload", version);
          window.location.reload();
          return;
        }
        setAvailable(true);
      } catch {
        // Offline or a deployment is still rolling out; try on the next resume.
      } finally {
        clearTimeout(timeout);
        activeController = null;
        checking = false;
      }
    }

    void check(false);
    const timer = setInterval(() => void check(false), 5 * 60_000);
    const pause = App.addListener("pause", () => { pausedAt = Date.now(); });
    const resume = App.addListener("resume", () => {
      const away = pausedAt === null ? 0 : Date.now() - pausedAt;
      pausedAt = null;
      void check(away >= 60_000);
    });

    return () => {
      disposed = true;
      activeController?.abort();
      clearInterval(timer);
      for (const subscription of [pause, resume]) {
        void subscription.then((listener) => listener.remove()).catch(() => {});
      }
    };
  }, []);

  if (!available) return null;
  return (
    <div role="status" className="fixed inset-x-3 z-[90] mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl bg-ecrn-black px-4 py-3 text-sm text-white shadow-xl" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 80px)" }}>
      <span>Update ready. Finish editing, then reload.</span>
      <button type="button" className="shrink-0 rounded-xl bg-ecrn-green px-3 py-2 font-semibold text-ecrn-black" onClick={() => window.location.reload()}>
        Reload app
      </button>
    </div>
  );
}
