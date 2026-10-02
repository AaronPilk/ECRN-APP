import { redirect } from "next/navigation";
import { getCurrentProfile, homeForRole } from "@/lib/auth/session";

/** App launch route: signed in → your home screen, otherwise → login. */
export default async function StartPage() {
  const profile = await getCurrentProfile();
  redirect(profile ? homeForRole(profile.role, profile.onboarded) : "/login");
}
