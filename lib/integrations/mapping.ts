/**
 * ECRN ↔ Bullhorn mapping tables (pure data, no I/O).
 *
 * One place for: status text, field names, and the list of events in each
 * direction. The inbound handlers read the status tables from here, Admin →
 * Integrations → Field mapping renders them, and docs/BULLHORN_INTEGRATION.md
 * repeats them for whoever provides API access. Keep the three in step.
 *
 * Bullhorn status lists are configurable per company. The values below are
 * Bullhorn's defaults plus common variants; confirm them against Delta's
 * instance and add or move lines here (nothing else needs to change).
 */

import type { ApplicationStatus, JobStatus, ReferralStatus } from "@/types";

/** "Client Submission" / "client_submission" / " CLIENT-SUBMISSION " → "client submission". */
export function normKey(v: string | null | undefined): string {
  return (v ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export interface StatusGroup<T extends string> {
  /** ECRN value, or null when the Bullhorn text is stored but changes nothing. */
  ecrn: T | null;
  bullhorn: string[];
  note?: string;
}

function lookup<T extends string>(groups: StatusGroup<T>[]): Map<string, T | null> {
  const m = new Map<string, T | null>();
  for (const g of groups) for (const b of g.bullhorn) m.set(normKey(b), g.ecrn);
  return m;
}

// ── Candidate.status → candidates.status (referral_status) ───────────
export const CANDIDATE_STATUS_GROUPS: StatusGroup<ReferralStatus>[] = [
  { ecrn: "new", bullhorn: ["New Lead", "New", "Lead", "Referred", "Referral"] },
  { ecrn: "contacted", bullhorn: ["Contacted", "Attempted Contact", "Left Message", "In Contact", "Phone Screen", "Screening"] },
  { ecrn: "qualified", bullhorn: ["Qualified", "Pre-Qualified", "Screened", "Available"] },
  { ecrn: "not_qualified", bullhorn: ["Not Qualified", "Unqualified", "Not a Fit", "DNU", "Do Not Use"] },
  {
    ecrn: "submitted_to_job",
    bullhorn: ["Submitted", "Submitted to Job", "Internal Submission", "Client Submission", "Submitted to Client"],
  },
  { ecrn: "interviewing", bullhorn: ["Interviewing", "Interview", "Interview Scheduled", "Client Interview"] },
  { ecrn: "offer_stage", bullhorn: ["Offer", "Offer Stage", "Offer Extended", "Offer Out", "Offer Accepted"] },
  {
    ecrn: "placed",
    bullhorn: ["Placed", "Hired", "Placement", "Started", "On Assignment"],
    note: "Creates a pending payout for the referrer (database trigger).",
  },
  { ecrn: "rejected", bullhorn: ["Rejected", "Client Rejected", "Declined", "Candidate Not Interested", "Withdrawn"] },
  { ecrn: "inactive", bullhorn: ["Inactive", "Archive", "Archived", "Unavailable", "Do Not Contact"] },
  {
    ecrn: null,
    bullhorn: ["Active", "Passive", "Private"],
    note: "Describes availability, not a pipeline stage. Kept in the mirror, ECRN status is left alone.",
  },
];
const CANDIDATE_STATUS = lookup(CANDIDATE_STATUS_GROUPS);

/** ECRN statuses Bullhorn may set directly through `ecrnStatus`. Payout stages stay ECRN-only. */
const REFERRAL_STATUS_SETTABLE: ReferralStatus[] = [
  "new", "contacted", "qualified", "not_qualified", "submitted_to_job", "interviewing", "offer_stage", "placed", "rejected", "inactive",
];

export function mapCandidateStatus(bullhornStatus: string | null, ecrnStatus?: string | null): ReferralStatus | null {
  const direct = (ecrnStatus ?? "").trim().toLowerCase() as ReferralStatus;
  if (REFERRAL_STATUS_SETTABLE.includes(direct)) return direct;
  return CANDIDATE_STATUS.get(normKey(bullhornStatus)) ?? null;
}

// ── JobSubmission.status → job_applications.status ───────────────────
export const SUBMISSION_STATUS_GROUPS: StatusGroup<ApplicationStatus>[] = [
  { ecrn: "submitted", bullhorn: ["New Lead", "Web Response", "New", "Applied", "Application Received"] },
  {
    ecrn: "reviewing",
    bullhorn: [
      "Submitted", "Internally Submitted", "Internal Submission", "Sales Rep Submission", "Client Submission",
      "Submitted to Client", "Reviewing", "Under Review", "In Review", "Shortlisted",
    ],
    note: 'In Bullhorn "Submitted" means a recruiter put the person forward, so the member sees "Reviewing".',
  },
  {
    ecrn: "interviewing",
    bullhorn: ["Interview Scheduled", "Interviewing", "Interview", "Client Interview", "First Interview", "Second Interview", "Final Interview"],
  },
  { ecrn: "offer", bullhorn: ["Offer Extended", "Offer", "Offer Out", "Offer Accepted", "Offer Stage"] },
  { ecrn: "hired", bullhorn: ["Placed", "Hired", "Placement", "Started"] },
  { ecrn: "rejected", bullhorn: ["Client Rejected", "Rejected", "Sales Rep Rejected", "Not a Fit", "Not Qualified"] },
  {
    ecrn: "withdrawn",
    bullhorn: ["Candidate Not Interested", "Withdrawn", "Candidate Withdrew", "Offer Rejected", "Offer Declined"],
  },
];
const SUBMISSION_STATUS = lookup(SUBMISSION_STATUS_GROUPS);
const APPLICATION_STATUSES: ApplicationStatus[] = ["submitted", "reviewing", "interviewing", "offer", "hired", "rejected", "withdrawn"];

export function mapSubmissionStatus(bullhornStatus: string | null, ecrnStatus?: string | null): ApplicationStatus | null {
  const direct = (ecrnStatus ?? "").trim().toLowerCase() as ApplicationStatus;
  if (APPLICATION_STATUSES.includes(direct)) return direct;
  return SUBMISSION_STATUS.get(normKey(bullhornStatus)) ?? null;
}

/** When a submission belongs to a job referral (no application), the same progress on the referral. */
export const APPLICATION_TO_REFERRAL_STATUS: Record<ApplicationStatus, ReferralStatus> = {
  submitted: "submitted_to_job",
  reviewing: "submitted_to_job",
  interviewing: "interviewing",
  offer: "offer_stage",
  hired: "placed",
  rejected: "rejected",
  withdrawn: "inactive",
};

// ── JobOrder.status → jobs.status ────────────────────────────────────
export const JOB_STATUS_GROUPS: StatusGroup<JobStatus>[] = [
  { ecrn: "open", bullhorn: ["Accepting Candidates", "Currently Interviewing", "Accepting Submissions", "Open", "Active"] },
  { ecrn: "paused", bullhorn: ["Covered", "Offer Out", "On Hold", "Hold", "Paused"] },
  { ecrn: "filled", bullhorn: ["Placed", "Filled"] },
  { ecrn: "archived", bullhorn: ["Lost", "Canceled", "Cancelled", "Closed", "Archive", "Archived", "Inactive"] },
];
const JOB_STATUS = lookup(JOB_STATUS_GROUPS);

/**
 * Status text wins; when the text is unknown, Bullhorn's `isOpen` flag decides
 * (true → open, false → archived). Returns null when neither says anything.
 */
export function mapJobStatus(bullhornStatus: string | null, isOpen: boolean | null): JobStatus | null {
  const mapped = JOB_STATUS.get(normKey(bullhornStatus));
  if (mapped) return mapped;
  if (isOpen === true) return "open";
  if (isOpen === false) return "archived";
  return null;
}

// ── JobOrder.employmentType → jobs.job_type ──────────────────────────
const EMPLOYMENT_TYPE: Record<string, string> = {
  "direct hire": "Full-time",
  permanent: "Full-time",
  perm: "Full-time",
  "full time": "Full-time",
  fte: "Full-time",
  contract: "Contract",
  temporary: "Contract",
  temp: "Contract",
  "contract to hire": "Contract-to-hire",
  "temp to perm": "Contract-to-hire",
  "temp to hire": "Contract-to-hire",
  "part time": "Part-time",
};
export const EMPLOYMENT_TYPE_ROWS: { bullhorn: string; ecrn: string }[] = [
  { bullhorn: "Direct Hire, Permanent, Full Time", ecrn: "Full-time" },
  { bullhorn: "Contract, Temporary", ecrn: "Contract" },
  { bullhorn: "Contract To Hire, Temp to Perm", ecrn: "Contract-to-hire" },
  { bullhorn: "Part Time", ecrn: "Part-time" },
  { bullhorn: "Anything else", ecrn: "Kept as Bullhorn wrote it" },
];
export function mapEmploymentType(v: string | null): string | null {
  if (!v) return null;
  return EMPLOYMENT_TYPE[normKey(v)] ?? v;
}

/** Bullhorn category text → the trade values the ECRN job form uses. */
export function mapTrade(v: string | null): string | null {
  const k = normKey(v);
  if (!k) return null;
  const slug = k.replace(/ /g, "_");
  if (["electrical", "mechanical", "general_construction", "plumbing", "low_voltage", "other"].includes(slug)) return slug;
  if (/low volt|fire alarm|security|data ?com|telecom/.test(k)) return "low_voltage";
  if (/electric/.test(k)) return "electrical";
  if (/mechanic|hvac/.test(k)) return "mechanical";
  if (/plumb|pipe/.test(k)) return "plumbing";
  if (/construction|superintend|project manag|estimat/.test(k)) return "general_construction";
  return "other";
}

// ── Field mapping (shown in the admin and the hand-off document) ─────
export type Direction = "out" | "in" | "both";
export interface FieldRow {
  ecrn: string;
  bullhorn: string;
  direction: Direction;
  note?: string;
}
export interface EntityMapping {
  entity: string;
  ecrnTable: string;
  summary: string;
  rows: FieldRow[];
}

export const DIRECTION_LABEL: Record<Direction, string> = {
  out: "ECRN → Bullhorn",
  in: "Bullhorn → ECRN",
  both: "Both ways",
};

export const FIELD_MAPPINGS: EntityMapping[] = [
  {
    entity: "Candidate",
    ecrnTable: "candidates",
    summary:
      "People enter ECRN first (sign-up, referral, application) and are pushed out. Coming back, Bullhorn only sets the link, the status and the owner. ECRN never overwrites a member's own contact details from Bullhorn.",
    rows: [
      { ecrn: "candidates.id", bullhorn: "externalID (also sent as ecrnId)", direction: "both", note: "The key ECRN matches on first." },
      { ecrn: "candidates.external_crm_id", bullhorn: "id", direction: "in", note: "Saved by candidate.linked." },
      { ecrn: "first_name, last_name", bullhorn: "firstName, lastName", direction: "out" },
      { ecrn: "email", bullhorn: "email", direction: "out", note: "Last-resort match for inbound events." },
      { ecrn: "phone", bullhorn: "mobile", direction: "out" },
      { ecrn: "current_job_title", bullhorn: "occupation", direction: "out" },
      { ecrn: "current_company", bullhorn: "companyName", direction: "out" },
      { ecrn: "location_city, location_state", bullhorn: "address.city, address.state", direction: "out" },
      { ecrn: "status", bullhorn: "status", direction: "both", note: "Outbound sends the ECRN value. Inbound goes through the candidate status table." },
      { ecrn: "source_type", bullhorn: "source", direction: "out", note: "ECRN Referral, ECRN App or ECRN." },
      { ecrn: "relocation", bullhorn: "willRelocate", direction: "out" },
      { ecrn: "career_status", bullhorn: "customText.careerStatus", direction: "out", note: "Active, Passive or Not Looking. Custom field number to be chosen by Delta." },
      { ecrn: "is_confidential", bullhorn: "customText.confidential", direction: "out", note: "True for employed people quietly open to a move." },
      { ecrn: "move_motivators", bullhorn: "customText.moveMotivators", direction: "out" },
      { ecrn: "years_experience", bullhorn: "customText.yearsExperience", direction: "out" },
      { ecrn: "linkedin_url", bullhorn: "customText.linkedin", direction: "out" },
      { ecrn: "resume_path", bullhorn: "customText.hasResume", direction: "out", note: "Flag only. The file transfer is a go-live decision." },
      { ecrn: "primary_referrer_user_id", bullhorn: "referredBy { firstName, lastName, email, mobile, ecrnId }", direction: "out" },
      { ecrn: "account_manager_id", bullhorn: "owner { id, name, email, ecrnId }", direction: "both", note: "id is the Bullhorn CorporateUser id." },
      { ecrn: "recruiter_id", bullhorn: "assignedRecruiter { id, name, email, ecrnId }", direction: "both" },
      { ecrn: "routing_reason", bullhorn: "routingReason", direction: "out", note: "Set to bullhorn when Bullhorn assigns the owner." },
    ],
  },
  {
    entity: "JobOrder",
    ecrnTable: "jobs",
    summary: "Jobs live in Bullhorn. Each job.upserted creates or updates the ECRN job and its owner.",
    rows: [
      { ecrn: "jobs.external_crm_id", bullhorn: "id", direction: "in" },
      { ecrn: "title", bullhorn: "title", direction: "in" },
      { ecrn: "location_city, location_state", bullhorn: "address.city, address.state", direction: "in", note: "State names become two-letter codes." },
      { ecrn: "job_type", bullhorn: "employmentType", direction: "in" },
      { ecrn: "compensation_min, compensation_max", bullhorn: "salary (or salaryLow, salaryHigh)", direction: "in", note: "Yearly dollars. Hourly rates only fill the display text." },
      { ecrn: "compensation_display", bullhorn: "salary + salaryUnit, payRate", direction: "in", note: "Left alone once an admin has rewritten it." },
      { ecrn: "description", bullhorn: "publicDescription, else description", direction: "in", note: "HTML is converted to plain text." },
      { ecrn: "status", bullhorn: "status, isOpen, isDeleted", direction: "in", note: "See the job status table." },
      { ecrn: "is_public", bullhorn: "isPublic", direction: "in", note: "New jobs are public unless the event says otherwise." },
      { ecrn: "account_manager_id", bullhorn: "owner.id", direction: "in", note: "Matched to staff.external_crm_id." },
      { ecrn: "job_recruiters", bullhorn: "assignedUsers", direction: "in", note: "The list is replaced each time it is sent." },
      { ecrn: "job_private.client_company", bullhorn: "clientCorporation.name", direction: "in", note: "Admin-only unless the event sets isCompanyPublic." },
      { ecrn: "trade", bullhorn: "publishedCategory.name (or categories)", direction: "in" },
      { ecrn: "start_date", bullhorn: "startDate", direction: "in" },
      { ecrn: "referral_payout_amount", bullhorn: "referralPayout (optional custom field, dollars)", direction: "in", note: "Otherwise set by an admin in ECRN." },
    ],
  },
  {
    entity: "JobSubmission",
    ecrnTable: "job_applications, job_referrals",
    summary: "An application or a job referral in ECRN is a JobSubmission in Bullhorn.",
    rows: [
      { ecrn: "job_applications.id / job_referrals.id", bullhorn: "ecrnId", direction: "both", note: "Send it back so ECRN can match without guessing." },
      { ecrn: "metadata.bullhorn_submission_id", bullhorn: "id", direction: "in" },
      { ecrn: "candidate_id", bullhorn: "candidateEcrnId, candidate { id, ecrnId, email }", direction: "both" },
      { ecrn: "job_id", bullhorn: "jobOrder { id, ecrnId, title }", direction: "both" },
      { ecrn: "status", bullhorn: "status", direction: "both", note: "Outbound sends the ECRN value. Inbound goes through the submission status table." },
      { ecrn: "notes", bullhorn: "comments", direction: "out" },
      { ecrn: "(application or referral)", bullhorn: "via", direction: "out", note: "Direct application or Referral." },
      { ecrn: "account_manager_id", bullhorn: "owner { id, name, email, ecrnId }", direction: "both" },
      { ecrn: "recruiter_id", bullhorn: "assignedRecruiter (inbound also accepts sendingUser)", direction: "both" },
    ],
  },
  {
    entity: "Placement",
    ecrnTable: "candidates, payouts",
    summary: "A placement marks the person as placed. ECRN's database then opens a pending payout for whoever referred them.",
    rows: [
      { ecrn: "candidates.status = placed", bullhorn: "Placement exists (not cancelled)", direction: "in" },
      { ecrn: "candidates (match)", bullhorn: "candidate { id, ecrnId, email }", direction: "in" },
      { ecrn: "job_applications.status = hired", bullhorn: "jobOrder { id, ecrnId }", direction: "in", note: "Only when the person applied to that job in ECRN." },
      { ecrn: "payouts (pending)", bullhorn: "(created by ECRN)", direction: "in", note: "Amount comes from the ECRN job's referral payout." },
      { ecrn: "crm_records.data", bullhorn: "salary, dateBegin, fee, employmentType, status", direction: "in", note: "Kept in the Bullhorn mirror." },
    ],
  },
  {
    entity: "CorporateUser",
    ecrnTable: "staff",
    summary: "Delta's team. Needed first, because job owners and candidate owners are matched to these rows.",
    rows: [
      { ecrn: "staff.external_crm_id", bullhorn: "id", direction: "both", note: "Sent back out as owner.id and assignedRecruiter.id." },
      { ecrn: "first_name, last_name", bullhorn: "firstName, lastName (or name)", direction: "in" },
      { ecrn: "email", bullhorn: "email", direction: "in", note: "Fallback match for people already in ECRN." },
      { ecrn: "phone", bullhorn: "mobile, else phone", direction: "in" },
      { ecrn: "title", bullhorn: "occupation", direction: "in" },
      { ecrn: "staff_role", bullhorn: "role, else guessed from occupation and userType", direction: "in", note: "Guess is used for new people only. A role set in ECRN is kept." },
      { ecrn: "manager_id", bullhorn: "reportToPerson.id (or manager.id)", direction: "in" },
      { ecrn: "is_active", bullhorn: "enabled, isDeleted", direction: "in" },
      { ecrn: "invite_code", bullhorn: "(created by ECRN)", direction: "in", note: "Made from the name for new people. Never changed afterwards." },
    ],
  },
];

// ── Event catalogue ──────────────────────────────────────────────────
export interface EventInfo {
  type: string;
  bullhornEntity: string;
  when: string;
}

export const OUTBOUND_EVENTS: EventInfo[] = [
  { type: "candidate.created", bullhornEntity: "Candidate", when: "A person enters ECRN: referred, applied, or finished sign-up as a job seeker." },
  { type: "candidate.updated", bullhornEntity: "Candidate", when: "Contact details, status, career signals, resume, owner or recruiter changed." },
  { type: "referral.created", bullhornEntity: "Referral", when: "A member referred someone (also sent for duplicate attempts)." },
  { type: "job_referral.created", bullhornEntity: "JobSubmission", when: "A member referred someone to a specific job." },
  { type: "job_referral.updated", bullhornEntity: "JobSubmission", when: "That job referral changed status or owner." },
  { type: "application.created", bullhornEntity: "JobSubmission", when: "A member applied to a job." },
  { type: "application.status_changed", bullhornEntity: "JobSubmission", when: "An application moved to a new status in ECRN." },
  { type: "application.assigned", bullhornEntity: "JobSubmission", when: "The account manager or recruiter on an application changed." },
  { type: "company_lead.created", bullhornEntity: "Lead", when: "A company sent a hiring request." },
  { type: "member.onboarded", bullhornEntity: "Member", when: "A member finished the onboarding questions." },
];

export const INBOUND_EVENTS: EventInfo[] = [
  { type: "user.upserted", bullhornEntity: "CorporateUser", when: "Creates or updates a team member (name, title, role, manager, active)." },
  { type: "job.upserted", bullhornEntity: "JobOrder", when: "Creates or updates a job, its owner and its recruiters." },
  { type: "job.closed", bullhornEntity: "JobOrder", when: "Marks the job filled or archived." },
  { type: "candidate.linked", bullhornEntity: "Candidate", when: "Saves the Bullhorn candidate id on the ECRN person." },
  { type: "candidate.updated", bullhornEntity: "Candidate", when: "Updates status and owner or recruiter." },
  { type: "submission.updated", bullhornEntity: "JobSubmission", when: "Updates the application (or job referral) status." },
  { type: "placement.created", bullhornEntity: "Placement", when: "Marks the person placed, which opens a pending payout." },
  { type: "placement.updated", bullhornEntity: "Placement", when: "Same as created. A cancelled placement is flagged for review, never reversed automatically." },
];
