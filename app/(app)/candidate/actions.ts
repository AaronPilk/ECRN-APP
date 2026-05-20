"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth/mock";
import { createJobApplication } from "@/lib/data/repository";

const ApplySchema = z.object({
  jobId: z.string().min(1, "Missing job"),
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional(),
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
  currentJobTitle: z.string().optional(),
  trade: z.string().optional(),
  linkedinUrl: z.string().optional(),
  resumeUrl: z.string().optional(),
  notes: z.string().optional(),
});

export async function applyAction(formData: FormData): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");

  const parsed = ApplySchema.safeParse({
    jobId: formData.get("jobId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phone: formData.get("phone") ?? "",
    locationCity: formData.get("locationCity") ?? "",
    locationState: formData.get("locationState") ?? "",
    currentJobTitle: formData.get("currentJobTitle") ?? "",
    trade: formData.get("trade") ?? "",
    linkedinUrl: formData.get("linkedinUrl") ?? "",
    resumeUrl: formData.get("resumeUrl") ?? "",
    notes: formData.get("notes") ?? "",
  });

  if (!parsed.success) {
    throw new Error(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const data = parsed.data;
  const { application } = await createJobApplication({
    jobId: data.jobId,
    applicantUserId: profile.id,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone || null,
    locationCity: data.locationCity || null,
    locationState: data.locationState || null,
    currentJobTitle: data.currentJobTitle || null,
    trade: data.trade || null,
    linkedinUrl: data.linkedinUrl || null,
    resumeUrl: data.resumeUrl || null,
    notes: data.notes || null,
  });

  redirect(`/candidate/applications/${application.id}?welcome=1`);
}
