"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth/session";
import { createJobApplication, updateMyProfile } from "@/lib/data/repository";

const ApplySchema = z.object({
  jobId: z.string().uuid("Missing job"),
  firstName: z.string().trim().min(1, "First name required"),
  lastName: z.string().trim().min(1, "Last name required"),
  phone: z.string().trim().optional(),
  locationCity: z.string().trim().optional(),
  locationState: z.string().trim().optional(),
  currentJobTitle: z.string().trim().optional(),
  trade: z.string().trim().optional(),
  linkedinUrl: z.string().trim().optional(),
  resumeUrl: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function applyAction(formData: FormData): Promise<void> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const get = (k: string) => (formData.get(k) as string | null) ?? "";
  const parsed = ApplySchema.safeParse({
    jobId: get("jobId"),
    firstName: get("firstName"),
    lastName: get("lastName"),
    phone: get("phone"),
    locationCity: get("locationCity"),
    locationState: get("locationState"),
    currentJobTitle: get("currentJobTitle"),
    trade: get("trade"),
    linkedinUrl: get("linkedinUrl"),
    resumeUrl: get("resumeUrl"),
    notes: get("notes"),
  });
  const jobId = get("jobId");
  if (!parsed.success) {
    redirect(`/candidate/apply?jobId=${jobId}&error=${encodeURIComponent(parsed.error.errors[0]?.message ?? "Invalid input")}`);
  }
  const d = parsed.data;

  let result;
  try {
    result = await createJobApplication({
      jobId: d.jobId,
      firstName: d.firstName,
      lastName: d.lastName,
      phone: d.phone || null,
      locationCity: d.locationCity || null,
      locationState: d.locationState || null,
      currentJobTitle: d.currentJobTitle || null,
      trade: d.trade || null,
      linkedinUrl: d.linkedinUrl || null,
      resumeUrl: d.resumeUrl || null,
      notes: d.notes || null,
    });
  } catch (e) {
    redirect(`/candidate/apply?jobId=${jobId}&error=${encodeURIComponent(e instanceof Error ? e.message : "Couldn't submit your application")}`);
  }

  // Keep their profile current with what they just told us.
  await updateMyProfile(profile.id, {
    firstName: d.firstName,
    lastName: d.lastName,
    phone: d.phone || profile.phone,
    locationCity: d.locationCity || profile.locationCity,
    locationState: d.locationState || profile.locationState,
    linkedinUrl: d.linkedinUrl || profile.linkedinUrl,
  }).catch(() => {});

  revalidatePath("/candidate/applications");
  redirect(`/candidate/applications/${result.applicationId}?welcome=1`);
}
