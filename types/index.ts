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
  | "self_signup"
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

export type StaffRole = "owner" | "account_manager" | "recruiter";
export type SignupSource = "organic" | "recruiter" | "member_invite";

/** A Delta team member: owner, account manager, or recruiter (admin-only data). */
export interface Staff {
  id: string;
  /** Their ECRN login, if they have one. */
  profileId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  staffRole: StaffRole;
  /** The account manager a recruiter reports to. */
  managerId: string | null;
  /** Personal code: ecrn.com/r/CODE and the sign-up "invite code". */
  inviteCode: string;
  specialties: string[];
  territories: string[];
  /** Bullhorn CorporateUser id. */
  externalCrmId: string | null;
  isActive: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type OnboardingIntent = "job" | "open" | "refer" | "both";
export type CareerStatus = "actively_looking" | "open_to_offers" | "not_looking";

export interface Profile {
  id: string;
  /** Same as id — profiles.id is the Supabase auth user id. */
  authUserId: string | null;
  role: UserRole;
  /** True once the user has picked their role during onboarding. */
  onboarded: boolean;
  invitedBy: string | null;
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
  /** Onboarding answers (0006) */
  intent: OnboardingIntent | null;
  careerStatus: CareerStatus | null;
  discipline: string | null;
  yearsExperience: string | null;
  locationLat: number | null;
  locationLng: number | null;
  relocation: "yes" | "maybe" | "no" | null;
  moveMotivators: string[];
  currentEmployer: string | null;
  resumePath: string | null;
  resumeUploadedAt: string | null;
  resumeBuilder: Record<string, unknown>;
  onboardingCompletedAt: string | null;
  tourCompletedAt: string | null;
  /** Attribution (0008): the Delta recruiter credited with this sign-up. */
  recruitedByStaffId: string | null;
  signupSource: SignupSource;
  signupPlatform: string | null;
  lastSeenAt: string | null;
  lastPlatform: string | null;
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
  currentCompany: string | null;
  trade: string | null;
  yearsExperience: number | null;
  linkedinUrl: string | null;
  resumeUrl: string | null;
  resumePath: string | null;
  notes: string | null;
  userId: string | null;
  careerStatus: CareerStatus | null;
  relocation: string | null;
  moveMotivators: string[];
  isConfidential: boolean;
  /** Routing (0008): owning account manager + assigned recruiter (staff ids). */
  accountManagerId: string | null;
  recruiterId: string | null;
  routedAt: string | null;
  routingReason: string | null;
  sourceType: CandidateSource;
  primaryReferrerUserId: string | null;
  duplicateOfCandidateId: string | null;
  status: ReferralStatus;
  externalCrmId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Admin-only internal note on a candidate. */
export interface CandidateNote {
  id: string;
  candidateId: string;
  authorUserId: string | null;
  body: string;
  createdAt: string;
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
  locationLat: number | null;
  locationLng: number | null;
  /** The account manager (staff id) who owns this job. */
  accountManagerId: string | null;
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
  accountManagerId: string | null;
  recruiterId: string | null;
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
  accountManagerId: string | null;
  recruiterId: string | null;
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
