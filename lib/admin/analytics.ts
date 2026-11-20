import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Admin dashboard data: one round trip to the `admin_analytics` RPC
 * (supabase/migrations/0010_admin_analytics.sql), which returns a single JSON
 * document. The types below mirror that document exactly.
 *
 * Scope of each part:
 *   - kpis, series, team "period" numbers: what happened in the selected range
 *   - members: the members who joined in the selected range
 *   - pipeline, routing, jobs, payouts, leads, integrations, engagement: right now
 */

// ── range (lives in the URL as ?range=) ──────────────────────────────

export type RangeKey = "7" | "30" | "90" | "365" | "all";

export interface RangeOption {
  key: RangeKey;
  /** Tab label. */
  label: string;
  /** Days sent to the RPC; null = all time. */
  days: number | null;
  /** Reads naturally after "in": "in the last 30 days". */
  phrase: string;
}

export const RANGE_OPTIONS: RangeOption[] = [
  { key: "7", label: "7 days", days: 7, phrase: "the last 7 days" },
  { key: "30", label: "30 days", days: 30, phrase: "the last 30 days" },
  { key: "90", label: "90 days", days: 90, phrase: "the last 90 days" },
  { key: "365", label: "12 months", days: 365, phrase: "the last 12 months" },
  { key: "all", label: "All time", days: null, phrase: "all time" },
];

export const DEFAULT_RANGE: RangeKey = "30";

export function parseRange(raw: string | string[] | undefined): RangeOption {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return RANGE_OPTIONS.find((r) => r.key === v) ?? RANGE_OPTIONS.find((r) => r.key === DEFAULT_RANGE)!;
}

// ── document shape ───────────────────────────────────────────────────

export type Bucket = "day" | "week" | "month";

export interface KeyCount {
  key: string;
  count: number;
}

/** A headline number. `previous` is null when there is nothing honest to compare with. */
export interface Kpi {
  value: number;
  previous: number | null;
}
export interface FlowKpi extends Kpi {
  /** All-time total. */
  total: number;
}

export interface SeriesPoint {
  /** First day of the bucket, YYYY-MM-DD (America/New_York). */
  bucket: string;
  recruiter: number;
  member_invite: number;
  organic: number;
  referrals: number;
  applications: number;
  candidates: number;
}

export interface SignupTotals {
  total: number;
  /** Credited to a team member (direct or network). */
  attributed: number;
  direct: number;
  network: number;
  organic: number;
}

export interface TeamMemberStats {
  id: string;
  name: string;
  role: "owner" | "account_manager" | "recruiter";
  title: string | null;
  is_active: boolean;
  invite_code: string;
  manager_id: string | null;
  manager_name: string | null;
  /** All time, signed up with their own code. */
  direct_signups: number;
  /** All time, invited by a member they brought in. */
  network_signups: number;
  /** Direct + network inside the selected range. */
  period_signups: number;
  period_direct_signups: number;
  last_signup_at: string | null;
  candidates_assigned: number;
  applications_assigned: number;
  job_referrals_assigned: number;
  /** Placed candidates they are the recruiter for. */
  placements: number;
  jobs_assigned: number;
  jobs_owned: number;
  open_jobs_owned: number;
  candidates_owned: number;
  applications_owned: number;
  job_referrals_owned: number;
  /** Placed candidates they own as account manager. */
  placements_owned: number;
  team_size: number;
}

export interface ActivityEntry {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
  actor_id: string | null;
  actor_name: string | null;
  /** Who or what it was about (null when that record no longer exists). */
  subject: string | null;
  candidate_id: string | null;
  /** Plain-language description built in SQL. */
  label: string;
}

