import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Invite-link landing route.
 *
 * Format: /r/<referrerProfileId>
 *
 * V1 behavior: store the referring partner's profile id in a long-lived
 * cookie, then send the visitor to /signup. When they create an account,
 * Batch 2.5 (next iteration) will read this cookie and attach them as the
 * referrer's downstream signup.
 *
 * We don't yet attribute downstream referrals — the schema is wired for it,
 * but the attribution logic happens server-side at signup time. The cookie
 * is the queueing primitive.
 */
interface PageProps {
  params: { code: string };
}

export default function InviteRedirect({ params }: PageProps) {
  cookies().set("ecrn_invited_by", params.code, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 days
  });
  redirect("/signup?via=invite");
}
