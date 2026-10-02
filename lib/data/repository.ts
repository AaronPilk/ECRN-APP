import "server-only";
import type {
  ActivityLog,
  ApplicationStatus,
  Candidate,
  CandidateNote,
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
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  candidateFromReferralSnapshot,
  one,
  toActivity,
  toApplication,
  toCandidate,
  toCandidateNote,
  toCompanyLead,
  toJob,
  toJobReferral,
  toPayout,
  toProfile,
  toReferral,
} from "./mappers";

/**
 * The single data access layer for ECRN, backed by Supabase.
 *
 * Every query runs as the signed-in user, so Row Level Security (see
 * supabase/migrations/0002_rls.sql) decides what each person can read or
 * write. Admin-only functions still double-check the role in app code.
 */

const db = createSupabaseServerClient;

function fail(context: string, error: { message: string } | null): never {
  throw new Error(`${context}: ${error?.message ?? "unknown error"}`);
}

// ─────────────────────────────────────────────────────────────────────
// Profiles
// ─────────────────────────────────────────────────────────────────────

export async function getProfileById(id: string): Promise<Profile | null> {
  const sb = await db();
  const { data, error } = await sb.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) fail("getProfileById", error);
  return data ? toProfile(data) : null;
}

export async function updateMyProfile(
  id: string,
  input: Partial<Pick<Profile, "firstName" | "lastName" | "phone" | "locationCity" | "locationState" | "linkedinUrl" | "companyName">>
): Promise<void> {
  const sb = await db();
  const patch: Record<string, unknown> = {};
  if (input.firstName !== undefined) patch.first_name = input.firstName;
  if (input.lastName !== undefined) patch.last_name = input.lastName;
  if (input.phone !== undefined) patch.phone = input.phone;
  if (input.locationCity !== undefined) patch.location_city = input.locationCity;
  if (input.locationState !== undefined) patch.location_state = input.locationState;
  if (input.linkedinUrl !== undefined) patch.linkedin_url = input.linkedinUrl;
  if (input.companyName !== undefined) patch.company_name = input.companyName;
  const { error } = await sb.from("profiles").update(patch).eq("id", id);
  if (error) fail("updateMyProfile", error);
}

/** Onboarding role choice. Admin role can never be self-assigned. */
export async function setMyRole(role: Exclude<UserRole, "admin">): Promise<void> {
  const sb = await db();
  const { error } = await sb.rpc("set_my_role", { p_role: role });
  if (error) fail("setMyRole", error);
}

/** "Jane D." for the invite-link banner. Works without being signed in. */
export async function getReferrerDisplayName(profileId: string): Promise<string | null> {
  if (!/^[0-9a-f-]{36}$/i.test(profileId)) return null;
  const sb = await db();
  const { data, error } = await sb.rpc("referrer_display_name", { p_id: profileId });
  if (error) return null;
  return (data as string | null) ?? null;
}

export async function countInvitedBy(profileId: string): Promise<number> {
  const sb = await db();
  const { count } = await sb
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("invited_by", profileId);
  return count ?? 0;
}

// ─────────────────────────────────────────────────────────────────────
// Jobs
// ─────────────────────────────────────────────────────────────────────

export async function listPublicJobs(): Promise<Job[]> {
  const sb = await db();
  const { data, error } = await sb
    .from("jobs")
    .select("*")
    .eq("is_public", true)
    .in("status", ["open", "paused"])
    .order("created_at", { ascending: false });
  if (error) fail("listPublicJobs", error);
  return (data ?? []).map(toJob);
}

export async function getJobById(id: string): Promise<Job | null> {
  if (!isUuid(id)) return null;
  const sb = await db();
  const { data, error } = await sb.from("jobs").select("*").eq("id", id).maybeSingle();
  if (error) fail("getJobById", error);
  return data ? toJob(data) : null;
}

export async function listAllJobs(): Promise<Job[]> {
  const sb = await db();
  const { data, error } = await sb.from("jobs").select("*").order("created_at", { ascending: false });
  if (error) fail("listAllJobs", error);
  return (data ?? []).map(toJob);
}

// ─────────────────────────────────────────────────────────────────────
// Candidates
// ─────────────────────────────────────────────────────────────────────

export async function listCandidates(): Promise<Candidate[]> {
  return searchCandidates({});
}

