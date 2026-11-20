import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Invite-link landing route: /r/<code>
 *
 * Two kinds of link share this route:
 *   - a Delta team member's personal code (/r/SARAH) → /signup?code=SARAH,
 *     which credits that recruiter with the sign-up;
 *   - a member's invite link (/r/<profile id>) → /signup?via=invite&ref=<id>,
 *     which connects the new member to the person who invited them.
 * Anything else just goes to the normal sign-up screen.
 *
 * Why a URL param instead of a cookie: Server Components can't write
 * cookies during render. We could write the cookie inside a route
 * handler, but a URL param works without any extra layer and is
 * arguably more transparent.
 */
interface PageProps {
  params: Promise<{ code: string }>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STAFF_CODE_RE = /^[A-Za-z0-9]{3,24}$/;

const staffSignup = (code: string) => `/signup?code=${encodeURIComponent(code.toUpperCase())}`;
const memberSignup = (profileId: string) => `/signup?via=invite&ref=${encodeURIComponent(profileId)}`;

async function destinationFor(code: string): Promise<string> {
  if (!code) return "/signup";
  try {
    const sb = await createSupabaseServerClient();
    const { data, error } = await sb.rpc("resolve_invite_code", { p_code: code });
    if (!error) {
      const invite = data as { kind?: string; code?: string } | null;
      if (invite?.kind === "staff") return staffSignup(String(invite.code ?? code));
      if (invite?.kind === "member") return memberSignup(String(invite.code ?? code));
      return "/signup";
    }
  } catch {
    // fall through
  }
  // The lookup itself failed (not "unknown code"): keep the invite so the
  // sign-up screen can check it again instead of silently dropping the credit.
  if (UUID_RE.test(code)) return memberSignup(code);
  if (STAFF_CODE_RE.test(code)) return staffSignup(code);
  return "/signup";
}

export default async function InviteRedirect(props: PageProps) {
  const params = await props.params;
  let code = params.code ?? "";
  try {
    code = decodeURIComponent(code);
  } catch {
    // keep the raw value
  }
  redirect(await destinationFor(code.trim()));
}
