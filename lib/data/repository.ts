import type {
  ActivityLog,
  ApplicationStatus,
  Candidate,
  CandidateSource,
  CompanyLead,
  Job,
  JobApplication,
  JobReferral,
  Payout,
  PayoutStatus,
  Profile,
  Referral,
  ReferralStatus,
  UserRole,
} from "@/types";
import { db, generateId, nowIso } from "./mock-store";
import { findDuplicate } from "@/lib/utils/duplicate-detection";

/**
 * The single data access layer for ECRN.
 *
 * Every page/route reads and writes through these functions. In V1 the
 * implementation is the in-memory mock store; in Batch 2+ we'll add a
 * Supabase-backed variant and choose at boot time via env vars.
 *
 * Keep this interface stable — when we swap to Supabase, only this file
 * changes.
 */

// ─────────────────────────────────────────────────────────────────────
// Profiles
// ─────────────────────────────────────────────────────────────────────

export async function getProfileByEmail(email: string): Promise<Profile | null> {
  const e = email.toLowerCase().trim();
  return db.profiles.find((p) => p.email.toLowerCase() === e) ?? null;
}

export async function getProfileById(id: string): Promise<Profile | null> {
  return db.profiles.find((p) => p.id === id) ?? null;
}

export async function createProfile(
  input: Omit<Profile, "id" | "createdAt" | "updatedAt" | "metadata" | "isActive"> & {
    metadata?: Record<string, unknown>;
  }
): Promise<Profile> {
  const profile: Profile = {
    id: generateId("p"),
    isActive: true,
    metadata: input.metadata ?? {},
    createdAt: nowIso(),
    updatedAt: nowIso(),
    ...input,
  };
  db.profiles.push(profile);
  return profile;
}

export async function updateProfileRole(id: string, role: UserRole): Promise<Profile> {
  const p = db.profiles.find((p) => p.id === id);
  if (!p) throw new Error(`Profile ${id} not found`);
  p.role = role;
  p.updatedAt = nowIso();
  return p;
}

// ─────────────────────────────────────────────────────────────────────
// Jobs
// ─────────────────────────────────────────────────────────────────────

