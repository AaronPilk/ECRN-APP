import type {
  ActivityLog,
  Candidate,
  CompanyLead,
  Job,
  JobApplication,
  JobReferral,
  Payout,
  Profile,
  Referral,
  UserRole,
} from "@/types";
import { db, generateId, nowIso } from "./mock-store";

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
// Candidates / Referrals — stubbed for Batch 1. Batch 2 will fill these.
// ─────────────────────────────────────────────────────────────────────

export async function listCandidates(): Promise<Candidate[]> {
  return [...db.candidates];
}

export async function listReferralsByReferrer(referrerUserId: string): Promise<Referral[]> {
  return db.referrals.filter((r) => r.referrerUserId === referrerUserId);
}

export async function listJobReferralsByReferrer(referrerUserId: string): Promise<JobReferral[]> {
  return db.jobReferrals.filter((r) => r.referrerUserId === referrerUserId);
}

// ─────────────────────────────────────────────────────────────────────
// Applications
// ─────────────────────────────────────────────────────────────────────

export async function listApplicationsByApplicant(
  applicantUserId: string
): Promise<JobApplication[]> {
  return db.jobApplications.filter((a) => a.applicantUserId === applicantUserId);
}

// ─────────────────────────────────────────────────────────────────────
// Payouts
// ─────────────────────────────────────────────────────────────────────

export async function listPayoutsByReferrer(referrerUserId: string): Promise<Payout[]> {
  return db.payouts.filter((p) => p.referrerUserId === referrerUserId);
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

  const active = referrals.filter(
    (r) =>
      r.status !== "rejected" &&
      r.status !== "inactive" &&
      r.status !== "not_qualified"
  ).length;

  const inProcess = referrals.filter((r) =>
    ["contacted", "qualified", "submitted_to_job", "interviewing", "offer_stage"].includes(
      r.status
    )
  ).length;

  const placements = referrals.filter((r) =>
    ["placed", "payout_pending", "payout_approved", "payout_paid"].includes(r.status)
  ).length;

  const estimatedEarningsCents = payouts
    .filter((p) => p.status === "pending" || p.status === "approved")
    .reduce((sum, p) => sum + p.amountCents, 0);

  const paidEarningsCents = payouts
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amountCents, 0);

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
