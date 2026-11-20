import type { ActivityLog } from "@/types";

/**
 * Turns an `activity_logs` row into something a person can read.
 *
 * Pure functions, no database access: pass whatever lookups you have
 * (a staff map is enough for routing sentences) and the rest falls back
 * to generic wording. Safe to import from server or client code.
 */

/** Every action the app or the database writes. Used for the filter menu. */
export const ACTIVITY_ACTIONS = [
  "account_created",
  "onboarding_completed",
  "role_set",
  "invite_code_claimed",
  "attribution_changed",
  "referral_submitted",
  "duplicate_detected",
  "referred_to_job",
  "application_submitted",
  "status_changed",
  "note_added",
  "primary_referrer_reassigned",
  "routed",
  "assigned",
  "account_deactivated",
  "account_reactivated",
  "account_deleted",
  "company_lead_submitted",
  "created",
  "updated",
  "crm_linked",
  "placement_recorded",
  "placement_cancelled",
  "demo_data_cleared",
] as const;

export const ACTION_LABEL: Record<string, string> = {
  account_created: "Account created",
  onboarding_completed: "Onboarding finished",
  role_set: "Role set",
  invite_code_claimed: "Recruiter code claimed",
  attribution_changed: "Recruiter credit changed",
  referral_submitted: "Referral submitted",
  duplicate_detected: "Duplicate referral",
  referred_to_job: "Referred to a job",
  application_submitted: "Application submitted",
  status_changed: "Status changed",
  note_added: "Note added",
  primary_referrer_reassigned: "Referral credit moved",
  routed: "Routed automatically",
  assigned: "Assigned by an admin",
  account_deactivated: "Account deactivated",
  account_reactivated: "Account reactivated",
  account_deleted: "Account deleted",
  company_lead_submitted: "Hiring request submitted",
  created: "Created",
  updated: "Updated",
  crm_linked: "Linked to Bullhorn",
  placement_recorded: "Placement recorded",
  placement_cancelled: "Placement cancelled",
  demo_data_cleared: "Demo data removed",
};

export const ACTIVITY_ENTITY_TYPES = [
  "profile",
  "candidate",
  "referral",
  "job_referral",
  "job_application",
  "job",
  "payout",
  "company_lead",
  "staff",
] as const;

export const ENTITY_LABEL: Record<string, string> = {
  profile: "Member",
  candidate: "Candidate",
  referral: "Referral",
  job_referral: "Job referral",
  job_application: "Application",
  job: "Job",
  payout: "Payout",
  company_lead: "Company",
  staff: "Team member",
};

export const ROUTING_REASON_LABEL: Record<string, string> = {
  job_owner: "owns the job",
  recruiter_attribution: "recruiter who signed them up",
  territory: "covers their state",
  manual: "set by hand",
  bullhorn: "from Bullhorn",
};

const INTENT_PHRASE: Record<string, string> = {
  job: "looking for work",
  open: "open to the right move",
  refer: "here to refer",
  both: "looking for work and referring",
};

const SOURCE_PHRASE: Record<string, string> = {
  organic: "organic",
  recruiter: "recruiter code",
  member_invite: "member invite",
};

const PIPELINE_STATUS: Record<string, string> = {
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

const APPLICATION_STATUS: Record<string, string> = {
  submitted: "Submitted",
  reviewing: "Under review",
  interviewing: "Interviewing",
  offer: "Offer",
  hired: "Hired",
  rejected: "Not selected",
  withdrawn: "Withdrawn",
};

/** Names and links the sentences can use. Every field is optional. */
export interface ActivityLookups {
  /** staff id → full name */
  staff?: Record<string, string>;
  /** profile id → name (and whether it is an admin account) */
  profiles?: Record<string, { name: string; isAdmin?: boolean }>;
  /** candidate id → full name */
  candidates?: Record<string, string>;
  /** job id → title */
  jobs?: Record<string, string>;
  /** company lead id → company name */
  companies?: Record<string, string>;
  /** referral / job referral / application / payout id → what it points at */
  links?: Record<string, { candidateId?: string | null; jobId?: string | null }>;
}

type Log = Pick<ActivityLog, "action" | "entityType" | "entityId" | "metadata">;

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);

export function humanize(s: string | null | undefined): string {
  const t = (s ?? "").replace(/_/g, " ").trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : "";
}

export function actionLabel(action: string): string {
  return ACTION_LABEL[action] ?? humanize(action);
}