export async function listPublicJobs(): Promise<Job[]> {
  return db.jobs
    .filter((j) => j.isPublic && (j.status === "open" || j.status === "paused"))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getJobById(id: string): Promise<Job | null> {
  return db.jobs.find((j) => j.id === id) ?? null;
}

export async function listAllJobs(): Promise<Job[]> {
  return [...db.jobs].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

// ─────────────────────────────────────────────────────────────────────
// Candidates
// ─────────────────────────────────────────────────────────────────────

export async function listCandidates(): Promise<Candidate[]> {
  return [...db.candidates];
}

export async function getCandidateById(id: string): Promise<Candidate | null> {
  return db.candidates.find((c) => c.id === id) ?? null;
}

// ─────────────────────────────────────────────────────────────────────
// Referrals — the heart of Batch 2
// ─────────────────────────────────────────────────────────────────────

export interface CreateReferralInput {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
  currentJobTitle?: string | null;
  trade?: string | null;
  yearsExperience?: number | null;
  linkedinUrl?: string | null;
  resumeUrl?: string | null;
  notes?: string | null;
}

export interface CreateReferralResult {
  referral: Referral;
  candidate: Candidate;
  duplicateOf: Candidate | null;
  duplicateReason?: string;
}

/**
 * Create a referral.
 *
 * Logic:
 *   1. Check for an existing candidate matching by email / phone / linkedin
 *      / name+location.
 *   2. If a match exists, attach this referral as a "duplicate_review"
 *      attempt on the existing candidate. The original referrer stays
 *      primary; admin can review later.
 *   3. If no match, create a new candidate with this user as the primary
 *      referrer, and a primary referral row.
 */
export async function createReferral(
  input: CreateReferralInput,
  referrerUserId: string,
  options: { jobId?: string | null } = {}
): Promise<CreateReferralResult> {
  const duplicate = findDuplicate(input, db.candidates);

  let candidate: Candidate;
  let referral: Referral;

  if (duplicate) {
    candidate = duplicate.candidate;
    referral = {
      id: generateId("r"),
      candidateId: candidate.id,
      referrerUserId,
      referralSource: options.jobId ? "job_link" : "manual",
      status: "duplicate_review",
      isPrimary: false,
      duplicateStatus: "pending_review",
      notes: input.notes ?? null,
      metadata: { duplicateReason: duplicate.reason },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.referrals.push(referral);
  } else {
    candidate = {
      id: generateId("c"),
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email?.trim() ?? null,
      phone: input.phone?.trim() ?? null,
      locationCity: input.locationCity?.trim() ?? null,
      locationState: input.locationState?.trim() ?? null,
      currentJobTitle: input.currentJobTitle?.trim() ?? null,
      trade: input.trade?.trim() ?? null,
      yearsExperience: input.yearsExperience ?? null,
      linkedinUrl: input.linkedinUrl?.trim() ?? null,
      resumeUrl: input.resumeUrl?.trim() ?? null,
      notes: input.notes ?? null,
      sourceType: "referred" as CandidateSource,
      primaryReferrerUserId: referrerUserId,
      duplicateOfCandidateId: null,
      status: "new" as ReferralStatus,
      externalCrmId: null,
      metadata: {},
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.candidates.push(candidate);

    referral = {
      id: generateId("r"),
      candidateId: candidate.id,
      referrerUserId,
      referralSource: options.jobId ? "job_link" : "manual",
      status: "new",
      isPrimary: true,
      duplicateStatus: "unique",
      notes: input.notes ?? null,
      metadata: {},
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.referrals.push(referral);
  }

  // If submitted in the context of a specific job, also create a job_referral row.
  if (options.jobId) {
    const jobReferral: JobReferral = {
      id: generateId("jr"),
      jobId: options.jobId,
      candidateId: candidate.id,
      referrerUserId,
      status: duplicate ? "duplicate_review" : "submitted_to_job",
      notes: input.notes ?? null,
      metadata: {},
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.jobReferrals.push(jobReferral);
  }

  await logActivity({
    actorUserId: referrerUserId,
    entityType: "referral",
    entityId: referral.id,
    action: duplicate ? "duplicate_detected" : "created",
    metadata: {
      candidateId: candidate.id,
      jobId: options.jobId ?? null,
      duplicateReason: duplicate?.reason ?? null,
    },
  });

  return {
    referral,
    candidate,
    duplicateOf: duplicate?.candidate ?? null,
    duplicateReason: duplicate?.reason,
  };
}

export async function listReferralsByReferrer(referrerUserId: string): Promise<Referral[]> {
  return db.referrals
    .filter((r) => r.referrerUserId === referrerUserId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export interface ReferralWithCandidate {
  referral: Referral;
  candidate: Candidate;
}

export async function listReferralsByReferrerEnriched(
  referrerUserId: string
): Promise<ReferralWithCandidate[]> {
  const rows = await listReferralsByReferrer(referrerUserId);
  const enriched: ReferralWithCandidate[] = [];
  for (const r of rows) {
    const c = await getCandidateById(r.candidateId);
    if (c) enriched.push({ referral: r, candidate: c });
  }
  return enriched;
}

export async function getReferralById(id: string): Promise<Referral | null> {
  return db.referrals.find((r) => r.id === id) ?? null;
}

export async function getReferralWithCandidate(
  id: string
): Promise<ReferralWithCandidate | null> {
  const referral = await getReferralById(id);
  if (!referral) return null;
  const candidate = await getCandidateById(referral.candidateId);
  if (!candidate) return null;
  return { referral, candidate };
}

export async function listJobReferralsByReferrer(referrerUserId: string): Promise<JobReferral[]> {
  return db.jobReferrals.filter((r) => r.referrerUserId === referrerUserId);
}

export async function listJobReferralsByCandidate(candidateId: string): Promise<JobReferral[]> {
  return db.jobReferrals.filter((r) => r.candidateId === candidateId);
}

// ─────────────────────────────────────────────────────────────────────
// Applications
// ─────────────────────────────────────────────────────────────────────

export interface CreateApplicationInput {
  jobId: string;
  applicantUserId: string;
  resumeUrl?: string | null;
  linkedinUrl?: string | null;
  notes?: string | null;
  // Candidate info if the applicant doesn't have a candidate row yet
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
  currentJobTitle?: string | null;
  trade?: string | null;
}

export async function createJobApplication(
  input: CreateApplicationInput
): Promise<{ application: JobApplication; candidate: Candidate }> {
  // Get or create a candidate row tied to this applicant's profile
  const applicant = await getProfileById(input.applicantUserId);
  if (!applicant) throw new Error("Applicant profile not found");

  // See if a candidate already exists for this person (by email, primarily)
  const email = applicant.email;
  let candidate =
    db.candidates.find((c) => c.email?.toLowerCase() === email.toLowerCase()) ?? null;

  if (!candidate) {
    candidate = {
      id: generateId("c"),
      firstName: input.firstName ?? applicant.firstName ?? "Candidate",
      lastName: input.lastName ?? applicant.lastName ?? "",
      email,
      phone: input.phone ?? applicant.phone ?? null,
      locationCity: input.locationCity ?? applicant.locationCity ?? null,
      locationState: input.locationState ?? applicant.locationState ?? null,
      currentJobTitle: input.currentJobTitle ?? null,
      trade: input.trade ?? null,
      yearsExperience: null,
      linkedinUrl: input.linkedinUrl ?? applicant.linkedinUrl ?? null,
      resumeUrl: input.resumeUrl ?? null,
      notes: input.notes ?? null,
      sourceType: "direct_application",
      primaryReferrerUserId: null,
      duplicateOfCandidateId: null,
      status: "new",
      externalCrmId: null,
      metadata: {},
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.candidates.push(candidate);
  }

  const application: JobApplication = {
    id: generateId("ja"),
    jobId: input.jobId,
    candidateId: candidate.id,
    applicantUserId: input.applicantUserId,
    status: "submitted",
    resumeUrl: input.resumeUrl ?? null,
    linkedinUrl: input.linkedinUrl ?? applicant.linkedinUrl ?? null,
    notes: input.notes ?? null,
    metadata: {},
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.jobApplications.push(application);

  await logActivity({
    actorUserId: input.applicantUserId,
    entityType: "job_application",
    entityId: application.id,
    action: "submitted",
    metadata: { jobId: input.jobId, candidateId: candidate.id },
  });

  return { application, candidate };
}

export async function listApplicationsByApplicant(
  applicantUserId: string
): Promise<JobApplication[]> {
  return db.jobApplications
    .filter((a) => a.applicantUserId === applicantUserId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export interface ApplicationWithJob {
  application: JobApplication;
  job: Job;
}

export async function listApplicationsByApplicantEnriched(
  applicantUserId: string
): Promise<ApplicationWithJob[]> {
  const apps = await listApplicationsByApplicant(applicantUserId);
  const out: ApplicationWithJob[] = [];
  for (const a of apps) {
    const j = await getJobById(a.jobId);
    if (j) out.push({ application: a, job: j });
  }
  return out;
}

export async function getApplicationById(id: string): Promise<JobApplication | null> {
  return db.jobApplications.find((a) => a.id === id) ?? null;
}

// ─────────────────────────────────────────────────────────────────────
// Payouts
// ─────────────────────────────────────────────────────────────────────

export async function listPayoutsByReferrer(referrerUserId: string): Promise<Payout[]> {
  return db.payouts
    .filter((p) => p.referrerUserId === referrerUserId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export interface PayoutEnriched {
  payout: Payout;
  candidate: Candidate | null;
  job: Job | null;
}

export async function listPayoutsByReferrerEnriched(
  referrerUserId: string
): Promise<PayoutEnriched[]> {
  const payouts = await listPayoutsByReferrer(referrerUserId);
  const out: PayoutEnriched[] = [];
  for (const p of payouts) {
    const candidate = await getCandidateById(p.candidateId);
    const job = p.jobId ? await getJobById(p.jobId) : null;
    out.push({ payout: p, candidate, job });
  }
  return out;
}

// ─────────────────────────────────────────────────────────────────────
// Company leads
// ─────────────────────────────────────────────────────────────────────

export async function createCompanyLead(
  input: Omit<CompanyLead, "id" | "createdAt" | "updatedAt" | "metadata" | "status"> & {
    metadata?: Record<string, unknown>;
  }
): Promise<CompanyLead> {
  const lead: CompanyLead = {
    id: generateId("cl"),
    status: "new",
    metadata: input.metadata ?? {},
    createdAt: nowIso(),
    updatedAt: nowIso(),
    ...input,
  };
  db.companyLeads.push(lead);
  return lead;
}

export async function listCompanyLeads(): Promise<CompanyLead[]> {
  return [...db.companyLeads].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

// ─────────────────────────────────────────────────────────────────────
// Activity log
// ─────────────────────────────────────────────────────────────────────

export async function logActivity(
  input: Omit<ActivityLog, "id" | "createdAt" | "metadata"> & {
    metadata?: Record<string, unknown>;
  }
): Promise<ActivityLog> {
  const log: ActivityLog = {
    id: generateId("al"),
    createdAt: nowIso(),
    metadata: input.metadata ?? {},
    ...input,
  };
  db.activityLogs.push(log);
  return log;
}

export async function listActivityForEntity(
  entityType: string,
  entityId: string
): Promise<ActivityLog[]> {
  return db.activityLogs
    .filter((l) => l.entityType === entityType && l.entityId === entityId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
}

// ─────────────────────────────────────────────────────────────────────
// Dashboard aggregates
// ─────────────────────────────────────────────────────────────────────

export interface ReferralPartnerDashboardStats {
  totalReferrals: number;
  activeReferrals: number;
  inProcess: number;
  placements: number;
  estimatedEarningsCents: number;
  paidEarningsCents: number;
  openJobsCount: number;
}

export async function getReferralPartnerDashboardStats(
  profileId: string
): Promise<ReferralPartnerDashboardStats> {
  const referrals = await listReferralsByReferrer(profileId);
  const payouts = await listPayoutsByReferrer(profileId);
  const openJobs = await listPublicJobs();

  // For aggregation, look at the underlying candidate's status since that's
  // what drives the pipeline. Referral.status is the row-level pin; the
  // candidate.status is the canonical lifecycle state.
  const candidateStatuses: ReferralStatus[] = [];
  for (const r of referrals) {
    const c = await getCandidateById(r.candidateId);
    if (c) candidateStatuses.push(c.status);
  }

  const active = candidateStatuses.filter(
    (s) => s !== "rejected" && s !== "inactive" && s !== "not_qualified"
  ).length;

  const inProcess = candidateStatuses.filter((s) =>
    ["contacted", "qualified", "submitted_to_job", "interviewing", "offer_stage"].includes(s)
  ).length;

  const placements = candidateStatuses.filter((s) =>
    ["placed", "payout_pending", "payout_approved", "payout_paid"].includes(s)
  ).length;

  const estimatedEarningsCents = payouts
    .filter((p: Payout) => p.status === "pending" || p.status === "approved")
    .reduce((sum: number, p: Payout) => sum + p.amountCents, 0);

  const paidEarningsCents = payouts
    .filter((p: Payout) => p.status === "paid")
    .reduce((sum: number, p: Payout) => sum + p.amountCents, 0);

  return {
    totalReferrals: referrals.length,
    activeReferrals: active,
    inProcess,
    placements,
    estimatedEarningsCents,
    paidEarningsCents,
    openJobsCount: openJobs.length,
  };
}

// Re-export status helpers used by UI labels
export const STATUS_LABEL: Record<ReferralStatus, string> = {
  submitted: "Submitted",
  duplicate_review: "Duplicate review",
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  not_qualified: "Not a fit",
  submitted_to_job: "Submitted to role",
  interviewing: "Interviewing",
  offer_stage: "Offer stage",
  placed: "Placed",
  payout_pending: "Payout pending",
  payout_approved: "Payout approved",
  payout_paid: "Payout paid",
  rejected: "Rejected",
  inactive: "Inactive",
};

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  reviewing: "Under review",
  interviewing: "Interviewing",
  offer: "Offer",
  hired: "Hired",
  rejected: "Not selected",
  withdrawn: "Withdrawn",
};

export const PAYOUT_STATUS_LABEL: Record<PayoutStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  paid: "Paid",
  denied: "Denied",
  disputed: "Disputed",
};
