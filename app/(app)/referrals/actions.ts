"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth/session";
import { createReferral } from "@/lib/data/repository";

const ReferralSchema = z.object({
  firstName: z.string().trim().min(1, "First name required"),
  lastName: z.string().trim().min(1, "Last name required"),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  locationCity: z.string().trim().optional(),
  locationState: z.string().trim().optional(),
  currentJobTitle: z.string().trim().optional(),
  trade: z.string().trim().optional(),
  yearsExperience: z.string().trim().optional(),
  linkedinUrl: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  jobId: z.string().trim().optional(),
});

export interface ImportedContact {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  currentJobTitle?: string | null;
  company?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
}

export interface ImportSummary {
  created: number;
  underReview: number;
  skipped: number;
  errors: string[];
}

/**
 * Bulk "refer from my contacts". Each contact goes through the same
 * database duplicate check as a hand-entered referral.
 */
export async function importContactsAction(contacts: ImportedContact[]): Promise<ImportSummary> {
  const profile = await getCurrentProfile();
  if (!profile) return { created: 0, underReview: 0, skipped: 0, errors: ["Please sign in again."] };

  const summary: ImportSummary = { created: 0, underReview: 0, skipped: 0, errors: [] };
  const list = Array.isArray(contacts) ? contacts.slice(0, 200) : [];

  for (const c of list) {
    const first = String(c?.firstName ?? "").trim().slice(0, 100);
    const last = String(c?.lastName ?? "").trim().slice(0, 100);
    const email = String(c?.email ?? "").trim().slice(0, 200);
    const phone = String(c?.phone ?? "").trim().slice(0, 50);
    if (!first || (!email && !phone)) {
      summary.skipped++;
      continue;
    }
    try {
      const r = await createReferral({
        firstName: first,
        lastName: last || "—",
        email: email || null,
        phone: phone || null,
        currentJobTitle: String(c?.currentJobTitle ?? "").trim().slice(0, 200) || null,
        locationCity: String(c?.locationCity ?? "").trim().slice(0, 100) || null,
        locationState: String(c?.locationState ?? "").trim().slice(0, 50) || null,
        notes: c?.company ? `Imported from contacts · ${String(c.company).slice(0, 200)}` : "Imported from contacts",
      });
      if (r.isDuplicate) summary.underReview++;
      else summary.created++;
    } catch (e) {
      summary.errors.push(`${first} ${last}: ${e instanceof Error ? e.message : "failed"}`);
    }
  }

  revalidatePath("/referrals");
  revalidatePath("/dashboard");
  return summary;
}

function fail(message: string, jobId?: string): never {
  const qs = new URLSearchParams({ error: message, ...(jobId ? { jobId } : {}) });
  redirect(`/referrals/new?${qs.toString()}`);
}

export async function submitReferralAction(formData: FormData): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const get = (k: string) => (formData.get(k) as string | null) ?? "";
  const parsed = ReferralSchema.safeParse({
    firstName: get("firstName"),
    lastName: get("lastName"),
    email: get("email"),
    phone: get("phone"),
    locationCity: get("locationCity"),
    locationState: get("locationState"),
    currentJobTitle: get("currentJobTitle"),
    trade: get("trade"),
    yearsExperience: get("yearsExperience"),
    linkedinUrl: get("linkedinUrl"),
    notes: get("notes"),
    jobId: get("jobId"),
  });
  if (!parsed.success) fail(parsed.error.errors[0]?.message ?? "Invalid input", get("jobId"));

  const d = parsed.data;
  if (!d.email && !d.phone) fail("Add an email or phone number so Delta can reach them", d.jobId);

  let result;
  try {
    result = await createReferral(
      {
        firstName: d.firstName,
        lastName: d.lastName,
        email: d.email || null,
        phone: d.phone || null,
        locationCity: d.locationCity || null,
        locationState: d.locationState || null,
        currentJobTitle: d.currentJobTitle || null,
        trade: d.trade || null,
        yearsExperience: d.yearsExperience ? Number(d.yearsExperience) : null,
        linkedinUrl: d.linkedinUrl || null,
        notes: d.notes || null,
      },
      { jobId: d.jobId || null }
    );
  } catch (e) {
    fail(e instanceof Error ? e.message : "Couldn't save that referral", d.jobId);
  }

  revalidatePath("/referrals");
  revalidatePath("/dashboard");
  redirect(`/referrals/${result.referralId}?${result.isDuplicate ? "duplicate=1" : "welcome=1"}`);
}
