import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";

/** App and auth screens stay out of search results. */
export const metadata = { robots: { index: false, follow: false } };

/** How stale "last seen" may get before we write it again. */
const LAST_SEEN_STALE_MS = 30 * 60 * 1000;

/** The iOS and Android apps add "ECRNApp" to their web view's user agent. */
function platformFromUserAgent(ua: string | null): "ios" | "android" | "web" {
  const s = ua ?? "";
  if (!s.includes("ECRNApp")) return "web";
  if (/Android/i.test(s)) return "android";
  // iPads can report a desktop "Macintosh" user agent inside the app.
  return /iPhone|iPad|iPod|iOS|Macintosh/.test(s) ? "ios" : "android";
}

/**
 * Stamp the member's own profile with "seen now" (at most every 30 minutes).
 * This feeds the active-member numbers on the admin side and must never be
 * the reason a page fails to load.
 */
async function scheduleLastSeen(profile: Profile): Promise<void> {
  const last = profile.lastSeenAt ? Date.parse(profile.lastSeenAt) : NaN;
  if (Number.isFinite(last) && Date.now() - last < LAST_SEEN_STALE_MS) return;
  try {
    const userAgent = (await headers()).get("user-agent");
    const supabase = await createSupabaseServerClient();
    after(async () => {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ last_seen_at: new Date().toISOString(), last_platform: platformFromUserAgent(userAgent) })
          .eq("id", profile.id);
        if (error) console.error("[ECRN] last seen update failed:", error.message);
      } catch (e) {
        console.error("[ECRN] last seen update failed:", e instanceof Error ? e.message : e);
      }
    });
  } catch (e) {
    console.error("[ECRN] last seen update failed:", e instanceof Error ? e.message : e);
  }
}

/**
 * Layout for every signed-in page. Middleware already bounces signed-out
 * visitors; this also sends people who haven't picked a role to onboarding.
 */
export default async function AuthedAppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  // An admin deactivated this account: no access to the app.
  if (!profile.isActive && profile.role !== "admin") redirect("/account-disabled");
  if (!profile.onboarded && profile.role !== "admin") redirect("/onboarding");
  // Activity bookkeeping must not hold up navigation or the first paint.
  await scheduleLastSeen(profile);
  return <AppShell profile={profile}>{children}</AppShell>;
}
