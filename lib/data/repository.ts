import type {
  ActivityLog,
  ApplicationStatus,
  Candidate,
  CandidateSource,
  CompanyLead,
  CompanyLeadStatus,
  Job,
  JobApplication,
  JobReferral,
  JobStatus,
  JobUrgency,
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

// ═══════════════════════════════════════════════════════════════════
// ADMIN-ONLY queries + mutations (Batch 4)
//
// These functions are called from /admin/* pages and routes. In a real
// Supabase build they'd be enforced by RLS (see 0002_rls.sql); in V1
// the AppShell guards the routes with profile.role === "admin".
// ═══════════════════════════════════════════════════════════════════

// ─── enriched list queries ────────────────────────────────────────

export interface ReferralEnriched {
  referral: Referral;
  candidate: Candidate;
  referrer: Profile | null;
}

export async function listAllReferralsEnriched(): Promise<ReferralEnriched[]> {
  const out: ReferralEnriched[] = [];
  for (const r of [...db.referrals].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))) {
    const candidate = await getCandidateById(r.candidateId);
    if (!candidate) continue;
    const referrer = await getProfileById(r.referrerUserId);
    out.push({ referral: r, candidate, referrer });
  }
  return out;
}

export interface ApplicationEnriched {
  application: JobApplication;
  job: Job;
  candidate: Candidate | null;
  applicant: Profile | null;
}

export async function listAllApplicationsEnriched(): Promise<ApplicationEnriched[]> {
  const out: ApplicationEnriched[] = [];
  for (const a of [...db.jobApplications].sort((x, y) => (x.createdAt < y.createdAt ? 1 : -1))) {
    const job = await getJobById(a.jobId);
    if (!job) continue;
    const candidate = await getCandidateById(a.candidateId);
    const applicant = a.applicantUserId ? await getProfileById(a.applicantUserId) : null;
    out.push({ application: a, job, candidate, applicant });
  }
  return out;
}

export interface AdminPayoutEnriched {
  payout: Payout;
  candidate: Candidate | null;
  referrer: Profile | null;
  job: Job | null;
}

export async function listAllPayoutsEnriched(): Promise<AdminPayoutEnriched[]> {
  const out: AdminPayoutEnriched[] = [];
  for (const p of [...db.payouts].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))) {
    const candidate = await getCandidateById(p.candidateId);
    const referrer = await getProfileById(p.referrerUserId);
    const job = p.jobId ? await getJobById(p.jobId) : null;
    out.push({ payout: p, candidate, referrer, job });
  }
  return out;
}