export async function getCandidateById(id: string): Promise<Candidate | null> {
  if (!isUuid(id)) return null;
  const sb = await db();
  const { data, error } = await sb.from("candidates").select("*").eq("id", id).maybeSingle();
  if (error) fail("getCandidateById", error);
  return data ? toCandidate(data) : null;
}

// ─────────────────────────────────────────────────────────────────────
// Referrals
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
  referralId: string;
  candidateId: string;
  isDuplicate: boolean;
}

/**
 * Submit a referral. Duplicate detection (email → phone → LinkedIn →
 * name + location) runs inside the database so partners never get read
 * access to other people's contacts. The first referrer keeps ownership.
 */
export async function createReferral(
  input: CreateReferralInput,
  options: { jobId?: string | null } = {}
): Promise<CreateReferralResult> {
  const sb = await db();
  const payload = {
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email ?? "",
    phone: input.phone ?? "",
    location_city: input.locationCity ?? "",
    location_state: input.locationState ?? "",
    current_job_title: input.currentJobTitle ?? "",
    trade: input.trade ?? "",
    years_experience: input.yearsExperience != null ? String(input.yearsExperience) : "",
    linkedin_url: input.linkedinUrl ?? "",
    resume_url: input.resumeUrl ?? "",
    notes: input.notes ?? "",
  };
  const { data, error } = await sb.rpc("submit_referral", {
    p: payload,
    p_job_id: options.jobId || null,
  });
  if (error) throw new Error(error.message);
  const r = data as { referral_id: string; candidate_id: string; is_duplicate: boolean };
  return { referralId: r.referral_id, candidateId: r.candidate_id, isDuplicate: r.is_duplicate };
}

export async function listReferralsByReferrer(referrerUserId: string): Promise<Referral[]> {
  const sb = await db();
  const { data, error } = await sb
    .from("referrals")
    .select("*")
    .eq("referrer_user_id", referrerUserId)
    .order("created_at", { ascending: false });
  if (error) fail("listReferralsByReferrer", error);
  return (data ?? []).map(toReferral);
}

export interface ReferralWithCandidate {
  referral: Referral;
  candidate: Candidate;
}

export async function listReferralsByReferrerEnriched(
  referrerUserId: string
): Promise<ReferralWithCandidate[]> {
  const sb = await db();
  const { data, error } = await sb
    .from("referrals")
    .select("*, candidate:candidates(*)")
    .eq("referrer_user_id", referrerUserId)
    .order("created_at", { ascending: false });
  if (error) fail("listReferralsByReferrerEnriched", error);
  return (data ?? []).map((row) => {
    const referral = toReferral(row);
    const candidate = one(row.candidate, toCandidate) ?? candidateFromReferralSnapshot(referral);
    return { referral, candidate };
  });
}

export async function getReferralById(id: string): Promise<Referral | null> {
  if (!isUuid(id)) return null;
  const sb = await db();
  const { data, error } = await sb.from("referrals").select("*").eq("id", id).maybeSingle();
  if (error) fail("getReferralById", error);
  return data ? toReferral(data) : null;
}

export async function getReferralWithCandidate(id: string): Promise<ReferralWithCandidate | null> {
  if (!isUuid(id)) return null;
  const sb = await db();
  const { data, error } = await sb
    .from("referrals")
    .select("*, candidate:candidates(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) fail("getReferralWithCandidate", error);
  if (!data) return null;
  const referral = toReferral(data);
  const candidate = one(data.candidate, toCandidate) ?? candidateFromReferralSnapshot(referral);
  return { referral, candidate };
}

export async function listJobReferralsByReferrer(referrerUserId: string): Promise<JobReferral[]> {
  const sb = await db();
  const { data, error } = await sb
    .from("job_referrals")
    .select("*")
    .eq("referrer_user_id", referrerUserId);
  if (error) fail("listJobReferralsByReferrer", error);
  return (data ?? []).map(toJobReferral);
}

export async function listJobReferralsByCandidate(candidateId: string): Promise<JobReferral[]> {
  const sb = await db();
  const { data, error } = await sb
    .from("job_referrals")
    .select("*")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false });
  if (error) fail("listJobReferralsByCandidate", error);
  return (data ?? []).map(toJobReferral);
}

