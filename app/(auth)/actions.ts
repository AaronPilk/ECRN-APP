"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import {
  loginAndStartSession,
  logout as mockLogout,
  signupAndStartSession,
  setRole,
} from "@/lib/auth/mock";
import { isAdminEmail } from "@/lib/auth/admin-emails";
import type { UserRole } from "@/types";

/**
 * V1 server actions for the auth shell. They write to the mock store via
 * lib/auth/mock.ts. When Supabase Auth lands in Batch 2, these actions
 * stay the same — only the helpers inside lib/auth/ change.
 *
 * Note: server actions used directly in <form action={...}> must return
 * void (or Promise<void>). For V1 we redirect on success and throw on
 * failure — the throw renders Next's default error UI. Batch 2 will swap
 * these for `useFormState` so we can show inline validation errors.
 */

const SignupSchema = z.object({
  email: z.string().email("Enter a valid email"),
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  phone: z.string().optional(),
});

export async function signupAction(formData: FormData): Promise<void> {
  const parsed = SignupSchema.safeParse({
    email: formData.get("email"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const profile = await signupAndStartSession(parsed.data);

  // Admin allowlist short-circuits the role-selector — straight to admin.
  if (isAdminEmail(profile.email)) {
    redirect("/admin");
  }
  redirect("/onboarding");
}

const LoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export async function loginAction(formData: FormData): Promise<void> {
  const parsed = LoginSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Invalid email");
  }
  const profile = await loginAndStartSession(parsed.data.email);
  if (!profile) {
    throw new Error("No account found for that email. Try signing up.");
  }

  switch (profile.role) {
    case "admin":
      redirect("/admin");
    case "candidate":
      redirect("/candidate");
    case "referral_partner":
    case "company_contact":
    default:
      redirect("/dashboard");
  }
}

export async function logoutAction(): Promise<void> {
  await mockLogout();
  redirect("/");
}

/**
 * V1-only convenience: one-click login as a demo profile.
 *
 * Used by the "Demo accounts" panel on /login to swap between Admin /
 * Referral Partner / Candidate views during dev without re-signing-up.
 * Disabled automatically once Supabase is wired up.
 */
const DemoSchema = z.object({
  role: z.enum(["admin", "referral_partner", "candidate"]),
});

const DEMO_EMAILS: Record<"admin" | "referral_partner" | "candidate", string> = {
  admin: "aaron@skyway.media",
  referral_partner: "partner@demo.ecrn",
  candidate: "candidate@demo.ecrn",
};

export async function demoLoginAction(formData: FormData): Promise<void> {
  const parsed = DemoSchema.safeParse({ role: formData.get("role") });
  if (!parsed.success) throw new Error("Invalid demo role");
  const email = DEMO_EMAILS[parsed.data.role];
  const profile = await loginAndStartSession(email);
  if (!profile) throw new Error(`Demo profile not found: ${email}`);

  switch (profile.role) {
    case "admin":
      redirect("/admin");
    case "candidate":
      redirect("/candidate");
    case "referral_partner":
    case "company_contact":
    default:
      redirect("/dashboard");
  }
}

const RoleSchema = z.object({
  profileId: z.string().min(1),
  role: z.enum(["admin", "referral_partner", "candidate", "company_contact"]),
});

export async function setRoleAction(formData: FormData): Promise<void> {
  const parsed = RoleSchema.safeParse({
    profileId: formData.get("profileId"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    throw new Error("Invalid role selection");
  }
  const profile = await setRole(parsed.data.profileId, parsed.data.role as UserRole);
  switch (profile.role) {
    case "candidate":
      redirect("/candidate?welcome=1");
    case "company_contact":
      redirect("/hire?welcome=1");
    case "admin":
      redirect("/admin?welcome=1");
    case "referral_partner":
    default:
      redirect("/dashboard?welcome=1");
  }
}
