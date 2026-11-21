"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentProfile } from "@/lib/auth/session";
import {
  appendCandidateNote,
  createJob,
  logActivity,
  reassignPrimaryReferrer,
  updateApplicationStatus,
  updateCandidateStatus,
  updateCompanyLeadStatus,
  updateJob,
  updateJobStatus,
  updatePayoutStatus,
} from "@/lib/data/repository";
import {
  getJobOwnership,
  setJobExternalCrmId,
  setJobOwnership,
  type JobOwnershipChange,
} from "@/lib/admin/jobs";
import { listStaff } from "@/lib/admin/staff";
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
  candidateId: z.string().uuid(),
  status: z.enum(["submitted", "duplicate_review", "new", "contacted", "qualified", "not_qualified", "submitted_to_job", "interviewing", "offer_stage", "placed", "payout_pending", "payout_approved", "payout_paid", "rejected", "inactive"]),
  notes: z.string().max(10000, "Keep the note under 10000 characters").optional(),
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
  candidateId: z.string().uuid(),
  note: z.string().trim().min(1, "Add a note first").max(10000),
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
  candidateId: z.string().uuid(),
  referrerProfileId: z.string().uuid(),
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
  applicationId: z.string().uuid(),
  status: z.enum(["submitted", "reviewing", "interviewing", "offer", "hired", "rejected", "withdrawn"]),
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
  revalidatePath("/admin/applications");
  revalidatePath(`/candidate/applications/${parsed.applicationId}`);
  revalidatePath("/candidate/applications");
  revalidatePath("/admin");
}

// ─── Payout mutations ─────────────────────────────────────────

const PayoutStatusSchema = z.object({
  payoutId: z.string().uuid(),
  status: z.enum(["pending", "approved", "paid", "denied", "disputed"]),
  notes: z.string().optional(),
  amountDollars: z.string().optional(),
});

export async function updatePayoutStatusAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = PayoutStatusSchema.parse({
    payoutId: formData.get("payoutId"),
    status: formData.get("status"),
    notes: formData.get("notes") ?? "",
    amountDollars: formData.get("amountDollars") ?? "",
  });
  const dollars = parsed.amountDollars ? Number(parsed.amountDollars.replace(/[$,]/g, "")) : NaN;
  await updatePayoutStatus(parsed.payoutId, parsed.status as PayoutStatus, admin.id, {
    notes: parsed.notes,
    amountCents: Number.isFinite(dollars) ? Math.round(dollars * 100) : null,
  });
  revalidatePath("/admin/payouts");
  revalidatePath("/admin");
}

// ─── Job mutations ─────────────────────────────────────────

