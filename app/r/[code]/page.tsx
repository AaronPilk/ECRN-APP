import { redirect } from "next/navigation";

/**
 * Invite-link landing route — /r/<referrerProfileId>
 *
 * V1 behavior: forward the visitor to /signup with the referrer ID
 * encoded as a search param. The signup action reads it and attaches
 * the new profile back to the original referrer.
 *
 * Why a URL param instead of a cookie: Server Components can't write
 * cookies during render. We could write the cookie inside a route
 * handler, but a URL param works without any extra layer and is
 * arguably more transparent.
 */
interface PageProps {
  params: Promise<{ code: string }>;
}

export default async function InviteRedirect(props: PageProps) {
  const params = await props.params;
  redirect(`/signup?via=invite&ref=${encodeURIComponent(params.code)}`);
}
