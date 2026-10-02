import type {
  ActivityLog,
  Candidate,
  CandidateNote,
  CompanyLead,
  Job,
  JobApplication,
  JobReferral,
  Payout,
  Profile,
  Referral,
} from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const obj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" ? (v as Record<string, unknown>) : {};

export function toProfile(r: Row): Profile {
  return {
    id: r.id,
    authUserId: r.id,
    role: r.role,
    onboarded: Boolean(r.onboarded),
    invitedBy: r.invited_by ?? null,
    firstName: r.first_name ?? null,
    lastName: r.last_name ?? null,
    email: r.email,
    phone: r.phone ?? null,
    locationCity: r.location_city ?? null,
    locationState: r.location_state ?? null,
    linkedinUrl: r.linkedin_url ?? null,
    companyName: r.company_name ?? null,
    externalCrmId: r.external_crm_id ?? null,
    isActive: r.is_active ?? true,
    metadata: obj(r.metadata),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function toCandidate(r: Row): Candidate {
  return {
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    email: r.email ?? null,
    phone: r.phone ?? null,
    locationCity: r.location_city ?? null,
    locationState: r.location_state ?? null,
    currentJobTitle: r.current_job_title ?? null,
    trade: r.trade ?? null,
    yearsExperience: r.years_experience ?? null,
    linkedinUrl: r.linkedin_url ?? null,
    resumeUrl: r.resume_url ?? null,
    notes: r.notes ?? null,
    sourceType: r.source_type,
    primaryReferrerUserId: r.primary_referrer_user_id ?? null,
    duplicateOfCandidateId: r.duplicate_of_candidate_id ?? null,
    status: r.status,
    externalCrmId: r.external_crm_id ?? null,
    metadata: obj(r.metadata),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function toReferral(r: Row): Referral {
  return {
    id: r.id,
    candidateId: r.candidate_id,
    referrerUserId: r.referrer_user_id,
    referralSource: r.referral_source ?? null,
    status: r.status,
    isPrimary: Boolean(r.is_primary),
    duplicateStatus: r.duplicate_status,
    notes: r.notes ?? null,
    metadata: obj(r.metadata),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

/**
 * A partner who submitted a duplicate can't read the original candidate
 * record (RLS). Rebuild what *they* typed from the referral snapshot so
 * their list still shows the person — without leaking the original.
 */
export function candidateFromReferralSnapshot(r: Referral): Candidate {
  const s = obj(r.metadata.submitted) as Record<string, string | undefined>;
  return {
    id: r.candidateId,
    firstName: s.first_name ?? "Referred",
    lastName: s.last_name ?? "contact",
    email: s.email || null,
    phone: s.phone || null,
    locationCity: s.location_city || null,
    locationState: s.location_state || null,
    currentJobTitle: s.current_job_title || null,
    trade: s.trade || null,
    yearsExperience: s.years_experience ? Number(s.years_experience) : null,
    linkedinUrl: s.linkedin_url || null,
    resumeUrl: null,
    notes: r.notes,
    sourceType: "referred",
    primaryReferrerUserId: null,
    duplicateOfCandidateId: null,
    status: r.status,
    externalCrmId: null,
    metadata: { snapshot: true },
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export function toJob(r: Row): Job {
  return {
    id: r.id,
    title: r.title,
    companyName: r.company_name ?? null,
    isCompanyPublic: Boolean(r.is_company_public),
    locationCity: r.location_city ?? null,
    locationState: r.location_state ?? null,
    jobType: r.job_type ?? null,
    trade: r.trade ?? null,
    description: r.description ?? null,
    requirements: r.requirements ?? null,
    compensationMin: r.compensation_min ?? null,
    compensationMax: r.compensation_max ?? null,
    compensationDisplay: r.compensation_display ?? null,
    startDate: r.start_date ?? null,
    urgency: r.urgency,
    status: r.status,
    isPublic: Boolean(r.is_public),
    referralPayoutAmount: r.referral_payout_amount ?? null,
    referralPayoutDisplay: r.referral_payout_display ?? null,
    internalNotes: r.internal_notes ?? null,
    externalCrmId: r.external_crm_id ?? null,
    metadata: obj(r.metadata),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function toJobReferral(r: Row): JobReferral {
  return {
    id: r.id,
    jobId: r.job_id,
    candidateId: r.candidate_id,
    referrerUserId: r.referrer_user_id,
    status: r.status,
    notes: r.notes ?? null,
    metadata: obj(r.metadata),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function toApplication(r: Row): JobApplication {
  return {
    id: r.id,
    jobId: r.job_id,
    candidateId: r.candidate_id,
    applicantUserId: r.applicant_user_id ?? null,
    status: r.status,
    resumeUrl: r.resume_url ?? null,
    linkedinUrl: r.linkedin_url ?? null,
    notes: r.notes ?? null,
    metadata: obj(r.metadata),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function toCompanyLead(r: Row): CompanyLead {
  return {
    id: r.id,
    companyName: r.company_name,
    contactName: r.contact_name,
    email: r.email,
    phone: r.phone ?? null,
    location: r.location ?? null,
    roleNeeded: r.role_needed ?? null,
    numberOfCandidates: r.number_of_candidates ?? null,
    startDate: r.start_date ?? null,
    compensationRange: r.compensation_range ?? null,
    jobDescription: r.job_description ?? null,
    urgency: r.urgency,
    status: r.status,
    notes: r.notes ?? null,
    assignedToUserId: r.assigned_to_user_id ?? null,
    externalCrmId: r.external_crm_id ?? null,
    metadata: obj(r.metadata),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function toPayout(r: Row): Payout {
  return {
    id: r.id,
    candidateId: r.candidate_id,
    referrerUserId: r.referrer_user_id,
    jobId: r.job_id ?? null,
    amountCents: r.amount_cents ?? 0,
    status: r.status,
    placementDate: r.placement_date ?? null,
    approvedAt: r.approved_at ?? null,
    paidAt: r.paid_at ?? null,
    notes: r.notes ?? null,
    metadata: obj(r.metadata),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function toActivity(r: Row): ActivityLog {
  return {
    id: r.id,
    actorUserId: r.actor_user_id ?? null,
    entityType: r.entity_type,
    entityId: r.entity_id ?? null,
    action: r.action,
    metadata: obj(r.metadata),
    createdAt: r.created_at,
  };
}

export function toCandidateNote(r: Row): CandidateNote {
  return {
    id: r.id,
    candidateId: r.candidate_id,
    authorUserId: r.author_user_id ?? null,
    body: r.body,
    createdAt: r.created_at,
  };
}

/** Embedded relations may come back as an object, array, or null. */
export function one<T>(v: unknown, map: (r: Row) => T): T | null {
  if (!v) return null;
  if (Array.isArray(v)) return v.length ? map(v[0]) : null;
  return map(v as Row);
}