const JobStatusSchema = z.object({
  jobId: z.string().uuid(),
  status: z.enum(["draft", "open", "paused", "filled", "archived"]),
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
  revalidatePath(`/jobs/${parsed.jobId}`);
  revalidatePath("/dashboard");
}

const JobInputSchema = z.object({
  jobId: z.union([z.literal(""), z.string().uuid()]).optional(),
  title: z.string().trim().min(1, "Title required").max(300),
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
  urgency: z.enum(["low", "normal", "high", "critical"]).optional(),
  status: z.enum(["draft", "open", "paused", "filled", "archived"]).optional(),
  isPublic: z.string().optional(),
  referralPayoutAmount: z.string().optional(),
  referralPayoutDisplay: z.string().optional(),
  internalNotes: z.string().optional(),
  // Ownership (0008). Recruiters arrive as repeated "recruiterIds" fields.
  accountManagerId: z.string().optional(),
  externalCrmId: z.string().optional(),
});

function toNumberOrNull(v: string | undefined): number | null {
  if (!v || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Record a change of job owner so it shows in the activity feed ("assigned to
 * Dana Reyes"). A recruiter-only change is covered by the job's "updated" entry.
 */
async function logJobOwnership(
  jobId: string,
  actorId: string,
  change: JobOwnershipChange,
  accountManagerId: string | null,
  recruiterIds: string[]
): Promise<void> {
  if (!change.ownerChanged) return;
  await logActivity({
    actorUserId: actorId,
    entityType: "job",
    entityId: jobId,
    action: "assigned",
    metadata: {
      account_manager_id: accountManagerId,
      previous_account_manager_id: change.previous.accountManagerId,
      recruiter_ids: recruiterIds,
    },
  });
}

export async function saveJobAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = JobInputSchema.parse(Object.fromEntries(formData.entries()));
  const payoutDollars = toNumberOrNull(parsed.referralPayoutAmount?.replace(/[$,]/g, ""));
  const payoutCents = payoutDollars != null ? Math.round(payoutDollars * 100) : null;

  // Ownership: only ids that belong to the team are accepted.
  const staffById = new Map((await listStaff()).map((s) => [s.id, s]));
  const accountManagerId =
    parsed.accountManagerId && staffById.has(parsed.accountManagerId) ? parsed.accountManagerId : null;
  const recruiterIds = [
    ...new Set(
      formData
        .getAll("recruiterIds")
        .map((v) => String(v))
        .filter((id) => staffById.has(id))
    ),
  ];
  const externalCrmId = (parsed.externalCrmId ?? "").trim().slice(0, 64) || null;

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
    // Form collects dollars; DB stores cents.
    referralPayoutAmount: payoutCents,
    referralPayoutDisplay:
      parsed.referralPayoutDisplay ||
      (payoutCents != null ? `$${(payoutCents / 100).toLocaleString("en-US")}` : null),
    internalNotes: parsed.internalNotes || null,
  };

  let jobId = parsed.jobId;
  if (jobId) {
    // updateJob writes job_private before the public row, including cleared fields.
    await updateJob(jobId, data, admin.id);
  } else {
    const created = await createJob(data, admin.id);
    jobId = created.id;
  }

  // The job itself is saved; a problem with ownership should not lose that.
  let ownershipError: string | null = null;
  try {
    const change = await setJobOwnership(jobId, accountManagerId, recruiterIds);
    await setJobExternalCrmId(jobId, externalCrmId);
    await logJobOwnership(jobId, admin.id, change, accountManagerId, recruiterIds);
  } catch (e) {
    console.error("[ECRN] saveJobAction ownership failed:", e instanceof Error ? e.message : e);
    ownershipError = "The job was saved, but its owner, recruiters or Bullhorn ID could not be saved. Please try again.";
  }

  revalidatePath("/admin/jobs");
  revalidatePath("/admin/routing");
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/dashboard");
  if (ownershipError) {
    redirect(`/admin/jobs/${jobId}/edit?error=${encodeURIComponent(ownershipError)}`);
  }
  redirect(`/admin/jobs?saved=${jobId}`);
}

const JobOwnerSchema = z.object({
  jobId: z.string().uuid(),
  accountManagerId: z.string().uuid(),
});

/** Quick assign from the jobs list: give a job an owner without opening the form. */
export async function setJobOwnerAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const parsed = JobOwnerSchema.safeParse({
    jobId: formData.get("jobId"),
    accountManagerId: formData.get("accountManagerId"),
  });
  // Nothing picked: leave the job as it is.
  if (!parsed.success) return;
  const { jobId, accountManagerId } = parsed.data;

  const staff = await listStaff();
  if (!staff.some((s) => s.id === accountManagerId)) return;

  // Keep the recruiters already working the job; only the owner changes.
  const { recruiterIds } = await getJobOwnership(jobId);
  const change = await setJobOwnership(jobId, accountManagerId, recruiterIds);
  await logJobOwnership(jobId, admin.id, change, accountManagerId, recruiterIds);

  revalidatePath("/admin/jobs");
  revalidatePath("/admin/routing");
}

// ─── Company lead mutations ─────────────────────────────────────────

const CompanyLeadStatusSchema = z.object({
  leadId: z.string().uuid(),
  status: z.enum(["new", "contacted", "qualified", "engaged", "won", "lost", "archived"]),
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
