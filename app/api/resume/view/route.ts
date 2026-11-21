import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Open a member's own file from a normal link, including in iOS WebViews. */
export async function GET(request: Request): Promise<Response> {
  const profile = await getCurrentProfile();
  if (!profile) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", "/profile");
    return NextResponse.redirect(login, { status: 303, headers: { "cache-control": "private, no-store" } });
  }
  if (!profile.resumePath || !profile.resumePath.startsWith(`${profile.id}/`)) {
    return new Response("No resume file is on your profile yet. Go back to Profile to upload one.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "private, no-store" },
    });
  }
  const sb = await createSupabaseServerClient();
  const { data, error } = await sb.storage.from("resumes").createSignedUrl(profile.resumePath, 300);
  if (error || !data?.signedUrl) {
    return new Response("Your resume could not be opened. Go back to Profile and try again.", {
      status: 502,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "private, no-store" },
    });
  }
  return NextResponse.redirect(data.signedUrl, { status: 303, headers: { "cache-control": "private, no-store" } });
}
