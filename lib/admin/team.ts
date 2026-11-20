import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ReferralStatus, Staff } from "@/types";

/**
 * Data for the admin Team screens: per-person sign-up and workload numbers
 * (one SQL call: `admin_team_stats`, see migration 0011) plus the lists shown
 * on a team member's own page. Admin-only: every query runs as the signed-in
 * owner and the RPC refuses anyone else.
 */

export const WEEKS = 12;

export interface StaffStats {
  id: string;
  /** Came through this person's own link or code. */
  directSignups: number;
  /** Invited by a member this person brought in. */
  networkSignups: number;
  /** directSignups + networkSignups. */
  signups: number;
  signups7d: number;
  signups30d: number;
  /** Of their sign-ups, how many finished onboarding. */
  onboarded: number;
  lastSignupAt: string | null;
  candidatesAssigned: number;
  candidatesOwned: number;
  applicationsAssigned: number;
  applicationsOwned: number;
  jobReferralsAssigned: number;
  jobReferralsOwned: number;
  placements: number;
  jobsOwned: number;
  jobsAssigned: number;
  teamSize: number;
  activeTeamSize: number;
  /** Sign-ups per week, oldest first, always WEEKS long. */
  weekly: number[];
}

export interface TeamTotals {
  /** Profiles with role referral_partner or candidate. */
  members: number;
  /** Members linked to a team member (recruited_by_staff_id). */
  attributed: number;
  unattributed: number;
  /** Credited sign-ups through a team member's own link or code. */
  direct: number;
  /** Credited sign-ups invited by a member a team member brought in. */
  network: number;
  signups7d: number;
  signups30d: number;
  members30d: number;
  weekly: number[];
}

export interface TeamStats {
  /** Monday of each week in `weekly`, as YYYY-MM-DD, oldest first. */
  weekStarts: string[];
  totals: TeamTotals;
  byId: Map<string, StaffStats>;
  /** Set when the numbers could not be loaded; everything is then zero. */
  error: string | null;
}

type Json = Record<string, unknown>;

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

function series(v: unknown): number[] {
  const arr = Array.isArray(v) ? v.map(num) : [];
  const padded = arr.slice(-WEEKS);
  while (padded.length < WEEKS) padded.unshift(0);
  return padded;
}

export function emptyStats(id: string): StaffStats {
  return {
    id,
    directSignups: 0,
    networkSignups: 0,
    signups: 0,
    signups7d: 0,
    signups30d: 0,
    onboarded: 0,
    lastSignupAt: null,
    candidatesAssigned: 0,
    candidatesOwned: 0,
    applicationsAssigned: 0,
    applicationsOwned: 0,
    jobReferralsAssigned: 0,
    jobReferralsOwned: 0,
    placements: 0,
    jobsOwned: 0,
    jobsAssigned: 0,
    teamSize: 0,
    activeTeamSize: 0,
    weekly: new Array<number>(WEEKS).fill(0),
  };
}

function toStats(r: Json): StaffStats {
  const direct = num(r.direct_signups);
  const network = num(r.network_signups);
  return {
    id: String(r.id),
    directSignups: direct,
    networkSignups: network,
    signups: direct + network,
    signups7d: num(r.signups_7d),
    signups30d: num(r.signups_30d),
    onboarded: num(r.onboarded),
    lastSignupAt: typeof r.last_signup_at === "string" ? r.last_signup_at : null,
    candidatesAssigned: num(r.candidates_assigned),
    candidatesOwned: num(r.candidates_owned),
    applicationsAssigned: num(r.applications_assigned),
    applicationsOwned: num(r.applications_owned),
    jobReferralsAssigned: num(r.job_referrals_assigned),
    jobReferralsOwned: num(r.job_referrals_owned),
    placements: num(r.placements),
    jobsOwned: num(r.jobs_owned),
    jobsAssigned: num(r.jobs_assigned),
    teamSize: num(r.team_size),
    activeTeamSize: num(r.active_team_size),
    weekly: series(r.weekly),
  };
}