// ─────────────────────────────────────────────────────────────────────
// Applications
// ─────────────────────────────────────────────────────────────────────

export interface CreateApplicationInput {
  jobId: string;
  resumeUrl?: string | null;
  linkedinUrl?: string | null;
  notes?: string | null;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
  currentJobTitle?: string | null;
  trade?: string | null;
}

export async function createJobApplication(
  input: CreateApplicationInput
): Promise<{ applicationId: string; candidateId: string }> {
  const sb = await db();
  const { data, error } = await sb.rpc("apply_to_job", {
    p_job_id: input.jobId,
    p: {
      first_name: input.firstName ?? "",
      last_name: input.lastName ?? "",
      phone: input.phone ?? "",
      location_city: input.locationCity ?? "",
      location_state: input.locationState ?? "",
      current_job_title: input.currentJobTitle ?? "",
      trade: input.trade ?? "",
      linkedin_url: input.linkedinUrl ?? "",
      resume_url: input.resumeUrl ?? "",
      notes: input.notes ?? "",
    },
  });
  if (error) throw new Error(error.message);
  const r = data as { application_id: string; candidate_id: string };
  return { applicationId: r.application_id, candidateId: r.candidate_id };
}

export async function listApplicationsByApplicant(applicantUserId: string): Promise<JobApplication[]> {
  const sb = await db();
  const { data, error } = await sb
    .from("job_applications")
    .select("*")
    .eq("applicant_user_id", applicantUserId)
    .order("created_at", { ascending: false });
  if (error) fail("listApplicationsByApplicant", error);
  return (data ?? []).map(toApplication);
}

export interface ApplicationWithJob {
  application: JobApplication;
  job: Job;
}

export async function listApplicationsByApplicantEnriched(
  applicantUserId: string
): Promise<ApplicationWithJob[]> {
  const sb = await db();
  const { data, error } = await sb
    .from("job_applications")
    .select("*, job:jobs(*)")
    .eq("applicant_user_id", applicantUserId)
    .order("created_at", { ascending: false });
  if (error) fail("listApplicationsByApplicantEnriched", error);
  const out: ApplicationWithJob[] = [];
  for (const row of data ?? []) {
    const job = one(row.job, toJob);
    if (job) out.push({ application: toApplication(row), job });
  }
  return out;
}

export async function getApplicationById(id: string): Promise<JobApplication | null> {
  if (!isUuid(id)) return null;
  const sb = await db();
  const { data, error } = await sb.from("job_applications").select("*").eq("id", id).maybeSingle();
  if (error) fail("getApplicationById", error);
  return data ? toApplication(data) : null;
}

// ─────────────────────────────────────────────────────────────────────
// Payouts
// ─────────────────────────────────────────────────────────────────────

export async function listPayoutsByReferrer(referrerUserId: string): Promise<Payout[]> {
  const sb = await db();
  const { data, error } = await sb
    .from("payouts")
    .select("*")
    .eq("referrer_user_id", referrerUserId)
    .order("created_at", { ascending: false });
  if (error) fail("listPayoutsByReferrer", error);
  return (data ?? []).map(toPayout);
}

export interface PayoutEnriched {
  payout: Payout;
  candidate: Candidate | null;
  job: Job | null;
}

export async function listPayoutsByReferrerEnriched(referrerUserId: string): Promise<PayoutEnriched[]> {
  const sb = await db();
  const { data, error } = await sb
    .from("payouts")
    .select("*, candidate:candidates(*), job:jobs(*)")
    .eq("referrer_user_id", referrerUserId)
    .order("created_at", { ascending: false });
  if (error) fail("listPayoutsByReferrerEnriched", error);
  return (data ?? []).map((row) => ({
    payout: toPayout(row),
    candidate: one(row.candidate, toCandidate),
    job: one(row.job, toJob),
  }));
}

// ─────────────────────────────────────────────────────────────────────
// Company leads
// ─────────────────────────────────────────────────────────────────────

export interface CompanyLeadInput {
  companyName: string;
  contactName: string;
  email: string;
  phone?: string | null;
  location?: string | null;
  roleNeeded?: string | null;
  numberOfCandidates?: number | null;
  compensationRange?: string | null;
  jobDescription?: string | null;
  notes?: string | null;
}

