/**
 * Shared TypeScript types for ECRN.
 *
 * These match the Supabase schema in `supabase/migrations/` 1:1. The mock
 * data store uses these same types so we can swap backends without
 * changing any page or component.
 */

export type UserRole = "admin" | "referral_partner" | "candidate" | "company_contact";

export type CandidateSource =
  | "referred"
  | "direct_application"
  | "admin_import"
  | "company_submission";

export type ReferralStatus =
  | "submitted"
  | "duplicate_review"
  | "new"
  | "contacted"
  | "qualified"
  | "not_qualified"
  | "submitted_to_job"
  | "interviewing"
  | "offer_stage"
  | "placed"
  | "payout_pending"
  | "payout_approved"
  | "payout_paid"
  | "rejected"
  | "inactive";

export type JobStatus = "draft" | "open" | "paused" | "filled" | "archived";

export type JobUrgency = "low" | "normal" | "high" | "critical";

export type ApplicationStatus =
  | "submitted"
  | "reviewing"
  | "interviewing"
  | "offer"
  | "hired"
  | "rejected"
  | "withdrawn";

export type CompanyLeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "engaged"
  | "won"
  | "lost"
  | "archived";

export type PayoutStatus = "pending" | "approved" | "paid" | "denied" | "disputed";

export type DuplicateStatus =
  | "unique"
  | "pending_review"
  | "confirmed_duplicate"
  | "overridden_primary";

export type NotificationChannel = "email" | "sms" | "push" | "inapp";

export type NotificationStatus = "queued" | "sent" | "delivered" | "failed" | "opt_out";

// ─────────────────────────────────────────────────────────────────────
// Domain entities
// ─────────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  authUserId: string | null;
  role: UserRole;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  locationCity: string | null;
  locationState: string | null;
  linkedinUrl: string | null;
  companyName: string | null;
  externalCrmId: string | null;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  locationCity: string | null;
  locationState: string | null;
  currentJobTitle: string | null;
  trade: string | null;
  yearsExperience: number | null;
  linkedinUrl: string | null;
  resumeUrl: string | null;
  notes: string | null;
  sourceType: CandidateSource;
  primaryReferrerUserId: string | null;
  duplicateOfCandidateId: string | null;
  status: ReferralStatus;
  externalCrmId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Referral {
  id: string;
  candidateId: string;
  referrerUserId: string;
  referralSource: string | null;
  status: ReferralStatus;
  isPrimary: boolean;
  duplicateStatus: DuplicateStatus;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  title: string;
  companyName: string | null;
  isCompanyPublic: boolean;
  locationCity: string | null;
  locationState: string | null;
  jobType: string | null;
  trade: string | null;
  description: string | null;
  requirements: string | null;
  compensationMin: number | null;
  compensationMax: number | null;
  compensationDisplay: string | null;
  startDate: string | null;
  urgency: JobUrgency;
  status: JobStatus;
  isPublic: boolean;
  referralPayoutAmount: number | null;
  referralPayoutDisplay: string | null;
  internalNotes: string | null;
  externalCrmId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface JobReferral {
  id: string;
  jobId: string;
  candidateId: string;
  referrerUserId: string;
  status: ReferralStatus;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  candidateId: string;
  applicantUserId: string | null;
  status: ApplicationStatus;
  resumeUrl: string | null;
  linkedinUrl: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyLead {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string | null;
  location: string | null;
  roleNeeded: string | null;
  numberOfCandidates: number | null;
  startDate: string | null;
  compensationRange: string | null;
  jobDescription: string | null;
  urgency: JobUrgency;
  status: CompanyLeadStatus;
  notes: string | null;
  assignedToUserId: string | null;
  externalCrmId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Payout {
  id: string;
  candidateId: string;
  referrerUserId: string;
  jobId: string | null;
  amountCents: number;
  status: PayoutStatus;
  placementDate: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  actorUserId: string | null;
  entityType: string;
  entityId: string | null;
  action: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationEvent {
  id: string;
  userId: string | null;
  eventType: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  payload: Record<string, unknown>;
  providerId: string | null;
  error: string | null;
  createdAt: string;
}

export interface Integration {
  id: string;
  provider: string;
  status: "active" | "inactive" | "error";
  config: Record<string, unknown>;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────
// Session shape — what the mock auth + future Supabase auth both return
// ─────────────────────────────────────────────────────────────────────

export interface Session {
  profile: Profile;
}