export async function listAllProfiles(): Promise<Profile[]> {
  return [...db.profiles].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

// ─── candidate search + filter ────────────────────────────────────

export interface CandidateFilter {
  search?: string; // matches first/last name, email, phone, current title
  status?: ReferralStatus | "all";
  source?: CandidateSource | "all";
  trade?: string | "all";
}

export async function searchCandidates(filter: CandidateFilter): Promise<Candidate[]> {
  const q = (filter.search ?? "").trim().toLowerCase();
  return db.candidates
    .filter((c) => {
      if (filter.status && filter.status !== "all" && c.status !== filter.status) return false;
      if (filter.source && filter.source !== "all" && c.sourceType !== filter.source) return false;
      if (filter.trade && filter.trade !== "all" && c.trade !== filter.trade) return false;
      if (!q) return true;
      const hay = [
        c.firstName,
        c.lastName,
        c.email ?? "",
        c.phone ?? "",
        c.currentJobTitle ?? "",
        c.locationCity ?? "",
        c.locationState ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

// ─── candidate full context (admin candidate detail) ──────────────

export interface CandidateFullContext {
  candidate: Candidate;
  primaryReferrer: Profile | null;
  referrals: { referral: Referral; referrer: Profile | null }[];
  jobReferrals: { jobReferral: JobReferral; job: Job | null }[];
  applications: { application: JobApplication; job: Job | null }[];
  payouts: Payout[];
  activity: ActivityLog[];
}

export async function getCandidateFullContext(
  candidateId: string
): Promise<CandidateFullContext | null> {
  const candidate = await getCandidateById(candidateId);
  if (!candidate) return null;

  const primaryReferrer = candidate.primaryReferrerUserId
    ? await getProfileById(candidate.primaryReferrerUserId)
    : null;

  const refRows = db.referrals.filter((r) => r.candidateId === candidateId);
  const referrals = await Promise.all(
    refRows.map(async (r) => ({
      referral: r,
      referrer: await getProfileById(r.referrerUserId),
    }))
  );

  const jrRows = db.jobReferrals.filter((jr) => jr.candidateId === candidateId);
  const jobReferrals = await Promise.all(
    jrRows.map(async (jr) => ({
      jobReferral: jr,
      job: await getJobById(jr.jobId),
    }))
  );

  const appRows = db.jobApplications.filter((a) => a.candidateId === candidateId);
  const applications = await Promise.all(
    appRows.map(async (a) => ({
      application: a,
      job: await getJobById(a.jobId),
    }))
  );

  const payouts = db.payouts.filter((p) => p.candidateId === candidateId);

  const activity = db.activityLogs
    .filter(
      (l) =>
        (l.entityType === "candidate" && l.entityId === candidateId) ||
        (l.entityType === "referral" &&
          refRows.some((r) => r.id === l.entityId)) ||
        (l.entityType === "job_application" &&
          appRows.some((a) => a.id === l.entityId)) ||
        (l.entityType === "payout" && payouts.some((p) => p.id === l.entityId))
    )
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));

  return {
    candidate,
    primaryReferrer,
    referrals,
    jobReferrals,
    applications,
    payouts,
    activity,
  };
}

// ─── duplicate review queue ───────────────────────────────────────

export async function listDuplicateReferralAttempts(): Promise<ReferralEnriched[]> {
  const all = await listAllReferralsEnriched();
  return all.filter(
    (r) =>
      r.referral.duplicateStatus === "pending_review" ||
      r.referral.status === "duplicate_review"
  );
}

// ─── admin mutations ──────────────────────────────────────────────

export async function updateCandidateStatus(
  candidateId: string,
  status: ReferralStatus,
  actorId: string,
  notes?: string
): Promise<Candidate> {
  const c = db.candidates.find((c) => c.id === candidateId);
  if (!c) throw new Error("Candidate not found");
  const previous = c.status;
  c.status = status;
  c.updatedAt = nowIso();
  // Mirror onto the primary referral row so the partner sees it on their list
  const primary = db.referrals.find((r) => r.candidateId === candidateId && r.isPrimary);
  if (primary) {
    primary.status = status;
    primary.updatedAt = nowIso();
  }
  await logActivity({
    actorUserId: actorId,
    entityType: "candidate",
    entityId: candidateId,
    action: "status_changed",
    metadata: { from: previous, to: status, notes: notes ?? null },
  });
  return c;
}

export async function appendCandidateNote(
  candidateId: string,
  actorId: string,
  note: string
): Promise<Candidate> {
  const c = db.candidates.find((c) => c.id === candidateId);
  if (!c) throw new Error("Candidate not found");
  const stamped = `[${new Date().toLocaleString("en-US")}] ${note}`;
  c.notes = c.notes ? `${c.notes}\n\n${stamped}` : stamped;
  c.updatedAt = nowIso();
  await logActivity({
    actorUserId: actorId,
    entityType: "candidate",
    entityId: candidateId,
    action: "note_added",
    metadata: { note },
  });
  return c;
}

export async function reassignPrimaryReferrer(
  candidateId: string,
  newReferrerProfileId: string,
  actorId: string
): Promise<Candidate> {
  const c = db.candidates.find((c) => c.id === candidateId);
  if (!c) throw new Error("Candidate not found");
  const previousReferrerId = c.primaryReferrerUserId;
  c.primaryReferrerUserId = newReferrerProfileId;
  c.updatedAt = nowIso();
  // Update referrals: old primary → not primary, new primary → primary
  for (const r of db.referrals.filter((r) => r.candidateId === candidateId)) {
    if (r.referrerUserId === newReferrerProfileId) {
      r.isPrimary = true;
      r.duplicateStatus = "overridden_primary";
    } else {
      r.isPrimary = false;
    }
    r.updatedAt = nowIso();
  }
  await logActivity({
    actorUserId: actorId,
    entityType: "candidate",
    entityId: candidateId,
    action: "primary_referrer_reassigned",
    metadata: { from: previousReferrerId, to: newReferrerProfileId },
  });
  return c;
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  actorId: string
): Promise<JobApplication> {
  const a = db.jobApplications.find((a) => a.id === applicationId);
  if (!a) throw new Error("Application not found");
  const previous = a.status;
  a.status = status;
  a.updatedAt = nowIso();
  await logActivity({
    actorUserId: actorId,
    entityType: "job_application",
    entityId: applicationId,
    action: "status_changed",
    metadata: { from: previous, to: status },
  });
  return a;
}

export async function updatePayoutStatus(
  payoutId: string,
  status: PayoutStatus,
  actorId: string,
  notes?: string
): Promise<Payout> {
  const p = db.payouts.find((p) => p.id === payoutId);
  if (!p) throw new Error("Payout not found");
  const previous = p.status;
  p.status = status;
  if (status === "approved" && !p.approvedAt) p.approvedAt = nowIso();
  if (status === "paid" && !p.paidAt) p.paidAt = nowIso();
  if (notes) p.notes = notes;
  p.updatedAt = nowIso();
  await logActivity({
    actorUserId: actorId,
    entityType: "payout",
    entityId: payoutId,
    action: "status_changed",
    metadata: { from: previous, to: status, notes: notes ?? null },
  });
  return p;
}

export async function updateJobStatus(
  jobId: string,
  status: JobStatus,
  actorId: string
): Promise<Job> {
  const j = db.jobs.find((j) => j.id === jobId);
  if (!j) throw new Error("Job not found");
  const previous = j.status;
  j.status = status;
  j.updatedAt = nowIso();
  await logActivity({
    actorUserId: actorId,
    entityType: "job",
    entityId: jobId,
    action: "status_changed",
    metadata: { from: previous, to: status },
  });
  return j;
}

export interface JobInput {
  title: string;
  companyName?: string | null;
  isCompanyPublic?: boolean;
  locationCity?: string | null;
  locationState?: string | null;
  jobType?: string | null;
  trade?: string | null;
  description?: string | null;
  requirements?: string | null;
  compensationMin?: number | null;
  compensationMax?: number | null;
  compensationDisplay?: string | null;
  startDate?: string | null;
  urgency?: JobUrgency;
  status?: JobStatus;
  isPublic?: boolean;
  referralPayoutAmount?: number | null;
  referralPayoutDisplay?: string | null;
  internalNotes?: string | null;
}

export async function createJob(input: JobInput, actorId: string): Promise<Job> {
  const job: Job = {
    id: generateId("j"),
    title: input.title,
    companyName: input.companyName ?? null,
    isCompanyPublic: input.isCompanyPublic ?? false,
    locationCity: input.locationCity ?? null,
    locationState: input.locationState ?? null,
    jobType: input.jobType ?? null,
    trade: input.trade ?? null,
    description: input.description ?? null,
    requirements: input.requirements ?? null,
    compensationMin: input.compensationMin ?? null,
    compensationMax: input.compensationMax ?? null,
    compensationDisplay: input.compensationDisplay ?? null,
    startDate: input.startDate ?? null,
    urgency: input.urgency ?? "normal",
    status: input.status ?? "draft",
    isPublic: input.isPublic ?? false,
    referralPayoutAmount: input.referralPayoutAmount ?? null,
    referralPayoutDisplay: input.referralPayoutDisplay ?? null,
    internalNotes: input.internalNotes ?? null,
    externalCrmId: null,
    metadata: {},
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.jobs.push(job);
  await logActivity({
    actorUserId: actorId,
    entityType: "job",
    entityId: job.id,
    action: "created",
    metadata: { title: job.title },
  });
  return job;
}

export async function updateJob(
  jobId: string,
  input: Partial<JobInput>,
  actorId: string
): Promise<Job> {
  const j = db.jobs.find((j) => j.id === jobId);
  if (!j) throw new Error("Job not found");
  Object.assign(j, input);
  j.updatedAt = nowIso();
  await logActivity({
    actorUserId: actorId,
    entityType: "job",
    entityId: jobId,
    action: "updated",
    metadata: { fields: Object.keys(input) },
  });
  return j;
}

export async function updateCompanyLeadStatus(
  leadId: string,
  status: CompanyLeadStatus,
  actorId: string,
  notes?: string
): Promise<CompanyLead> {
  const l = db.companyLeads.find((l) => l.id === leadId);
  if (!l) throw new Error("Lead not found");
  const previous = l.status;
  l.status = status;
  if (notes) l.notes = notes;
  l.updatedAt = nowIso();
  await logActivity({
    actorUserId: actorId,
    entityType: "company_lead",
    entityId: leadId,
    action: "status_changed",
    metadata: { from: previous, to: status, notes: notes ?? null },
  });
  return l;
}

export async function getCompanyLeadById(id: string): Promise<CompanyLead | null> {
  return db.companyLeads.find((l) => l.id === id) ?? null;
}

// ─── admin overview aggregates ─────────────────────────────────────

export interface AdminDashboardStats {
  candidates: number;
  candidatesAddedThisWeek: number;
  referrals: number;
  referralsThisWeek: number;
  placements: number;
  jobsOpen: number;
  applications: number;
  newApplicationsThisWeek: number;
  companyLeadsNew: number;
  duplicateReviewCount: number;
  payoutsPending: number;
  payoutsPendingCents: number;
  payoutsApprovedCents: number;
  payoutsPaidCents: number;
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const sinceWeek = (iso: string) => new Date(iso).getTime() >= weekAgo;

  const candidates = db.candidates;
  const referrals = db.referrals;
  const applications = db.jobApplications;
  const leads = db.companyLeads;
  const payouts = db.payouts;
  const jobs = db.jobs;

  const placedStatuses: ReferralStatus[] = [
    "placed",
    "payout_pending",
    "payout_approved",
    "payout_paid",
  ];

  return {
    candidates: candidates.length,
    candidatesAddedThisWeek: candidates.filter((c) => sinceWeek(c.createdAt)).length,
    referrals: referrals.length,
    referralsThisWeek: referrals.filter((r) => sinceWeek(r.createdAt)).length,
    placements: candidates.filter((c) => placedStatuses.includes(c.status)).length,
    jobsOpen: jobs.filter((j) => j.status === "open").length,
    applications: applications.length,
    newApplicationsThisWeek: applications.filter((a) => sinceWeek(a.createdAt)).length,
    companyLeadsNew: leads.filter((l) => l.status === "new").length,
    duplicateReviewCount: referrals.filter(
      (r) => r.duplicateStatus === "pending_review" || r.status === "duplicate_review"
    ).length,
    payoutsPending: payouts.filter((p) => p.status === "pending").length,
    payoutsPendingCents: payouts
      .filter((p) => p.status === "pending")
      .reduce((s, p) => s + p.amountCents, 0),
    payoutsApprovedCents: payouts
      .filter((p) => p.status === "approved")
      .reduce((s, p) => s + p.amountCents, 0),
    payoutsPaidCents: payouts
      .filter((p) => p.status === "paid")
      .reduce((s, p) => s + p.amountCents, 0),
  };
}

export async function listRecentActivity(limit = 20): Promise<ActivityLog[]> {
  return [...db.activityLogs]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit);
}
