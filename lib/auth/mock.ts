import { cookies } from "next/headers";
import type { Profile, Session, UserRole } from "@/types";
import {
  createProfile,
  getProfileByEmail,
  getProfileById,
  logActivity,
  updateProfileRole,
} from "@/lib/data/repository";
import { isAdminEmail } from "./admin-emails";

/**
 * Mock auth for V1.
 *
 * Stores the current profile id in a cookie. There are no passwords —
 * if you "log in" with an email that exists, you become that profile;
 * if it doesn't exist, signup creates one.
 *
 * This is INTENTIONALLY insecure. The whole point is to let us click
 * through the entire product flow without standing up Supabase. The
 * real Supabase Auth integration drops in here in Batch 2.
 */

const COOKIE_NAME = "ecrn_session";
const COOKIE_OPTIONS = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  path: "/",
  // 30 days
  maxAge: 60 * 60 * 24 * 30,
};

export async function getCurrentSession(): Promise<Session | null> {
  const profileId = cookies().get(COOKIE_NAME)?.value;
  if (!profileId) return null;
  const profile = await getProfileById(profileId);
  return profile ? { profile } : null;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const session = await getCurrentSession();
  return session?.profile ?? null;
}

export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  return profile;
}

interface SignupInput {
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  // role is set later in the onboarding step
}

/** Create a profile and start a session for them. */
export async function signupAndStartSession(input: SignupInput): Promise<Profile> {
  const existing = await getProfileByEmail(input.email);
  if (existing) {
    // Treat duplicate signup as login for V1 simplicity
    setSessionCookie(existing.id);
    return existing;
  }

  // Auto-promote admins from the allowlist
  const role: UserRole = isAdminEmail(input.email) ? "admin" : "referral_partner";

  const profile = await createProfile({
    authUserId: null,
    role,
    firstName: input.firstName ?? null,
    lastName: input.lastName ?? null,
    email: input.email,
    phone: input.phone ?? null,
    locationCity: null,
    locationState: null,
    linkedinUrl: null,
    companyName: null,
    externalCrmId: null,
  });

  await logActivity({
    actorUserId: profile.id,
    entityType: "profile",
    entityId: profile.id,
    action: "created",
    metadata: { source: "signup" },
  });

  setSessionCookie(profile.id);
  return profile;
}

/** Log in with an email — V1 is passwordless / no validation. */
export async function loginAndStartSession(email: string): Promise<Profile | null> {
  const profile = await getProfileByEmail(email);
  if (!profile) return null;
  setSessionCookie(profile.id);
  await logActivity({
    actorUserId: profile.id,
    entityType: "profile",
    entityId: profile.id,
    action: "logged_in",
  });
  return profile;
}

export async function logout(): Promise<void> {
  cookies().delete(COOKIE_NAME);
}

export async function setRole(profileId: string, role: UserRole): Promise<Profile> {
  const profile = await updateProfileRole(profileId, role);
  await logActivity({
    actorUserId: profile.id,
    entityType: "profile",
    entityId: profile.id,
    action: "role_set",
    metadata: { role },
  });
  return profile;
}

function setSessionCookie(profileId: string): void {
  cookies().set(COOKIE_NAME, profileId, COOKIE_OPTIONS);
}
