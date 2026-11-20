import { CHART_COLORS, type Slice } from "@/components/admin/charts";
import type { Bucket, KeyCount } from "@/lib/admin/analytics";

/**
 * Plain-language labels and colours for the dashboard. Database values
 * (snake_case keys) are turned into words an owner would use.
 */

/** How the selected range is worded across the page. */
export interface Scope {
  /** null = all time. */
  days: number | null;
  /** Ends a sentence: "in the last 30 days" / "so far". */
  when: string;
  /** Stands alone, also used as a column heading: "Last 30 days" / "All time". */
  title: string;
}

export const C = {
  green: "#16C172",
  cobalt: "#0655CE",
  navy: "#00244B",
  sky: "#5BA8FF",
  forest: "#07653E",
  amber: "#F59E0B",
  mint: "#36DC86",
  ice: "#BCDFFF",
  slate: "#94A3B8",
  red: "#EF4444",
  /** "Not answered" / "nothing yet" slices. */
  none: "#CBD5E1",
} as const;

/** "job_referral.created" → "Job referral created". */
export function sentence(s: string | null | undefined): string {
  const t = (s ?? "").replace(/[._]/g, " ").trim();
  return t ? t[0].toUpperCase() + t.slice(1) : "";
}

export const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

// ── label maps ───────────────────────────────────────────────────────

export const SOURCE_LABEL: Record<string, string> = {
  recruiter: "Recruiter link",
  member_invite: "Member invite",
  organic: "On their own",
};
export const SOURCE_COLOR: Record<string, string> = { recruiter: C.cobalt, member_invite: C.sky, organic: C.green };

export const INTENT_LABEL: Record<string, string> = {
  job: "Looking for work",
  open: "Open to a move",
  refer: "Here to refer",
  both: "Work and refer",
};
export const INTENT_COLOR: Record<string, string> = { job: C.green, open: C.cobalt, refer: C.amber, both: C.navy };

export const CAREER_LABEL: Record<string, string> = {
  actively_looking: "Actively looking",
  open_to_offers: "Open to offers",
  not_looking: "Not looking",
};
export const CAREER_COLOR: Record<string, string> = { actively_looking: C.green, open_to_offers: C.cobalt, not_looking: C.slate };

export const RELOCATION_LABEL: Record<string, string> = { yes: "Will relocate", maybe: "Maybe", no: "Staying put" };
export const RELOCATION_COLOR: Record<string, string> = { yes: C.green, maybe: C.sky, no: C.slate };

export const PLATFORM_LABEL: Record<string, string> = { web: "Website", ios: "iPhone app", android: "Android app" };
export const PLATFORM_COLOR: Record<string, string> = { web: C.cobalt, ios: C.navy, android: C.green };

export const CANDIDATE_SOURCE_LABEL: Record<string, string> = {
  referred: "Referred",
  self_signup: "Signed up",
  direct_application: "Applied to a job",
  admin_import: "Added by Delta",
  company_submission: "From a company",
};
export const CANDIDATE_SOURCE_COLOR: Record<string, string> = {
  referred: C.green,
  self_signup: C.cobalt,
  direct_application: C.sky,
  admin_import: C.navy,
  company_submission: C.amber,
};

/** Candidate / referral stages (same enum for both). */
export const STAGE_LABEL: Record<string, string> = {
  submitted: "Submitted",
  duplicate_review: "Duplicate review",
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  not_qualified: "Not a fit",
  submitted_to_job: "Sent to a job",
  interviewing: "Interviewing",
  offer_stage: "Offer",
  placed: "Placed",
  payout_pending: "Payout pending",
  payout_approved: "Payout approved",
  payout_paid: "Payout paid",
  rejected: "Rejected",
  inactive: "Inactive",
};
export const STAGE_COLOR: Record<string, string> = {
  submitted: C.amber,
  duplicate_review: C.amber,
  new: C.slate,
  contacted: C.ice,
  qualified: C.sky,
  not_qualified: "#FCA5A5",
  submitted_to_job: C.cobalt,
  interviewing: C.navy,
  offer_stage: C.mint,
  placed: C.green,
  payout_pending: C.forest,
  payout_approved: C.forest,
  payout_paid: C.forest,
  rejected: C.red,
  inactive: C.none,
};
/** The happy path, in order. "placed" also covers the payout stages after it. */
export const PIPELINE_ORDER = ["new", "contacted", "qualified", "submitted_to_job", "interviewing", "offer_stage", "placed"] as const;
export const PLACED_STAGES = ["placed", "payout_pending", "payout_approved", "payout_paid"];
/** Display order for "where everyone is now": the happy path first, then everything off it. */
export const STAGE_ORDER = [...PIPELINE_ORDER, "payout_pending", "payout_approved", "payout_paid", "submitted", "duplicate_review", "not_qualified", "rejected", "inactive"];
/** Referral stages rolled up into five outcomes (the candidate pipeline shows every stage). */
export const REFERRAL_OUTCOMES: { label: string; keys: string[]; color: string }[] = [
  { label: "New", keys: ["submitted", "new"], color: C.slate },
  { label: "In progress", keys: ["contacted", "qualified", "submitted_to_job", "interviewing", "offer_stage"], color: C.cobalt },
  { label: "Placed", keys: PLACED_STAGES, color: C.green },
  { label: "Closed", keys: ["not_qualified", "rejected", "inactive"], color: C.red },
  { label: "Duplicate review", keys: ["duplicate_review"], color: C.amber },
];

