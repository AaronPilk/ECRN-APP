import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/** The one main host (PILK AI SEO SOP, Phase 1). */
const MAIN_HOST = "ecrn.com";

/** Signed-in app and auth screens are never indexed. */
const PRIVATE_PREFIXES = [
  "/dashboard", "/referrals", "/earnings", "/profile", "/candidate", "/admin", "/install",
  "/onboarding", "/login", "/signup", "/forgot-password", "/reset-password", "/check-email",
  "/start", "/auth", "/api", "/r/",
];

export async function middleware(request: NextRequest) {
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(":")[0].toLowerCase();

  // www → bare, keeping path and query.
  if (host === `www.${MAIN_HOST}`) {
    const url = request.nextUrl.clone();
    url.host = MAIN_HOST;
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 301);
  }

  const response = await updateSession(request);
  const path = request.nextUrl.pathname;

  // Only the main host is indexable; workers.dev, previews and localhost are not.
  const isPrivate = PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(p.endsWith("/") ? p : `${p}/`) || path === p.replace(/\/$/, ""));
  if (host !== MAIN_HOST || isPrivate) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  if (host === MAIN_HOST) response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  return response;
}

export const config = {
  matcher: [
    // Everything except static assets, images, and PWA files.
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon.svg|manifest.webmanifest|sw.js|icons/|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)$).*)",
  ],
};
