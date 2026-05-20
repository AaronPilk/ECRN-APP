"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth/mock";
import {
  appendCandidateNote,
  createJob,
  reassignPrimaryReferrer,
  updateApplicationStatus,
  updateCandidateStatus,
  updateCompanyLeadStatus,
  updateJob,
  updateJobStatus,
  updatePayoutStatus,
} from "@/lib/data/repository";
import type {
  ApplicationStatus,
  CompanyLeadStatus,
  JobStatus,
  JobUrgency,
  PayoutStatus,
  ReferralStatus,
} from "@/types";

/**
 * All admin mutations.
 *
 * Every action revalidates the relevant path so the list pages re-fetch
 * after writes (Next.js App Router caches Server Component renders).
 *
 * Authorization: every action checks profile.role === "admin". The
 * AppShell layout already guards the routes, but actions can be invoked
 * directly via fetch so we double-check here.
 */

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile) throw new Error("Not authenticated");
  if (profile.role !== "admin") throw new Error("Admin only");
  return profile;
}

// ─── Candidate mutations ─────────────────────────────────────────

const CandidateStatusSchema = z.object({
  candidateId: z.string().min(1),
  status: z.string().min(1),
  notes: z.string().optional(),
});

export async function updateCandidateStatusAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = CandidateStatusSchema.parse({
    candidateId: formData.get("candidateId"),
    status: formData.get("status"),
    notes: formData.get("notes") ?? "",
  });
  await updateCandidateStatus(
    parsed.candidateId,
    parsed.status as ReferralStatus,
    admin.id,
    parsed.notes
  );
  revalidatePath(`/admin/candidates/${parsed.candidateId}`);
  revalidatePath("/admin/candidates");
  revalidatePath("/admin");
}

const CandidateNoteSchema = z.object({
  candidateId: z.string().min(1),
  note: z.string().min(1, "Add a note first"),
});

export async function appendCandidateNoteAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = CandidateNoteSchema.parse({
    candidateId: formData.get("candidateId"),
    note: formData.get("note"),
  });
  await appendCandidateNote(parsed.candidateId, admin.id, parsed.note);
  revalidatePath(`/admin/candidates/${parsed.candidateId}`);
}

const ReassignSchema = z.object({
  candidateId: z.string().min(1),
  referrerProfileId: z.string().min(1),
});

export async function reassignPrimaryReferrerAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = ReassignSchema.parse({
    candidateId: formData.get("candidateId"),
    referrerProfileId: formData.get("referrerProfileId"),
  });
  await reassignPrimaryReferrer(parsed.candidateId, parsed.referrerProfileId, admin.id);
  revalidatePath(`/admin/candidates/${parsed.candidateId}`);
  revalidatePath("/admin/referrals");
}

// ─── Application mutations ─────────────────────────────────────────

const ApplicationStatusSchema = z.object({
  applicationId: z.string().min(1),
  status: z.string().min(1),
});

export async function updateApplicationStatusAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = ApplicationStatusSchema.parse({
    applicationId: formData.get("applicationId"),
    status: formData.get("status"),
  });
  await updateApplicationStatus(
    parsed.applicationId,
    parsed.status as ApplicationStatus,
    admin.id
  );
  revalidatePath("/admin");
}

// ─── Payout mutations ─────────────────────────────────────────

const PayoutStatusSchema = z.object({
  payoutId: z.string().min(1),
  status: z.string().min(1),
  notes: z.string().optional(),
});

export async function updatePayoutStatusAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = PayoutStatusSchema.parse({
    payoutId: formData.get("payoutId"),
    status: formData.get("status"),
    notes: formData.get("notes") ?? "",
  });
  await updatePayoutStatus(
    parsed.payoutId,
    parsed.status as PayoutStatus,
    admin.id,
    parsed.notes
  );
  revalidatePath("/admin/payouts");
  revalidatePath("/admin");
}

// ─── Job mutations ─────────────────────────────────────────

const JobStatusSchema = z.object({
  jobId: z.string().min(1),
  status: z.string().min(1),
});

export async function updateJobStatusAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = JobStatusSchema.parse({
    jobId: formData.get("jobId"),
    status: formData.get("status"),
  });
  await updateJobStatus(parsed.jobId, parsed.status as JobStatus, admin.id);
  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
}

const JobInputSchema = z.object({
  jobId: z.string().optional(),
  title: z.string().min(1, "Title required"),
  companyName: z.string().optional(),
  isCompanyPublic: z.string().optional(),
  locationCity: z.string().optional(),
  locationState: z.string().optional(),
  jobType: z.string().optional(),
  trade: z.string().optional(),
  description: z.string().optional(),
  requirements: z.string().optional(),
  compensationMin: z.string().optional(),
  compensationMax: z.string().optional(),
  compensationDisplay: z.string().optional(),
  urgency: z.string().optional(),
  status: z.string().optional(),
  isPublic: z.string().optional(),
  referralPayoutAmount: z.string().optional(),
  referralPayoutDisplay: z.string().optional(),
  internalNotes: z.string().optional(),
});

function toNumberOrNull(v: string | undefined): number | null {
  if (!v || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export async function saveJobAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = JobInputSchema.parse(Object.fromEntries(formData.entries()));

  const data = {
    title: parsed.title,
    companyName: parsed.companyName || null,
    isCompanyPublic: parsed.isCompanyPublic === "on",
    locationCity: parsed.locationCity || null,
    locationState: parsed.locationState || null,
    jobType: parsed.jobType || null,
    trade: parsed.trade || null,
    description: parsed.description || null,
    requirements: parsed.requirements || null,
    compensationMin: toNumberOrNull(parsed.compensationMin),
    compensationMax: toNumberOrNull(parsed.compensationMax),
    compensationDisplay: parsed.compensationDisplay || null,
    urgency: (parsed.urgency || "normal") as JobUrgency,
    status: (parsed.status || "draft") as JobStatus,
    isPublic: parsed.isPublic === "on",
    referralPayoutAmount: toNumberOrNull(parsed.referralPayoutAmount),
    referralPayoutDisplay: parsed.referralPayoutDisplay || null,
    internalNotes: parsed.internalNotes || null,
  };

  let jobId = parsed.jobId;
  if (jobId) {
    await updateJob(jobId, data, admin.id);
  } else {
    const created = await createJob(data, admin.id);
    jobId = created.id;
  }
  revalidatePath("/admin/jobs");
  revalidatePath("/jobs");
  redirect(`/admin/jobs?saved=${jobId}`);
}

// ─── Company lead mutations ─────────────────────────────────────────

const CompanyLeadStatusSchema = z.object({
  leadId: z.string().min(1),
  status: z.string().min(1),
  notes: z.string().optional(),
});

export async function updateCompanyLeadStatusAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = CompanyLeadStatusSchema.parse({
    leadId: formData.get("leadId"),
    status: formData.get("status"),
    notes: formData.get("notes") ?? "",
  });
  await updateCompanyLeadStatus(
    parsed.leadId,
    parsed.status as CompanyLeadStatus,
    admin.id,
    parsed.notes
  );
  revalidatePath(`/admin/companies/${parsed.leadId}`);
  revalidatePath("/admin/companies");
  revalidatePath("/admin");
}