export const APPLICATION_LABEL: Record<string, string> = {
  submitted: "Not reviewed yet",
  reviewing: "Under review",
  interviewing: "Interviewing",
  offer: "Offer",
  hired: "Hired",
  rejected: "Not selected",
  withdrawn: "Withdrawn",
};
export const APPLICATION_COLOR: Record<string, string> = {
  submitted: C.amber,
  reviewing: C.sky,
  interviewing: C.cobalt,
  offer: C.mint,
  hired: C.green,
  rejected: C.red,
  withdrawn: C.none,
};

export const PAYOUT_LABEL: Record<string, string> = {
  pending: "Waiting for approval",
  approved: "Approved, not paid",
  paid: "Paid",
  denied: "Denied",
  disputed: "Disputed",
};
export const PAYOUT_COLOR: Record<string, string> = { pending: C.amber, approved: C.cobalt, paid: C.green, denied: C.red, disputed: C.navy };

export const JOB_STATUS_LABEL: Record<string, string> = { draft: "Draft", open: "Open", paused: "Paused", filled: "Filled", archived: "Archived" };
export const JOB_STATUS_COLOR: Record<string, string> = { draft: C.slate, open: C.green, paused: C.amber, filled: C.cobalt, archived: C.none };

export const LEAD_LABEL: Record<string, string> = {
  new: "New, no call yet",
  contacted: "Contacted",
  qualified: "Qualified",
  engaged: "Working together",
  won: "Won",
  lost: "Lost",
  archived: "Archived",
};
export const LEAD_COLOR: Record<string, string> = {
  new: C.amber,
  contacted: C.ice,
  qualified: C.sky,
  engaged: C.cobalt,
  won: C.green,
  lost: C.red,
  archived: C.none,
};

export const ROUTING_REASON_LABEL: Record<string, string> = {
  job_owner: "To the job's owner",
  recruiter_attribution: "To their recruiter",
  territory: "By territory",
  manual: "Assigned by hand",
  bullhorn: "From Bullhorn",
};
export const ROUTING_REASON_COLOR: Record<string, string> = {
  job_owner: C.green,
  recruiter_attribution: C.cobalt,
  territory: C.sky,
  manual: C.navy,
  bullhorn: C.amber,
};

export const REFERRAL_SOURCE_LABEL: Record<string, string> = {
  manual: "Typed in",
  contacts: "From phone contacts",
  job_link: "From a job post",
  unknown: "Not recorded",
};
export const REFERRAL_SOURCE_COLOR: Record<string, string> = { manual: C.cobalt, contacts: C.green, job_link: C.sky, unknown: C.none };

export const PROVIDER_LABEL: Record<string, string> = { staffing_referrals: "Staffing Referrals", bullhorn: "Bullhorn", sense: "Sense" };

export const ROLE_LABEL: Record<string, string> = { owner: "Owner", account_manager: "Account manager", recruiter: "Recruiter" };

export const ACTION_LABEL: Record<string, string> = {
  account_created: "Accounts created",
  onboarding_completed: "Onboarding finished",
  role_set: "Roles set",
  referral_submitted: "Referrals submitted",
  duplicate_detected: "Possible duplicates caught",
  referred_to_job: "People referred to a job",
  application_submitted: "Applications submitted",
  status_changed: "Status changes",
  note_added: "Notes added",
  primary_referrer_reassigned: "Referrer changes",
  routed: "People routed automatically",
  assigned: "Assignments made by hand",
  invite_code_claimed: "Recruiter codes added later",
  account_deleted: "Accounts deleted",
  created: "Records created",
  updated: "Records updated",
};

// ── chart helpers ────────────────────────────────────────────────────

/** Database key/count rows → chart slices with readable labels and stable colours. */
export function toSlices(
  rows: KeyCount[],
  opts: { labels?: Record<string, string>; colors?: Record<string, string>; hideZero?: boolean } = {}
): Slice[] {
  return rows
    .filter((r) => !opts.hideZero || r.count > 0)
    .map((r, i) => ({
      label: opts.labels?.[r.key] ?? sentence(r.key),
      value: r.count,
      color: opts.colors?.[r.key] ?? CHART_COLORS[i % CHART_COLORS.length],
    }));
}

/** Adds a grey "the rest" slice so a chart adds up to `total` (e.g. members who haven't answered). */
export function withRest(slices: Slice[], total: number, label: string): Slice[] {
  const rest = total - slices.reduce((s, d) => s + d.value, 0);
  return rest > 0 ? [...slices, { label, value: rest, color: C.none }] : slices;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Axis label for a time bucket ("2026-11-03" → "Nov 3", or "Nov" for monthly buckets). */
export function bucketLabel(bucket: string, unit: Bucket, index = 1): string {
  const [y, m, d] = bucket.split("-").map(Number);
  const mon = MONTHS[(m || 1) - 1] ?? "";
  if (unit === "month") return index === 0 || m === 1 ? `${mon} ${y}` : mon;
  return `${mon} ${d}`;
}

export const BUCKET_PHRASE: Record<Bucket, string> = { day: "per day", week: "per week", month: "per month" };

/** Hours → "Instant", "12 min", "3.5 hours", "2.1 days". */
export function fmtHours(h: number | null | undefined): string {
  if (h == null || !Number.isFinite(h)) return "—";
  if (h < 1 / 60) return "Instant";
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 48) return `${h.toFixed(1)} hours`;
  return `${(h / 24).toFixed(1)} days`;
}
