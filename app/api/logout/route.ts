import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function signOut(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "local" });
  return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
}

export const GET = signOut;
export const POST = signOut;