/** Monday of the current week and the 11 before it (fallback when the RPC is unavailable). */
function fallbackWeekStarts(): string[] {
  const now = new Date();
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return Array.from({ length: WEEKS }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() - (WEEKS - 1 - i) * 7);
    return d.toISOString().slice(0, 10);
  });
}

/** Everyone's numbers in one round trip. Cached per request. */
export const getTeamStats = cache(async (): Promise<TeamStats> => {
  const empty = (error: string | null): TeamStats => ({
    weekStarts: fallbackWeekStarts(),
    totals: {
      members: 0,
      attributed: 0,
      unattributed: 0,
      direct: 0,
      network: 0,
      signups7d: 0,
      signups30d: 0,
      members30d: 0,
      weekly: new Array<number>(WEEKS).fill(0),
    },
    byId: new Map(),
    error,
  });

  const sb = await createSupabaseServerClient();
  const { data, error } = await sb.rpc("admin_team_stats");
  if (error) return empty(error.message);
  if (!data || typeof data !== "object") return empty("No data returned");

  const root = data as Json;
  const t = (root.totals ?? {}) as Json;
  const rows = Array.isArray(root.staff) ? (root.staff as Json[]) : [];
  const weekStarts =
    Array.isArray(root.week_starts) && root.week_starts.length === WEEKS
      ? (root.week_starts as unknown[]).map(String)
      : fallbackWeekStarts();

  return {
    weekStarts,
    totals: {
      members: num(t.members),
      attributed: num(t.attributed),
      unattributed: num(t.unattributed),
      direct: num(t.direct),
      network: num(t.network),
      signups7d: num(t.signups_7d),
      signups30d: num(t.signups_30d),
      members30d: num(t.members_30d),
      weekly: series(t.weekly),
    },
    byId: new Map(rows.map((r) => [String(r.id), toStats(r)])),
    error: null,
  };
});

export function statsFor(stats: TeamStats, id: string): StaffStats {
  return stats.byId.get(id) ?? emptyStats(id);
}

/** Add several people's numbers together (an account manager plus their recruiters). */
export function sumStats(id: string, list: StaffStats[]): StaffStats {
  const out = emptyStats(id);
  for (const s of list) {
    out.directSignups += s.directSignups;
    out.networkSignups += s.networkSignups;
    out.signups += s.signups;
    out.signups7d += s.signups7d;
    out.signups30d += s.signups30d;
    out.onboarded += s.onboarded;
    out.candidatesAssigned += s.candidatesAssigned;
    out.candidatesOwned += s.candidatesOwned;
    out.applicationsAssigned += s.applicationsAssigned;
    out.applicationsOwned += s.applicationsOwned;
    out.jobReferralsAssigned += s.jobReferralsAssigned;
    out.jobReferralsOwned += s.jobReferralsOwned;
    out.placements += s.placements;
    out.jobsOwned += s.jobsOwned;
    out.jobsAssigned += s.jobsAssigned;
    out.weekly = out.weekly.map((v, i) => v + (s.weekly[i] ?? 0));
    if (s.lastSignupAt && (!out.lastSignupAt || s.lastSignupAt > out.lastSignupAt)) out.lastSignupAt = s.lastSignupAt;
  }
  return out;
}

/** "2026-11-16" → "Nov 16" (no time zone maths: the date is already a calendar day). */
export function weekLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/**
 * Where this request came from, e.g. https://ecrn.com. Sign-up links are built
 * from it so they always point at the site the owner is looking at.
 */