export function entityLabel(entityType: string): string {
  return ENTITY_LABEL[entityType] ?? humanize(entityType);
}

export function statusWord(entityType: string, status: unknown): string {
  const s = str(status);
  if (!s) return "none";
  if (entityType === "job_application") return APPLICATION_STATUS[s] ?? humanize(s);
  if (entityType === "candidate" || entityType === "referral" || entityType === "job_referral") {
    return PIPELINE_STATUS[s] ?? humanize(s);
  }
  return humanize(s);
}

function money(cents: unknown): string | null {
  return typeof cents === "number" && Number.isFinite(cents) ? `$${Math.round(cents / 100).toLocaleString("en-US")}` : null;
}

/** The candidate and job a log row is about, from its metadata or the lookups. */
function related(log: Log, l: ActivityLookups): { candidateId: string | null; jobId: string | null } {
  const link = log.entityId ? l.links?.[log.entityId] : undefined;
  return {
    candidateId:
      log.entityType === "candidate" ? log.entityId : str(log.metadata.candidate_id) ?? link?.candidateId ?? null,
    jobId: log.entityType === "job" ? log.entityId : str(log.metadata.job_id) ?? link?.jobId ?? null,
  };
}

/**
 * What happened, as a phrase that reads after the actor's name:
 * "changed status from Contacted to Qualified", "routed to Dana Reyes (owns the job)".
 */
export function describeActivity(log: Log, lookups: ActivityLookups = {}): string {
  const m = log.metadata ?? {};
  const staff = (id: unknown) => {
    const s = str(id);
    return s ? lookups.staff?.[s] ?? "a team member" : null;
  };
  const person = (id: unknown) => {
    const s = str(id);
    return s ? lookups.profiles?.[s]?.name ?? "another member" : null;
  };
  const { candidateId, jobId } = related(log, lookups);
  const candidate = candidateId ? lookups.candidates?.[candidateId] ?? null : null;
  const job = jobId ? lookups.jobs?.[jobId] ?? null : null;

  switch (log.action) {
    case "account_created": {
      if (m.admin === true) return "created an admin account";
      const recruiter = staff(m.recruited_by_staff_id);
      const inviter = person(m.invited_by);
      if (inviter && recruiter) return `created an account, invited by ${inviter} (credit to ${recruiter})`;
      if (inviter) return `created an account, invited by ${inviter}`;
      if (recruiter) return `created an account through ${recruiter}'s link`;
      return "created an account";
    }
    case "onboarding_completed": {
      const intent = str(m.intent);
      return intent && INTENT_PHRASE[intent] ? `finished onboarding (${INTENT_PHRASE[intent]})` : "finished onboarding";
    }
    case "role_set":
      return str(m.role) ? `set their role to ${humanize(str(m.role)).toLowerCase()}` : "set their role";
    case "invite_code_claimed": {
      const s = staff(m.staff_id);
      return s ? `linked their account to ${s}` : "linked their account to a recruiter";
    }
    case "attribution_changed": {
      const from = staff(m.from_staff_id);
      const to = staff(m.to_staff_id);
      const fromSource = str(m.from_source);
      const toSource = str(m.to_source);
      const source = toSource && toSource !== fromSource ? `, source now ${SOURCE_PHRASE[toSource] ?? humanize(toSource).toLowerCase()}` : "";
      if (str(m.from_staff_id) === str(m.to_staff_id)) {
        return toSource ? `changed sign-up source to ${SOURCE_PHRASE[toSource] ?? humanize(toSource).toLowerCase()}` : "changed attribution";
      }
      if (from && to) return `moved recruiter credit from ${from} to ${to}${source}`;
      if (to) return `gave recruiter credit to ${to}${source}`;
      if (from) return `removed recruiter credit from ${from}${source}`;
      return "changed attribution";
    }
    case "referral_submitted":
      if (candidate && job) return `referred ${candidate} for ${job}`;
      if (candidate) return `referred ${candidate}`;
      return job ? `submitted a referral for ${job}` : "submitted a referral";
    case "duplicate_detected": {
      const reason = str(m.reason);
      const who = candidate ? `${candidate}, who was` : "someone";
      return `referred ${who} already in the network${reason ? ` (matched on ${humanize(reason).toLowerCase()})` : ""}`;
    }
    case "referred_to_job":
      if (candidate && job) return `put ${candidate} forward for ${job}`;
      return job ? `put their referral forward for ${job}` : "put their referral forward for a job";
    case "application_submitted":
      return job ? `applied to ${job}` : "applied to a job";
    case "status_changed": {
      const to = statusWord(log.entityType, m.to);
      const from = str(m.from) ? statusWord(log.entityType, m.from) : null;
      const what = log.entityType === "payout" ? "payout status" : log.entityType === "job" ? "job status" : "status";
      const amount = log.entityType === "payout" ? money(m.amount_cents) : null;
      const tail = amount ? ` (${amount})` : "";
      return from && from !== to ? `changed ${what} from ${from} to ${to}${tail}` : `set ${what} to ${to}${tail}`;
    }
    case "note_added":
      return "added a note";
    case "primary_referrer_reassigned": {
      const from = person(m.from);
      const to = person(m.to);
      if (from && to) return `moved referral credit from ${from} to ${to}`;
      return to ? `gave referral credit to ${to}` : "changed who gets referral credit";
    }
    case "routed": {
      const am = staff(m.account_manager_id);
      const rec = staff(m.recruiter_id);
      const reason = str(m.reason);
      const why = reason ? ` (${ROUTING_REASON_LABEL[reason] ?? humanize(reason).toLowerCase()})` : "";
      if (am && rec) return `routed to ${am}, recruiter ${rec}${why}`;
      if (am) return `routed to ${am}${why}`;
      if (rec) return `routed to recruiter ${rec}${why}`;
      return `routed${why}`;
    }
    case "assigned": {
      const am = staff(m.account_manager_id);
      const rec = staff(m.recruiter_id);
      if (am && rec) return `assigned to ${am}, recruiter ${rec}`;
      if (am) return `assigned to ${am}`;
      if (rec) return `assigned to recruiter ${rec}`;
      return "cleared the assignment";
    }
    case "account_deactivated":
      return "deactivated the account";
    case "account_reactivated":
      return "reactivated the account";
    case "account_deleted":
      return "account deleted by the member";
    case "company_lead_submitted":
      return "submitted a hiring request";
    case "created":
      if (log.entityType === "job") return str(m.title) ? `created the job ${str(m.title)}` : "created a job";
      return `created a ${entityLabel(log.entityType).toLowerCase()}`;
    case "updated":
      if (log.entityType === "job") return job ? `updated the job ${job}` : "updated a job";
      return `updated a ${entityLabel(log.entityType).toLowerCase()}`;
    default:
      return humanize(log.action).toLowerCase() || "did something";
  }
}

