"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentProfile, homeForRole } from "@/lib/auth/session";
import { setMyRole } from "@/lib/data/repository";

/**
 * Supabase Auth server actions: password sign-up/sign-in, magic link,
 * password reset, onboarding role choice, and the demo-account shortcut.
 *
 * Errors redirect back to the form with ?error=... so pages can show them
 * without client-side state.
 */

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function back(path: string, params: Record<string, string>): never {
  const qs = new URLSearchParams(params).toString();
  redirect(`${path}${qs ? `?${qs}` : ""}`);
}

function safeNext(next: FormDataEntryValue | null): string | null {
  const v = typeof next === "string" ? next : "";
  return v.startsWith("/") && !v.startsWith("//") ? v : null;
}

// ─── Sign up ─────────────────────────────────────────────────────────

const SignupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().trim().min(1, "First name required"),
  lastName: z.string().trim().min(1, "Last name required"),
  phone: z.string().trim().optional(),
  invitedBy: z.string().trim().optional(),
});

export async function signupAction(formData: FormData): Promise<void> {
  const parsed = SignupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone") || undefined,
    invitedBy: formData.get("invitedBy") || undefined,
  });
  const ref = String(formData.get("invitedBy") ?? "");
  if (!parsed.success) {
    back("/signup", { error: parsed.error.errors[0]?.message ?? "Invalid input", ...(ref ? { ref, via: "invite" } : {}) });
  }

  const { email, password, firstName, lastName, phone, invitedBy } = parsed.data;
  const supabase = await createSupabaseServerClient();
  const origin = await siteOrigin();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/onboarding`,
      data: {
        first_name: firstName,
        last_name: lastName,
        phone: phone ?? "",
        invited_by: invitedBy ?? "",
      },
    },
  });

  if (error) back("/signup", { error: error.message, ...(ref ? { ref, via: "invite" } : {}) });

  // Email confirmation on → no session yet.
  if (!data.session) back("/check-email", { email });

  const profile = await getCurrentProfile();
  redirect(profile ? homeForRole(profile.role, profile.onboarded) : "/onboarding");
}

// ─── Password sign-in ────────────────────────────────────────────────

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export async function loginAction(formData: FormData): Promise<void> {
  const next = safeNext(formData.get("next"));
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) back("/login", { error: parsed.error.errors[0]?.message ?? "Invalid input", ...(next ? { next } : {}) });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const msg = /confirm/i.test(error.message)
      ? "Please confirm your email first — check your inbox for the link."
      : "That email and password don't match. Try again or use a login link.";
    back("/login", { error: msg, ...(next ? { next } : {}) });
  }

  const profile = await getCurrentProfile();
  redirect(next ?? (profile ? homeForRole(profile.role, profile.onboarded) : "/dashboard"));
}

// ─── Magic link ──────────────────────────────────────────────────────

export async function magicLinkAction(formData: FormData): Promise<void> {
  const email = z.string().trim().toLowerCase().email().safeParse(formData.get("email"));
  const next = safeNext(formData.get("next"));
  if (!email.success) back("/login", { mode: "link", error: "Enter a valid email" });

  const supabase = await createSupabaseServerClient();
  const origin = await siteOrigin();
  const { error } = await supabase.auth.signInWithOtp({
    email: email.data,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next ?? "/dashboard")}`,
    },
  });

  // Don't reveal whether an account exists.
  if (error && !/signups not allowed|not found/i.test(error.message)) {
    back("/login", { mode: "link", error: error.message });
  }
  back("/check-email", { email: email.data, kind: "link" });
}

// ─── Forgot / reset password ─────────────────────────────────────────

export async function forgotPasswordAction(formData: FormData): Promise<void> {
  const email = z.string().trim().toLowerCase().email().safeParse(formData.get("email"));
  if (!email.success) back("/forgot-password", { error: "Enter a valid email" });

  const supabase = await createSupabaseServerClient();
  const origin = await siteOrigin();
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  });
  back("/check-email", { email: email.data, kind: "reset" });
}

export async function resetPasswordAction(formData: FormData): Promise<void> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) back("/reset-password", { error: "Password must be at least 8 characters" });
  if (password !== confirm) back("/reset-password", { error: "Passwords don't match" });

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) back("/reset-password", { error: error.message });

  const profile = await getCurrentProfile();
  redirect(profile ? homeForRole(profile.role, profile.onboarded) : "/login");
}

// ─── Sign out ────────────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}

// ─── Onboarding role choice ──────────────────────────────────────────

const RoleSchema = z.enum(["referral_partner", "candidate", "company_contact"]);

export async function setRoleAction(formData: FormData): Promise<void> {
  const parsed = RoleSchema.safeParse(formData.get("role"));
  if (!parsed.success) back("/onboarding", { error: "Pick one of the options" });

  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  await setMyRole(parsed.data);
  if (profile.role === "admin") redirect("/admin");

  switch (parsed.data) {
    case "candidate":
      redirect("/candidate?welcome=1");
    case "company_contact":
      redirect("/hire?welcome=1");
    default:
      redirect("/dashboard?welcome=1");
  }
}

// ─── Demo accounts (only when NEXT_PUBLIC_DEMO_MODE=true) ────────────

const DEMO_ACCOUNTS = {
  referral_partner: "partner@demo.goecrn.com",
  candidate: "candidate@demo.goecrn.com",
} as const;

export async function demoLoginAction(formData: FormData): Promise<void> {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") back("/login", { error: "Demo mode is off" });

  const role = String(formData.get("role") ?? "");
  if (role === "admin") {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    back("/login", { next: "/admin" });
  }

  const email = DEMO_ACCOUNTS[role as keyof typeof DEMO_ACCOUNTS];
  const password = process.env.DEMO_ACCOUNT_PASSWORD;
  if (!email) back("/login", { error: "Unknown demo account" });
  if (!password) back("/login", { error: "Demo password isn't configured on the server (DEMO_ACCOUNT_PASSWORD)" });

  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) back("/login", { error: `Demo sign-in failed: ${error.message}` });

  redirect(role === "candidate" ? "/candidate" : "/dashboard");
}
