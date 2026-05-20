"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth/mock";
import { createReferral } from "@/lib/data/repository";

const ReferralSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
  currentJobTitle: z.string().optional(),
  trade: z.string().optional(),
  yearsExperience: z
    .union([z.string(), z.number()])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : Number(v))),
  linkedinUrl: z.string().optional(),
  notes: z.string().optional(),
  jobId: z.string().optional(),
});

export async function submitReferralAction(formData: FormData): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const parsed = ReferralSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email") ?? "",
    phone: formData.get("phone") ?? "",
    locationCity: formData.get("locationCity") ?? "",
    locationState: formData.get("locationState") ?? "",
    currentJobTitle: formData.get("currentJobTitle") ?? "",
    trade: formData.get("trade") ?? "",
    yearsExperience: formData.get("yearsExperience") ?? "",
    linkedinUrl: formData.get("linkedinUrl") ?? "",
    notes: formData.get("notes") ?? "",
    jobId: formData.get("jobId") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const data = parsed.data;
  const result = await createReferral(
    {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || null,
      phone: data.phone || null,
      locationCity: data.locationCity || null,
      locationState: data.locationState || null,
      currentJobTitle: data.currentJobTitle || null,
      trade: data.trade || null,
      yearsExperience: typeof data.yearsExperience === "number" ? data.yearsExperience : null,
      linkedinUrl: data.linkedinUrl || null,
      notes: data.notes || null,
    },
    profile.id,
    { jobId: data.jobId || null }
  );

  if (result.duplicateOf) {
    redirect(`/referrals/${result.referral.id}?duplicate=1`);
  }
  redirect(`/referrals/${result.referral.id}?welcome=1`);
}