export async function getRequestOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  if (configured) return configured.replace(/\/+$/, "");
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim();
  if (!host || !/^[a-z0-9.\-:[\]]+$/i.test(host)) return "https://ecrn.com";
  const forwarded = (h.get("x-forwarded-proto") ?? "").split(",")[0].trim().toLowerCase();
  const proto = forwarded === "http" || forwarded === "https" ? forwarded : host.startsWith("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}

// ── lists on a team member's page ────────────────────────────────────

export interface StaffSignup {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  source: "direct" | "network";
  /** For network sign-ups: the member who invited them. */
  invitedByName: string | null;
  intent: string | null;
  discipline: string | null;
  locationCity: string | null;
  locationState: string | null;
  hasResume: boolean;
  onboarded: boolean;
}

const fullName = (first: unknown, last: unknown): string =>
  `${typeof first === "string" ? first : ""} ${typeof last === "string" ? last : ""}`.trim();
const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);

/** Members credited to this person, newest first. */
export async function listStaffSignups(staffId: string, limit = 200): Promise<{ rows: StaffSignup[]; total: number }> {
  const sb = await createSupabaseServerClient();
  const { data, error, count } = await sb
    .from("profiles")
    .select(
      "id, first_name, last_name, email, created_at, signup_source, invited_by, intent, discipline, location_city, location_state, resume_path, onboarded",
      { count: "exact" }
    )
    .eq("recruited_by_staff_id", staffId)
    // Same definition as the counts: members only, direct or network sign-ups.
    .in("role", ["referral_partner", "candidate"])
    .in("signup_source", ["recruiter", "member_invite"])
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`listStaffSignups: ${error.message}`);
  const rows = (data ?? []) as Json[];

  // Names of the members who did the inviting, for the "network" rows.
  const inviterIds = [...new Set(rows.filter((r) => r.signup_source === "member_invite" && r.invited_by).map((r) => String(r.invited_by)))];
  const inviters = new Map<string, string>();
  if (inviterIds.length) {
    const { data: inv } = await sb.from("profiles").select("id, first_name, last_name").in("id", inviterIds);
    for (const p of (inv ?? []) as Json[]) inviters.set(String(p.id), fullName(p.first_name, p.last_name));
  }

  return {
    total: count ?? rows.length,
    rows: rows.map((r) => {
      const network = r.signup_source === "member_invite";
      return {
        id: String(r.id),
        name: fullName(r.first_name, r.last_name) || String(r.email ?? "Member"),
        email: String(r.email ?? ""),
        joinedAt: String(r.created_at),
        source: network ? "network" : "direct",
        invitedByName: network && r.invited_by ? inviters.get(String(r.invited_by)) || null : null,
        intent: str(r.intent),
        discipline: str(r.discipline),
        locationCity: str(r.location_city),
        locationState: str(r.location_state),
        hasResume: Boolean(str(r.resume_path)),
        onboarded: Boolean(r.onboarded),
      };
    }),
  };
}

export interface StaffCandidate {
  id: string;
  name: string;
  status: ReferralStatus;
  jobTitle: string | null;
  trade: string | null;
  locationCity: string | null;
  locationState: string | null;
  isRecruiter: boolean;
  isAccountManager: boolean;
  routingReason: string | null;
  createdAt: string;
}

/** People this team member recruits (recruiter_id) or owns (account_manager_id), newest first. */
export async function listStaffCandidates(staffId: string, limit = 200): Promise<{ rows: StaffCandidate[]; total: number }> {
  const sb = await createSupabaseServerClient();
  const { data, error, count } = await sb
    .from("candidates")
    .select(
      "id, first_name, last_name, status, current_job_title, trade, location_city, location_state, account_manager_id, recruiter_id, routing_reason, created_at",
      { count: "exact" }
    )
    .or(`recruiter_id.eq.${staffId},account_manager_id.eq.${staffId}`)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`listStaffCandidates: ${error.message}`);
  const rows = (data ?? []) as Json[];
  return {
    total: count ?? rows.length,
    rows: rows.map((r) => ({
      id: String(r.id),
      name: fullName(r.first_name, r.last_name) || "Unnamed",
      status: r.status as ReferralStatus,
      jobTitle: str(r.current_job_title),
      trade: str(r.trade),
      locationCity: str(r.location_city),
      locationState: str(r.location_state),
      isRecruiter: r.recruiter_id === staffId,
      isAccountManager: r.account_manager_id === staffId,
      routingReason: str(r.routing_reason),
      createdAt: String(r.created_at),
    })),
  };
}