/** Public hiring form — works without an account. */
export async function createCompanyLead(input: CompanyLeadInput): Promise<string> {
  const sb = await db();
  const { data, error } = await sb.rpc("submit_company_lead", {
    p: {
      company_name: input.companyName,
      contact_name: input.contactName,
      email: input.email,
      phone: input.phone ?? "",
      location: input.location ?? "",
      role_needed: input.roleNeeded ?? "",
      number_of_candidates: input.numberOfCandidates != null ? String(input.numberOfCandidates) : "",
      compensation_range: input.compensationRange ?? "",
      job_description: input.jobDescription ?? "",
      notes: input.notes ?? "",
    },
  });
  if (error) throw new Error(error.message);
  return data as string;
}

export async function listCompanyLeads(): Promise<CompanyLead[]> {
  const sb = await db();
  const { data, error } = await sb
    .from("company_leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) fail("listCompanyLeads", error);
  return (data ?? []).map(toCompanyLead);
}

export async function getCompanyLeadById(id: string): Promise<CompanyLead | null> {
  if (!isUuid(id)) return null;
  const sb = await db();
  const { data, error } = await sb.from("company_leads").select("*").eq("id", id).maybeSingle();
  if (error) fail("getCompanyLeadById", error);
  return data ? toCompanyLead(data) : null;
}

// ─────────────────────────────────────────────────────────────────────
// Activity log
// ─────────────────────────────────────────────────────────────────────

export async function logActivity(input: {
  actorUserId: string | null;
  entityType: string;
  entityId: string | null;
  action: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const sb = await db();
  const { error } = await sb.from("activity_logs").insert({
    actor_user_id: input.actorUserId,
    entity_type: input.entityType,
    entity_id: input.entityId,
    action: input.action,
    metadata: input.metadata ?? {},
  });
  // Audit logging must never break the user's action.
  if (error) console.error("[ECRN] logActivity failed:", error.message);
}

export async function listActivityForEntity(entityType: string, entityId: string): Promise<ActivityLog[]> {
  const sb = await db();
  const { data, error } = await sb
    .from("activity_logs")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: true });
  if (error) fail("listActivityForEntity", error);
  return (data ?? []).map(toActivity);
}