export interface AdminAnalytics {
  generated_at: string;
  range: {
    days: number | null;
    from: string | null;
    previous_from: string | null;
    bucket: Bucket;
    timezone: string;
  };
  attention: {
    unassigned_people: number;
    jobs_without_owner: number;
    payouts_to_approve: number;
    duplicates_to_review: number;
    failed_sync_events: number;
    applications_to_review: number;
    hiring_requests_waiting: number;
  };
  kpis: {
    new_members: Kpi;
    total_members: Kpi;
    active_members: Kpi;
    new_candidates: FlowKpi;
    referrals: FlowKpi;
    applications: FlowKpi;
    placements: FlowKpi;
    payouts_owed_cents: Kpi;
    payouts_paid_cents: FlowKpi;
    open_jobs: Kpi & { opened: number; total: number };
  };
  series: SeriesPoint[];
  members: {
    count: number;
    intent: KeyCount[];
    career_status: KeyCount[];
    relocation: KeyCount[];
    signup_source: KeyCount[];
    signup_platform: KeyCount[];
    years_experience: KeyCount[];
    discipline: KeyCount[];
    states: KeyCount[];
    cities: KeyCount[];
    located: number;
    open_to_move: number;
    motivators: KeyCount[];
    resume: { uploaded: number; built: number; none: number };
    funnel: {
      accounts: number;
      onboarded: number;
      resume: number;
      applied: number;
      referred: number;
      engaged: number;
      placed: number;
      tour_completed: number;
      push_enabled: number;
    };
  };
  team: {
    members: TeamMemberStats[];
    staff: { total: number; active: number; owners: number; account_managers: number; recruiters: number };
    signups: { all: SignupTotals; period: SignupTotals };
  };
  pipeline: {
    total: number;
    confidential: number;
    open_to_move: number;
    actively_looking: number;
    with_account: number;
    with_resume: number;
    by_status: KeyCount[];
    by_source: KeyCount[];
  };
  routing: {
    candidates: number;
    unassigned: number;
    no_recruiter_candidates: number;
    fully_assigned: number;
    no_recruiter_applications: number;
    no_recruiter_job_referrals: number;
    unassigned_applications: number;
    unassigned_job_referrals: number;
    routed: number;
    avg_hours_to_route: number | null;
    median_hours_to_route: number | null;
    by_reason: KeyCount[];
  };
  applications: { total: number; awaiting_review: number; by_status: KeyCount[] };
  referrals: {
    total: number;
    duplicates_pending: number;
    primary: number;
    referrers: number;
    job_referrals: number;
    by_status: KeyCount[];
    by_source: KeyCount[];
    by_duplicate_status: KeyCount[];
    top_referrers: { id: string; name: string; referrals: number; period_referrals: number; placements: number }[];
  };
  jobs: {
    total: number;
    open: number;
    public_open: number;
    urgent_open: number;
    new_in_period: number;
    without_owner: number;
    avg_days_open: number | null;
    avg_payout_cents: number | null;
    by_status: KeyCount[];
    open_by_trade: KeyCount[];
    open_by_state: KeyCount[];
    by_account_manager: { id: string | null; name: string | null; jobs: number; open: number }[];
    top: {
      id: string;
      title: string;
      company: string | null;
      status: string;
      location: string | null;
      owner_name: string | null;
      applications: number;
      referrals: number;
    }[];
  };
  payouts: {
    total: number;
    pending_count: number;
    approved_count: number;
    paid_count: number;
    pending_cents: number;
    approved_cents: number;
    paid_cents: number;
    avg_cents: number | null;
    avg_paid_cents: number | null;
    largest_cents: number | null;
    missing_amount: number;
    by_status: { key: string; count: number; cents: number }[];
    paid_by_month: { bucket: string; cents: number; count: number }[];
  };
  leads: {
    total: number;
    new_in_period: number;
    new_previous: number | null;
    waiting: number;
    open: number;
    won: number;
    positions_open: number;
    by_status: KeyCount[];
    by_urgency: KeyCount[];
  };
  integrations: {
    providers: { provider: string; status: string; last_synced_at: string | null; updated_at: string | null }[];
    outbox: {
      total: number;
      queued: number;
      sent: number;
      failed: number;
      skipped: number;
      in_period: number;
      oldest_queued_at: string | null;
      last_sent_at: string | null;
      by_event: { key: string; count: number; queued: number; failed: number }[];
    };
    inbox: {
      total: number;
      received: number;
      applied: number;
      failed: number;
      ignored: number;
      in_period: number;
      last_received_at: string | null;
      by_event: KeyCount[];
    };
    crm: { total: number; linked: number; last_synced_at: string | null; by_entity: KeyCount[] };
    linked: { staff: number; jobs: number; candidates: number };
  };
  notifications: { total: number; in_period: number; failed: number; by_status: KeyCount[]; by_channel: KeyCount[] };
  engagement: {
    members: number;
    active_1d: number;
    active_7d: number;
    active_30d: number;
    never_seen: number;
    onboarded: number;
    tour_completed: number;
    inactive_accounts: number;
    push_enabled: number;
    devices: KeyCount[];
    last_platform: KeyCount[];
  };
  activity: { total: number; by_action: KeyCount[]; recent: ActivityEntry[] };
}

// ── loader ───────────────────────────────────────────────────────────

export type AnalyticsResult = { ok: true; data: AdminAnalytics } | { ok: false; error: string };

const REQUIRED_KEYS = [
  "range", "attention", "kpis", "series", "members", "team", "pipeline", "routing", "applications", "referrals",
  "jobs", "payouts", "leads", "integrations", "notifications", "engagement", "activity",
] as const;

function isAnalytics(v: unknown): v is AdminAnalytics {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return REQUIRED_KEYS.every((k) => o[k] != null) && Array.isArray(o.series);
}

/**
 * Everything the dashboard shows, for the given number of days (null = all time).
 * Admin-only: the RPC raises for anyone else. Returns the error instead of
 * throwing so the page can explain what went wrong.
 */
export const getAdminAnalytics = cache(async (days: number | null): Promise<AnalyticsResult> => {
  const sb = await createSupabaseServerClient();
  const { data, error } = await sb.rpc("admin_analytics", { p_days: days ?? 0 });
  if (error) return { ok: false, error: error.message };
  if (!isAnalytics(data)) return { ok: false, error: "The analytics function returned an unexpected result." };
  return { ok: true, data };
});

/** Percent change vs the previous period, or null when it can't be computed. */
export function pctChange(k: Kpi): number | null {
  if (k.previous == null || k.previous <= 0) return null;
  return ((k.value - k.previous) / k.previous) * 100;
}
