/**
 * Shapes and labels shared by the Settings page, its server actions and its
 * one client form. No database access here, so it is safe to import anywhere.
 */

/** Tables the demo seed touches, in the order they are shown. */
export const DEMO_COUNT_KEYS = [
  "members",
  "staff",
  "candidates",
  "referrals",
  "job_referrals",
  "job_applications",
  "payouts",
  "company_leads",
  "activity_logs",
  "integration_outbox",
] as const;

export type DemoCountKey = (typeof DEMO_COUNT_KEYS)[number];
export type DemoCountMap = Record<DemoCountKey, number>;

/** What `admin_demo_data_counts()` returns. */
export interface DemoCounts extends DemoCountMap {
  total: number;
  /** Older sample rows the remove button leaves alone. */
  kept: { demoAccounts: number; sampleCandidates: number };
}

/** What `admin_clear_demo_data()` returns. */
export interface DemoRemoved extends DemoCountMap {
  total: number;
  /** Real rows that lost a demo owner and now have none. */
  unassigned: { jobs: number; candidates: number; jobApplications: number; jobReferrals: number };
}

export const DEMO_COUNT_LABEL: Record<DemoCountKey, { one: string; many: string }> = {
  members: { one: "member", many: "members" },
  staff: { one: "team member", many: "team members" },
  candidates: { one: "candidate", many: "candidates" },
  referrals: { one: "referral", many: "referrals" },
  job_referrals: { one: "job referral", many: "job referrals" },
  job_applications: { one: "application", many: "applications" },
  payouts: { one: "payout", many: "payouts" },
  company_leads: { one: "hiring request", many: "hiring requests" },
  activity_logs: { one: "activity entry", many: "activity entries" },
  integration_outbox: { one: "sync queue event", many: "sync queue events" },
};

/** "80 members", "1 payout". */
export function demoCountText(key: DemoCountKey, n: number): string {
  const label = DEMO_COUNT_LABEL[key];
  return `${n.toLocaleString("en-US")} ${n === 1 ? label.one : label.many}`;
}

/** The word an owner has to type before demo data is removed. */
export const CONFIRM_WORD = "REMOVE";

export type ClearDemoState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "done"; removed: DemoRemoved };

// ── parsing what the database functions return ───────────────────────

type Json = Record<string, unknown>;

const obj = (v: unknown): Json => (v && typeof v === "object" && !Array.isArray(v) ? (v as Json) : {});

function int(v: unknown): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function countMap(raw: Json): DemoCountMap {
  const out = {} as DemoCountMap;
  for (const key of DEMO_COUNT_KEYS) out[key] = int(raw[key]);
  return out;
}

const sum = (m: DemoCountMap) => DEMO_COUNT_KEYS.reduce((s, k) => s + m[k], 0);

export function parseDemoCounts(raw: unknown): DemoCounts {
  const o = obj(raw);
  const map = countMap(o);
  const kept = obj(o.kept);
  return {
    ...map,
    total: sum(map),
    kept: { demoAccounts: int(kept.demo_accounts), sampleCandidates: int(kept.sample_candidates) },
  };
}

export function parseDemoRemoved(raw: unknown): DemoRemoved {
  const o = obj(raw);
  const map = countMap(o);
  const un = obj(o.unassigned);
  return {
    ...map,
    total: sum(map),
    unassigned: {
      jobs: int(un.jobs),
      candidates: int(un.candidates),
      jobApplications: int(un.job_applications),
      jobReferrals: int(un.job_referrals),
    },
  };
}
