import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";
import { isDemoEmail } from "@/lib/auth/redirect";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/referrals",
  "/earnings",
  "/profile",
  "/candidate",
  "/admin",
  "/install",
  "/onboarding",
];

/**
 * Refreshes the Supabase session cookie on every request and bounces
 * signed-out visitors away from app routes.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;

  // Native launches do not need an Auth round trip before /start checks the
  // session and chooses the correct home for this account.
  if (path === "/" && (request.headers.get("user-agent") ?? "").includes("ECRNApp")) {
    const url = request.nextUrl.clone();
    url.pathname = "/start";
    url.search = "";
    const launch = NextResponse.redirect(url);
    launch.headers.set("Cache-Control", "private, no-store");
    return launch;
  }

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, cacheHeaders) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        const updated = NextResponse.next({ request });
        response.cookies.getAll().forEach((cookie) => updated.cookies.set(cookie));
        for (const name of ["Cache-Control", "Expires", "Pragma"]) {
          const value = response.headers.get(name);
          if (value) updated.headers.set(name, value);
        }
        cookiesToSet.forEach(({ name, value, options }) =>
          updated.cookies.set(name, value, options)
        );
        Object.entries(cacheHeaders).forEach(([name, value]) => updated.headers.set(name, value));
        response = updated;
      },
    },
  });

  // Verify identity and refresh expiring tokens. With asymmetric signing
  // keys, this avoids a network request to Auth on every tab navigation.
  const { data, error } = await supabase.auth.getClaims();
  const user = error ? null : data?.claims;
  const demoSession = isDemoEmail(user?.email);
  if (demoSession) await supabase.auth.signOut({ scope: "local" });

  const isProtected = PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));

  if ((!user || demoSession) && (isProtected || (demoSession && path === "/start"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path + request.nextUrl.search)}`;
    const redirect = NextResponse.redirect(url);
    // A refresh/sign-out can write cookies before redirecting. Preserve
    // those writes so the browser does not loop with an outdated session.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    redirect.headers.set("Cache-Control", "private, no-store");
    return redirect;
  }

  return response;
}