/** Timeline for a partner's referral: their actions + Delta's status changes. */
export async function listReferralTimeline(referral: Referral, candidateId: string): Promise<ActivityLog[]> {
  const sb = await db();
  const { data, error } = await sb
    .from("activity_logs")
    .select("*")
    .in("entity_id", [referral.id, candidateId])
    .order("created_at", { ascending: true });
  if (error) fail("listReferralTimeline", error);
  return (data ?? []).map(toActivity);
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

const IN_PROCESS: ReferralStatus[] = ["contacted", "qualified", "submitted_to_job", "interviewing", "offer_stage"];
const PLACED: ReferralStatus[] = ["placed", "payout_pending", "payout_approved", "payout_paid"];
const INACTIVE: ReferralStatus[] = ["rejected", "inactive", "not_qualified"];

export async function getReferralPartnerDashboardStats(profileId: string): Promise<ReferralPartnerDashboardStats> {
  const [referrals, payouts, openJobs] = await Promise.all([
    listReferralsByReferrerEnriched(profileId),
    listPayoutsByReferrer(profileId),
    listPublicJobs(),
  ]);
  const statuses = referrals.map((r) => r.candidate.status);

  return {
    totalReferrals: referrals.length,
    activeReferrals: statuses.filter((s) => !INACTIVE.includes(s)).length,
    inProcess: statuses.filter((s) => IN_PROCESS.includes(s)).length,
    placements: statuses.filter((s) => PLACED.includes(s)).length,
    estimatedEarningsCents: payouts
      .filter((p) => p.status === "pending" || p.status === "approved")
      .reduce((sum, p) => sum + p.amountCents, 0),
    paidEarningsCents: payouts.filter((p) => p.status === "paid").reduce((sum, p) => sum + p.amountCents, 0),
    openJobsCount: openJobs.length,
  };
}

// ─────────────────────────────────────────────────────────────────────
// Labels
// ─────────────────────────────────────────────────────────────────────

export const STATUS_LABEL: Record<ReferralStatus, string> = {
  submitted: "Submitted",
  duplicate_review: "Under review",
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
// ADMIN — RLS only returns everything to admins; pages also check role.
// ═══════════════════════════════════════════════════════════════════

export interface ReferralEnriched {
  referral: Referral;
  candidate: Candidate;
  referrer: Profile | null;
}

export async function listAllReferralsEnriched(): Promise<ReferralEnriched[]> {
  const sb = await db();
  const { data, error } = await sb
    .from("referrals")
    .select("*, candidate:candidates(*), referrer:profiles(*)")
    .order("created_at", { ascending: false });
  if (error) fail("listAllReferralsEnriched", error);
  const out: ReferralEnriched[] = [];
  for (const row of data ?? []) {
    const candidate = one(row.candidate, toCandidate);
    if (!candidate) continue;
    out.push({ referral: toReferral(row), candidate, referrer: one(row.referrer, toProfile) });
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
  const sb = await db();
  const { data, error } = await sb
    .from("job_applications")
    .select("*, job:jobs(*), candidate:candidates(*), applicant:profiles(*)")
    .order("created_at", { ascending: false });
  if (error) fail("listAllApplicationsEnriched", error);
  const out: ApplicationEnriched[] = [];
  for (const row of data ?? []) {
    const job = one(row.job, toJob);
    if (!job) continue;
    out.push({
      application: toApplication(row),
      job,
      candidate: one(row.candidate, toCandidate),
      applicant: one(row.applicant, toProfile),
    });
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
  const sb = await db();
  const { data, error } = await sb
    .from("payouts")
    .select("*, candidate:candidates(*), referrer:profiles(*), job:jobs(*)")
    .order("created_at", { ascending: false });
  if (error) fail("listAllPayoutsEnriched", error);
  return (data ?? []).map((row) => ({
    payout: toPayout(row),
    candidate: one(row.candidate, toCandidate),
    referrer: one(row.referrer, toProfile),
    job: one(row.job, toJob),
  }));
}

export async function listAllProfiles(): Promise<Profile[]> {
  const sb = await db();
  const { data, error } = await sb.from("profiles").select("*").order("created_at", { ascending: false });
  if (error) fail("listAllProfiles", error);
  return (data ?? []).map(toProfile);
}

export async function listAdminAllowlist(): Promise<string[]> {
  const sb = await db();
  const { data, error } = await sb.from("admin_allowlist").select("email").order("email");
  if (error) return [];
  return (data ?? []).map((r) => r.email as string);
}

// ─── candidate search ────────────────────────────────────────────────

export interface CandidateFilter {
  search?: string;
  status?: ReferralStatus | "all";
  source?: CandidateSource | "all";
  trade?: string | "all";
}

export async function searchCandidates(filter: CandidateFilter): Promise<Candidate[]> {
  const sb = await db();
  let q = sb.from("candidates").select("*").order("created_at", { ascending: false }).limit(1000);
  if (filter.status && filter.status !== "all") q = q.eq("status", filter.status);
  if (filter.source && filter.source !== "all") q = q.eq("source_type", filter.source);
  if (filter.trade && filter.trade !== "all") q = q.eq("trade", filter.trade);
  const term = (filter.search ?? "").replace(/[%,()*\\]/g, " ").trim();
  if (term) {
    const like = `%${term}%`;
    q = q.or(
      [
        "first_name",
        "last_name",
        "email",
        "phone",
        "current_job_title",
        "location_city",
        "location_state",
      ]
        .map((col) => `${col}.ilike.${like}`)
        .join(",")
    );
  }
  const { data, error } = await q;
  if (error) fail("searchCandidates", error);
  return (data ?? []).map(toCandidate);
}

// ─── candidate full context ──────────────────────────────────────────

export interface CandidateFullContext {
  candidate: Candidate;
  primaryReferrer: Profile | null;
  referrals: { referral: Referral; referrer: Profile | null }[];
  jobReferrals: { jobReferral: JobReferral; job: Job | null }[];
  applications: { application: JobApplication; job: Job | null }[];
  payouts: Payout[];
  internalNotes: CandidateNote[];
  activity: ActivityLog[];
}

export async function getCandidateFullContext(candidateId: string): Promise<CandidateFullContext | null> {
  if (!isUuid(candidateId)) return null;
  const sb = await db();
  const { data: c, error } = await sb.from("candidates").select("*").eq("id", candidateId).maybeSingle();
  if (error) fail("getCandidateFullContext", error);
  if (!c) return null;
  const candidate = toCandidate(c);

  const [primaryReferrer, refs, jrs, apps, pays, notes] = await Promise.all([
    candidate.primaryReferrerUserId ? getProfileById(candidate.primaryReferrerUserId) : Promise.resolve(null),
    sb.from("referrals").select("*, referrer:profiles(*)").eq("candidate_id", candidateId).order("created_at"),
    sb.from("job_referrals").select("*, job:jobs(*)").eq("candidate_id", candidateId).order("created_at"),
    sb.from("job_applications").select("*, job:jobs(*)").eq("candidate_id", candidateId).order("created_at"),
    sb.from("payouts").select("*").eq("candidate_id", candidateId).order("created_at"),
    sb.from("candidate_notes").select("*").eq("candidate_id", candidateId).order("created_at", { ascending: false }),
  ]);

  const referrals = (refs.data ?? []).map((row) => ({
    referral: toReferral(row),
    referrer: one(row.referrer, toProfile),
  }));
  const jobReferrals = (jrs.data ?? []).map((row) => ({
    jobReferral: toJobReferral(row),
    job: one(row.job, toJob),
  }));
  const applications = (apps.data ?? []).map((row) => ({
    application: toApplication(row),
    job: one(row.job, toJob),
  }));
  const payouts = (pays.data ?? []).map(toPayout);

  const ids = [
    candidateId,
    ...referrals.map((r) => r.referral.id),
    ...applications.map((a) => a.application.id),
    ...payouts.map((p) => p.id),
  ];
  const { data: acts } = await sb
    .from("activity_logs")
    .select("*")
    .in("entity_id", ids)
    .order("created_at", { ascending: true });

  return {
    candidate,
    primaryReferrer,
    referrals,
    jobReferrals,
    applications,
    payouts,
    internalNotes: (notes.data ?? []).map(toCandidateNote),
    activity: (acts ?? []).map(toActivity),
  };
}

export async function listDuplicateReferralAttempts(): Promise<ReferralEnriched[]> {
  const all = await listAllReferralsEnriched();
  return all.filter(
    (r) => r.referral.duplicateStatus === "pending_review" || r.referral.status === "duplicate_review"
  );
}

// ─── admin mutations ─────────────────────────────────────────────────

export async function updateCandidateStatus(
  candidateId: string,
  status: ReferralStatus,
  actorId: string,
  note?: string
): Promise<void> {
  const sb = await db();
  const { data: before } = await sb.from("candidates").select("status").eq("id", candidateId).maybeSingle();
  const { error } = await sb.from("candidates").update({ status }).eq("id", candidateId);
  if (error) fail("updateCandidateStatus", error);

  // Mirror onto the primary referral + job submissions so partners see it.
  await sb.from("referrals").update({ status }).eq("candidate_id", candidateId).eq("is_primary", true);
  await sb
    .from("job_referrals")
    .update({ status })
    .eq("candidate_id", candidateId)
    .neq("status", "duplicate_review");

  await logActivity({
    actorUserId: actorId,
    entityType: "candidate",
    entityId: candidateId,
    action: "status_changed",
    metadata: { from: before?.status ?? null, to: status },
  });
  if (note && note.trim()) await appendCandidateNote(candidateId, actorId, `Status → ${STATUS_LABEL[status]}: ${note.trim()}`);
}

export async function appendCandidateNote(candidateId: string, actorId: string, note: string): Promise<void> {
  const sb = await db();
  const { error } = await sb
    .from("candidate_notes")
    .insert({ candidate_id: candidateId, author_user_id: actorId, body: note.trim() });
  if (error) fail("appendCandidateNote", error);
  await logActivity({
    actorUserId: actorId,
    entityType: "candidate",
    entityId: candidateId,
    action: "note_added",
  });
}

export async function reassignPrimaryReferrer(
  candidateId: string,
  newReferrerProfileId: string,
  actorId: string
): Promise<void> {
  const sb = await db();
  const { data: before } = await sb
    .from("candidates")
    .select("primary_referrer_user_id")
    .eq("id", candidateId)
    .maybeSingle();

  // Clear the old primary first (one-primary-per-candidate unique index).
  let res = await sb.from("referrals").update({ is_primary: false }).eq("candidate_id", candidateId);
  if (res.error) fail("reassignPrimaryReferrer", res.error);
  res = await sb
    .from("referrals")
    .update({ is_primary: true, duplicate_status: "overridden_primary" })
    .eq("candidate_id", candidateId)
    .eq("referrer_user_id", newReferrerProfileId);
  if (res.error) fail("reassignPrimaryReferrer", res.error);
  res = await sb
    .from("candidates")
    .update({ primary_referrer_user_id: newReferrerProfileId })
    .eq("id", candidateId);
  if (res.error) fail("reassignPrimaryReferrer", res.error);
  await sb
    .from("payouts")
    .update({ referrer_user_id: newReferrerProfileId })
    .eq("candidate_id", candidateId)
    .in("status", ["pending", "approved"]);

  await logActivity({
    actorUserId: actorId,
    entityType: "candidate",
    entityId: candidateId,
    action: "primary_referrer_reassigned",
    metadata: { from: before?.primary_referrer_user_id ?? null, to: newReferrerProfileId },
  });
}

export async function updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  actorId: string
): Promise<void> {
  const sb = await db();
  const { data: before } = await sb.from("job_applications").select("status").eq("id", applicationId).maybeSingle();
  const { error } = await sb.from("job_applications").update({ status }).eq("id", applicationId);
  if (error) fail("updateApplicationStatus", error);
  await logActivity({
    actorUserId: actorId,
    entityType: "job_application",
    entityId: applicationId,
    action: "status_changed",
    metadata: { from: before?.status ?? null, to: status },
  });
}

export async function updatePayoutStatus(
  payoutId: string,
  status: PayoutStatus,
  actorId: string,
  opts: { notes?: string; amountCents?: number | null } = {}
): Promise<void> {
  const sb = await db();
  const { data: before } = await sb
    .from("payouts")
    .select("status, approved_at, paid_at, amount_cents")
    .eq("id", payoutId)
    .maybeSingle();
  const patch: Record<string, unknown> = { status };
  if (status === "approved" && !before?.approved_at) patch.approved_at = new Date().toISOString();
  if (status === "paid" && !before?.paid_at) patch.paid_at = new Date().toISOString();
  if (opts.notes && opts.notes.trim()) patch.notes = opts.notes.trim();
  if (opts.amountCents != null && opts.amountCents >= 0) patch.amount_cents = opts.amountCents;
  const { error } = await sb.from("payouts").update(patch).eq("id", payoutId);
  if (error) fail("updatePayoutStatus", error);
  await logActivity({
    actorUserId: actorId,
    entityType: "payout",
    entityId: payoutId,
    action: "status_changed",
    metadata: {
      from: before?.status ?? null,
      to: status,
      amount_cents: opts.amountCents ?? before?.amount_cents ?? null,
    },
  });
}

export async function updateJobStatus(jobId: string, status: JobStatus, actorId: string): Promise<void> {
  const sb = await db();
  const { error } = await sb.from("jobs").update({ status }).eq("id", jobId);
  if (error) fail("updateJobStatus", error);
  await logActivity({ actorUserId: actorId, entityType: "job", entityId: jobId, action: "status_changed", metadata: { to: status } });
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

function jobToRow(input: Partial<JobInput>): Record<string, unknown> {
  const map: Record<keyof JobInput, string> = {
    title: "title",
    companyName: "company_name",
    isCompanyPublic: "is_company_public",
    locationCity: "location_city",
    locationState: "location_state",
    jobType: "job_type",
    trade: "trade",
    description: "description",
    requirements: "requirements",
    compensationMin: "compensation_min",
    compensationMax: "compensation_max",
    compensationDisplay: "compensation_display",
    startDate: "start_date",
    urgency: "urgency",
    status: "status",
    isPublic: "is_public",
    referralPayoutAmount: "referral_payout_amount",
    referralPayoutDisplay: "referral_payout_display",
    internalNotes: "internal_notes",
  };
  const row: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    const col = map[k as keyof JobInput];
    if (col && v !== undefined) row[col] = v;
  }
  return row;
}

export async function createJob(input: JobInput, actorId: string): Promise<Job> {
  const sb = await db();
  const { data, error } = await sb.from("jobs").insert(jobToRow(input)).select("*").single();
  if (error) fail("createJob", error);
  await logActivity({ actorUserId: actorId, entityType: "job", entityId: data.id, action: "created", metadata: { title: input.title } });
  return toJob(data);
}

export async function updateJob(jobId: string, input: Partial<JobInput>, actorId: string): Promise<void> {
  const sb = await db();
  const { error } = await sb.from("jobs").update(jobToRow(input)).eq("id", jobId);
  if (error) fail("updateJob", error);
  await logActivity({ actorUserId: actorId, entityType: "job", entityId: jobId, action: "updated" });
}

export async function updateCompanyLeadStatus(
  leadId: string,
  status: CompanyLeadStatus,
  actorId: string,
  notes?: string
): Promise<void> {
  const sb = await db();
  const patch: Record<string, unknown> = { status };
  if (notes !== undefined) patch.notes = notes.trim() || null;
  const { error } = await sb.from("company_leads").update(patch).eq("id", leadId);
  if (error) fail("updateCompanyLeadStatus", error);
  await logActivity({ actorUserId: actorId, entityType: "company_lead", entityId: leadId, action: "status_changed", metadata: { to: status } });
}

// ─── admin overview ──────────────────────────────────────────────────

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
  const sb = await db();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const count = async (table: string, f?: (q: any) => any) => {
    let q = sb.from(table).select("id", { count: "exact", head: true });
    if (f) q = f(q);
    const { count: n } = await q;
    return n ?? 0;
  };

  const [
    candidates,
    candidatesAddedThisWeek,
    referrals,
    referralsThisWeek,
    placements,
    jobsOpen,
    applications,
    newApplicationsThisWeek,
    companyLeadsNew,
    duplicateReviewCount,
    payoutRows,
  ] = await Promise.all([
    count("candidates"),
    count("candidates", (q) => q.gte("created_at", weekAgo)),
    count("referrals"),
    count("referrals", (q) => q.gte("created_at", weekAgo)),
    count("candidates", (q) => q.in("status", PLACED)),
    count("jobs", (q) => q.eq("status", "open")),
    count("job_applications"),
    count("job_applications", (q) => q.gte("created_at", weekAgo)),
    count("company_leads", (q) => q.eq("status", "new")),
    count("referrals", (q) => q.eq("duplicate_status", "pending_review")),
    sb.from("payouts").select("status, amount_cents"),
  ]);

  const pays = (payoutRows.data ?? []) as { status: PayoutStatus; amount_cents: number }[];
  const sum = (s: PayoutStatus) => pays.filter((p) => p.status === s).reduce((a, p) => a + p.amount_cents, 0);

  return {
    candidates,
    candidatesAddedThisWeek,
    referrals,
    referralsThisWeek,
    placements,
    jobsOpen,
    applications,
    newApplicationsThisWeek,
    companyLeadsNew,
    duplicateReviewCount,
    payoutsPending: pays.filter((p) => p.status === "pending").length,
    payoutsPendingCents: sum("pending"),
    payoutsApprovedCents: sum("approved"),
    payoutsPaidCents: sum("paid"),
  };
}

export async function listRecentActivity(limit = 20): Promise<ActivityLog[]> {
  const sb = await db();
  const { data, error } = await sb
    .from("activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) fail("listRecentActivity", error);
  return (data ?? []).map(toActivity);
}

// ─── native app ──────────────────────────────────────────────────────

export async function registerDeviceToken(token: string, platform: "ios" | "android" | "web"): Promise<void> {
  const sb = await db();
  const { error } = await sb.rpc("register_device_token", { p_token: token, p_platform: platform });
  if (error) fail("registerDeviceToken", error);
}

export async function countMyDeviceTokens(): Promise<number> {
  const sb = await db();
  const { count } = await sb.from("device_tokens").select("id", { count: "exact", head: true });
  return count ?? 0;
}

/** Apple-required in-app account deletion. Signs the user out afterwards. */
export async function deleteMyAccount(): Promise<void> {
  const sb = await db();
  const { error } = await sb.rpc("delete_my_account");
  if (error) throw new Error(error.message);
  await sb.auth.signOut().catch(() => {});
}

// ─── utils ───────────────────────────────────────────────────────────

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}