/** The record a log row is about: what to call it and where to open it. */
export function activityEntity(
  log: Log,
  lookups: ActivityLookups = {}
): { kind: string; name: string | null; href: string | null } {
  const id = log.entityId;
  const kind = entityLabel(log.entityType);
  const { candidateId, jobId } = related(log, lookups);
  const candidateName = candidateId ? lookups.candidates?.[candidateId] ?? null : null;
  const jobTitle = jobId ? lookups.jobs?.[jobId] ?? null : null;

  switch (log.entityType) {
    case "profile": {
      const p = id ? lookups.profiles?.[id] : undefined;
      // A deleted account has no page to open; admins are not in the members directory.
      const gone = log.action === "account_deleted" || (lookups.profiles !== undefined && !p);
      return {
        kind: p?.isAdmin ? "Admin" : kind,
        name: p?.name ?? null,
        href: id && !gone && !p?.isAdmin ? `/admin/members/${id}` : null,
      };
    }
    case "candidate":
      return { kind, name: candidateName, href: id ? `/admin/candidates/${id}` : null };
    case "referral":
    case "job_referral":
      return {
        kind,
        name: candidateName,
        href: candidateId ? `/admin/candidates/${candidateId}` : "/admin/referrals",
      };
    case "job_application":
      return {
        kind,
        name: [candidateName, jobTitle].filter(Boolean).join(" for ") || null,
        href: "/admin/applications",
      };
    case "job":
      return { kind, name: jobTitle ?? str(log.metadata.title), href: id ? `/admin/jobs/${id}/edit` : "/admin/jobs" };
    case "payout":
      return { kind, name: candidateName, href: "/admin/payouts" };
    case "company_lead":
      return { kind, name: id ? lookups.companies?.[id] ?? null : null, href: id ? `/admin/companies/${id}` : "/admin/companies" };
    case "staff":
      return { kind, name: id ? lookups.staff?.[id] ?? null : null, href: id ? `/admin/team/${id}` : "/admin/team" };
    default:
      return { kind, name: null, href: null };
  }
}