export interface StaffJob {
  id: string;
  title: string;
  companyName: string | null;
  status: string;
  locationCity: string | null;
  locationState: string | null;
  isOwner: boolean;
  isAssigned: boolean;
  createdAt: string;
}

/** Jobs this person owns as account manager or is assigned to as recruiter. */
export async function listStaffJobs(staffId: string): Promise<StaffJob[]> {
  const sb = await createSupabaseServerClient();
  const cols = "id, title, company_name, status, location_city, location_state, created_at, private:job_private(client_company)";
  const [owned, assigned] = await Promise.all([
    sb.from("jobs").select(cols).eq("account_manager_id", staffId).order("created_at", { ascending: false }).limit(200),
    sb.from("job_recruiters").select(`job_id, job:jobs(${cols})`).eq("staff_id", staffId).limit(200),
  ]);
  if (owned.error) throw new Error(`listStaffJobs: ${owned.error.message}`);
  if (assigned.error) throw new Error(`listStaffJobs: ${assigned.error.message}`);

  const jobs = new Map<string, StaffJob>();
  const add = (r: Json | null | undefined, role: "owner" | "assigned") => {
    if (!r || !r.id) return;
    const id = String(r.id);
    const existing = jobs.get(id);
    if (existing) {
      if (role === "owner") existing.isOwner = true;
      else existing.isAssigned = true;
      return;
    }
    jobs.set(id, {
      id,
      title: String(r.title ?? "Untitled job"),
      companyName: str((Array.isArray(r.private) ? r.private[0] : r.private)?.client_company) ?? str(r.company_name),
      status: String(r.status ?? ""),
      locationCity: str(r.location_city),
      locationState: str(r.location_state),
      isOwner: role === "owner",
      isAssigned: role === "assigned",
      createdAt: String(r.created_at ?? ""),
    });
  };
  for (const r of (owned.data ?? []) as Json[]) add(r, "owner");
  for (const r of (assigned.data ?? []) as Json[]) {
    const job = Array.isArray(r.job) ? (r.job[0] as Json | undefined) : (r.job as Json | null);
    add(job, "assigned");
  }
  return [...jobs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ── grouping for the Team page ───────────────────────────────────────

export interface TeamGroup {
  lead: Staff;
  /** Everyone whose manager is the lead. */
  reports: Staff[];
}

/**
 * Who reports to whom. A "lead" is every account manager, plus anyone else
 * (usually an owner) that people report to. Recruiters whose manager is
 * missing end up in `unmanaged`.
 */
export function groupTeam(all: Staff[]): { groups: TeamGroup[]; unmanaged: Staff[]; owners: Staff[] } {
  const byId = new Map(all.map((s) => [s.id, s]));
  const reportsOf = new Map<string, Staff[]>();
  for (const s of all) {
    if (s.managerId && s.managerId !== s.id && byId.has(s.managerId)) {
      const list = reportsOf.get(s.managerId) ?? [];
      list.push(s);
      reportsOf.set(s.managerId, list);
    }
  }
  const groups = all
    .filter((s) => s.staffRole === "account_manager" || reportsOf.has(s.id))
    .map((lead) => ({ lead, reports: reportsOf.get(lead.id) ?? [] }));
  const unmanaged = all.filter(
    (s) => s.staffRole === "recruiter" && !(s.managerId && s.managerId !== s.id && byId.has(s.managerId))
  );
  const owners = all.filter((s) => s.staffRole === "owner");
  return { groups, unmanaged, owners };
}
