import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toActivity, toCandidate } from "@/lib/data/mappers";
import { getStaffMap, staffName } from "@/lib/admin/staff";
import type {
  ActivityLog,
  ApplicationStatus,
  Candidate,
  CandidateSource,
  ReferralStatus,
  Staff,
} from "@/types";

/**
 * Routing and ownership queries for the admin side: the routing queue,
 * the applications list, and the owner columns on candidates.
 *
 * The database does the routing itself (see migration 0008). Everything in
 * here only reads, so owners can see where each person went and why.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

// ─── shared vocabulary ───────────────────────────────────────────────

export type AssignEntity = "candidate" | "job_application" | "job_referral";
export const ASSIGN_ENTITIES: AssignEntity[] = ["candidate", "job_application", "job_referral"];

export const ROUTING_REASON_LABEL: Record<string, string> = {
  job_owner: "Owns the job",
  recruiter_attribution: "Brought them in",
  territory: "Territory match",
  manual: "Assigned by admin",
  bullhorn: "From Bullhorn",
};

/** The three rules the database applies on its own. */
export const AUTO_ROUTING_REASONS = ["job_owner", "recruiter_attribution", "territory"];

export function routingReasonLabel(reason: string | null | undefined): string {
  if (!reason) return "Not routed yet";
  return ROUTING_REASON_LABEL[reason] ?? reason.replace(/_/g, " ");
}

export const SOURCE_LABEL: Record<CandidateSource, string> = {
  referred: "Referred",
  self_signup: "Joined the app",
  direct_application: "Applied directly",
  company_submission: "Company submission",
  admin_import: "Admin import",
};

export const CANDIDATE_STATUSES: ReferralStatus[] = [
  "submitted",
  "duplicate_review",
  "new",
  "contacted",
  "qualified",
  "not_qualified",
  "submitted_to_job",
  "interviewing",
  "offer_stage",
  "placed",
  "payout_pending",
  "payout_approved",
  "payout_paid",
  "rejected",
  "inactive",
];

export const CANDIDATE_SOURCES: CandidateSource[] = [
  "referred",
  "self_signup",
  "direct_application",
  "company_submission",
  "admin_import",
];

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "submitted",
  "reviewing",
  "interviewing",
  "offer",
  "hired",
  "rejected",
  "withdrawn",
];

/** People in these statuses are done, so they never sit in the queue. */
const CLOSED_CANDIDATE = "(rejected,inactive,not_qualified)";
const CLOSED_APPLICATION = "(rejected,withdrawn)";

export interface StaffRef {
  id: string;
  firstName: string;
  lastName: string;
}

export function refName(s: StaffRef | null | undefined): string | null {
  if (!s) return null;
  return `${s.firstName} ${s.lastName}`.trim() || null;
}

export function isUuid(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

/** Words from a search box, safe to drop into a PostgREST `or` filter. */
export function searchTokens(q: string | null | undefined): string[] {
  return (q ?? "")
    .replace(/[%,()*\\"]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5);
}

/** A search param can arrive as a string, a list (repeated in the URL), or not at all. */
export function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

function fail(context: string, error: { message: string } | null): never {
  throw new Error(`${context}: ${error?.message ?? "unknown error"}`);
}

/** Embedded relations come back as an object, a one-item array, or null. */
function embedOne(v: unknown): Row | null {
  if (!v) return null;
  if (Array.isArray(v)) return (v[0] as Row | undefined) ?? null;
  return v as Row;
}

function embedMany(v: unknown): Row[] {
  if (!v) return [];
  return Array.isArray(v) ? (v as Row[]) : [v as Row];
}

function toStaffRef(v: unknown): StaffRef | null {
  const r = embedOne(v);
  return r ? { id: r.id, firstName: r.first_name ?? "", lastName: r.last_name ?? "" } : null;
}

function personName(first: unknown, last: unknown, fallback = "Unnamed"): string {
  return `${typeof first === "string" ? first : ""} ${typeof last === "string" ? last : ""}`.trim() || fallback;
}

function placeName(city: unknown, state: unknown): string | null {
  return [city, state].filter((p) => typeof p === "string" && p.trim()).join(", ") || null;
}

/** Page through a query 1,000 rows at a time (PostgREST caps each request). */
async function fetchAll(context: string, build: () => any, maxPages = 10): Promise<Row[]> {
  const out: Row[] = [];
  for (let page = 0; page < maxPages; page++) {
    const { data, error } = await build().range(page * 1000, page * 1000 + 999);
    if (error) fail(context, error);
    const rows = (data ?? []) as Row[];
    out.push(...rows);
    if (rows.length < 1000) break;
  }
  return out;
}

async function headCount(context: string, q: any): Promise<number> {
  const { count, error } = await q;
  if (error) fail(context, error);
  return count ?? 0;
}

// ─── queue stats ─────────────────────────────────────────────────────

export interface RoutingStats {
  /** Active people with no account manager. */
  needsOwner: number;
  /** People an account manager still has to hand to a recruiter. */
  needsRecruiter: number;
  /** People routed, reassigned or handed to a recruiter in the last 7 days. */
  routedLast7Days: number;
  /** People who have an account manager or recruiter today. */
  ownedTotal: number;
  /** Of those, the ones whose owner was picked by the automatic rules. */
  ownedAutomatically: number;
}

export async function getRoutingStats(): Promise<RoutingStats> {
  const sb = await createSupabaseServerClient();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const candidates = () => sb.from("candidates").select("id", { count: "exact", head: true });

  const [needsOwner, routedLast7Days, ownedTotal, ownedAutomatically, waiting] = await Promise.all([
    headCount(
      "getRoutingStats.needsOwner",
      candidates().is("account_manager_id", null).not("status", "in", CLOSED_CANDIDATE)
    ),
    headCount("getRoutingStats.routedLast7Days", candidates().gte("routed_at", weekAgo)),
    headCount(
      "getRoutingStats.ownedTotal",
      candidates().or("account_manager_id.not.is.null,recruiter_id.not.is.null")
    ),
    countOwnedAutomatically(),
    countWaitingForRecruiter(),
  ]);

  return { needsOwner, needsRecruiter: waiting, routedLast7Days, ownedTotal, ownedAutomatically };
}

/**
 * People whose owner was chosen by the rules. When an account manager hands
 * someone to a recruiter, the database marks that person "manual", which would
 * make routing look less automatic every time the team does its job. So a
 * "manual" person still counts when the rules picked their current account
 * manager and a person only added the recruiter.
 */
async function countOwnedAutomatically(): Promise<number> {
  const sb = await createSupabaseServerClient();
  const [direct, handedOff] = await Promise.all([
    headCount(
      "countOwnedAutomatically.direct",
      sb
        .from("candidates")
        .select("id", { count: "exact", head: true })
        .or("account_manager_id.not.is.null,recruiter_id.not.is.null")
        .in("routing_reason", AUTO_ROUTING_REASONS)
    ),
    fetchAll("countOwnedAutomatically.manual", () =>
      sb
        .from("candidates")
        .select("id, account_manager_id")
        .eq("routing_reason", "manual")
        .not("account_manager_id", "is", null)
        .order("id")
    ),
  ]);
  if (handedOff.length === 0) return direct;

  const placements = await fetchAll("countOwnedAutomatically.routed", () =>
    sb
      .from("activity_logs")
      .select("entity_id, am:metadata->>account_manager_id")
      .eq("action", "routed")
      .eq("entity_type", "candidate")
      .order("id")
  );
  const placedByRule = new Set(placements.map((l) => `${l.entity_id}:${l.am}`));
  return direct + handedOff.filter((c) => placedByRule.has(`${c.id}:${c.account_manager_id}`)).length;
}

/** One per person per account manager, matching the rows in the hand-off list. */
async function countWaitingForRecruiter(): Promise<number> {
  const sb = await createSupabaseServerClient();
  const [people, applications, jobReferrals] = await Promise.all([
    fetchAll("countWaitingForRecruiter.candidates", () =>
      sb
        .from("candidates")
        .select("id, account_manager_id")
        .not("account_manager_id", "is", null)
        .is("recruiter_id", null)
        .not("status", "in", CLOSED_CANDIDATE)
        .order("id")
    ),
    fetchAll("countWaitingForRecruiter.applications", () =>
      sb
        .from("job_applications")
        .select("candidate_id, account_manager_id")
        .not("account_manager_id", "is", null)
        .is("recruiter_id", null)
        .not("status", "in", CLOSED_APPLICATION)
        .order("id")
    ),
    fetchAll("countWaitingForRecruiter.jobReferrals", () =>
      sb
        .from("job_referrals")
        .select("candidate_id, account_manager_id")
        .not("account_manager_id", "is", null)
        .is("recruiter_id", null)
        .not("status", "in", CLOSED_CANDIDATE)
        .order("id")
    ),
  ]);
  const keys = new Set<string>();
  for (const r of people) keys.add(`${r.account_manager_id}:${r.id}`);
  for (const r of applications) keys.add(`${r.account_manager_id}:${r.candidate_id}`);
  for (const r of jobReferrals) keys.add(`${r.account_manager_id}:${r.candidate_id}`);
  return keys.size;
}

// ─── tab 1: needs an owner ───────────────────────────────────────────

export interface QueueJob {
  id: string;
  title: string;
  accountManagerId: string | null;
  kind: "applied" | "referred";
}

export interface UnassignedReason {
  /** Short reason shown in the table. */
  text: string;
  detail: string | null;
  /** Where to go to fix the cause, if there is one. */
  fix: { label: string; href: string } | null;
  /** True when the automatic rules would place this person if they ran now. */
  ready: boolean;
}

export interface NeedsOwnerRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  title: string | null;
  discipline: string | null;
  sourceType: CandidateSource;
  status: ReferralStatus;
  createdAt: string;
  recruiterId: string | null;
  referrerName: string | null;
  /** The job the database would route them by: latest application, else latest referral. */
  job: QueueJob | null;
  reason: UnassignedReason;
}

export const NEEDS_OWNER_LIMIT = 200;

export async function listNeedsOwner(): Promise<NeedsOwnerRow[]> {
  const sb = await createSupabaseServerClient();
  const [{ data, error }, staffMap] = await Promise.all([
    sb
      .from("candidates")
      .select(
        `id, first_name, last_name, email, phone, location_city, location_state, current_job_title, trade,
         source_type, status, created_at, recruiter_id,
         referrer:profiles!candidates_primary_referrer_user_id_fkey(id, first_name, last_name, email, recruited_by_staff_id),
         member:profiles!candidates_user_id_fkey(id, discipline, recruited_by_staff_id),
         job_applications(id, created_at, job:jobs(id, title, account_manager_id)),
         job_referrals(id, created_at, job:jobs(id, title, account_manager_id))`
      )
      .is("account_manager_id", null)
      .not("status", "in", CLOSED_CANDIDATE)
      .order("created_at", { ascending: false })
      .limit(NEEDS_OWNER_LIMIT),
    getStaffMap(),
  ]);
  if (error) fail("listNeedsOwner", error);

  return ((data ?? []) as Row[]).map((r) => {
    const referrer = embedOne(r.referrer);
    const member = embedOne(r.member);
    const job = latestJob(embedMany(r.job_applications), "applied") ?? latestJob(embedMany(r.job_referrals), "referred");
    const state = typeof r.location_state === "string" && r.location_state.trim() ? r.location_state.trim() : null;
    return {
      id: r.id,
      name: personName(r.first_name, r.last_name),
      email: r.email ?? null,
      phone: r.phone ?? null,
      location: placeName(r.location_city, r.location_state),
      title: r.current_job_title ?? null,
      discipline: member?.discipline ?? r.trade ?? null,
      sourceType: r.source_type,
      status: r.status,
      createdAt: r.created_at,
      recruiterId: r.recruiter_id ?? null,
      referrerName: referrer ? personName(referrer.first_name, referrer.last_name, referrer.email ?? "A member") : null,
      job,
      reason: explainUnassigned(
        {
          state,
          recruiterId: r.recruiter_id ?? null,
          // Same order the database uses: the person's own recruiter, then their referrer's.
          creditedStaffId: member?.recruited_by_staff_id ?? referrer?.recruited_by_staff_id ?? null,
          job,
        },
        staffMap
      ),
    };
  });
}

function latestJob(items: Row[], kind: QueueJob["kind"]): QueueJob | null {
  const withJob = items
    .map((i) => ({ at: String(i.created_at ?? ""), job: embedOne(i.job) }))
    .filter((i) => i.job)
    .sort((a, b) => b.at.localeCompare(a.at));
  const job = withJob[0]?.job;
  return job ? { id: job.id, title: job.title ?? "Untitled job", accountManagerId: job.account_manager_id ?? null, kind } : null;
}

/**
 * Why nobody owns this person yet. Walks the same three rules as
 * private.route_candidate so the reason matches what the database did.
 */
function explainUnassigned(
  input: { state: string | null; recruiterId: string | null; creditedStaffId: string | null; job: QueueJob | null },
  staffMap: Map<string, Staff>
): UnassignedReason {
  const { state, job } = input;

  // Rule 1: the job's owner.
  if (job?.accountManagerId && staffMap.has(job.accountManagerId)) {
    return {
      text: "Their job has an owner now",
      detail: `"${job.title}" belongs to ${staffName(staffMap.get(job.accountManagerId))}. Auto-route will send them there.`,
      fix: null,
      ready: true,
    };
  }

  // Rule 2: the recruiter credited with the sign-up.
  const credited = input.creditedStaffId ? (staffMap.get(input.creditedStaffId) ?? null) : null;
  const assigned = input.recruiterId ? (staffMap.get(input.recruiterId) ?? null) : null;
  const orphan = [credited, assigned].find((s) => s && s.isActive && s.staffRole === "recruiter" && !s.managerId) ?? null;
  if (orphan) {
    return {
      text: "Their recruiter has no account manager",
      detail: `${staffName(orphan)} is not on anyone's team yet. Give them an account manager on the Team page.`,
      fix: { label: "Open Team", href: "/admin/team" },
      ready: false,
    };
  }
  if (credited && credited.isActive) {
    return {
      text: "Their recruiter is set up now",
      detail: `${staffName(credited)} brought them in. Auto-route will send them there.`,
      fix: null,
      ready: true,
    };
  }

  // Rule 3: an account manager whose territory covers their state.
  if (state) {
    const code = state.toUpperCase();
    for (const s of staffMap.values()) {
      if (s.isActive && s.staffRole === "account_manager" && s.territories.some((t) => t.toUpperCase() === code)) {
        return {
          text: `A territory covers ${code} now`,
          detail: `${staffName(s)} covers ${code}. Auto-route will send them there.`,
          fix: null,
          ready: true,
        };
      }
    }
  }

  const noRecruiter = credited ? `${staffName(credited)} brought them in but is inactive` : "No recruiter credited";
  const noTerritory = state ? `no account manager covers ${state.toUpperCase()}` : "no state on file to match a territory";
  if (job) {
    return {
      text: "No job owner set",
      detail: `"${job.title}" has no account manager. ${noRecruiter} and ${noTerritory}.`,
      fix: { label: "Set job owner", href: `/admin/jobs/${job.id}/edit` },
      ready: false,
    };
  }
  return {
    text: state
      ? `${credited ? "Recruiter inactive" : "No recruiter credited"} and no territory match`
      : `${credited ? "Recruiter inactive" : "No recruiter credited"} and no location on file`,
    detail: `${noRecruiter} and ${noTerritory}.`,
    fix: null,
    ready: false,
  };
}

// ─── tab 2: needs a recruiter (the account manager's hand-off list) ──

export interface HandoffItem {
  entity: AssignEntity;
  id: string;
  /** "Their profile", "Application: Project Engineer", "Referral: Estimator". */
  label: string;
  jobId: string | null;
  since: string;
}

export interface HandoffRow {
  key: string;
  accountManagerId: string;
  candidateId: string;
  name: string;
  email: string | null;
  title: string | null;
  location: string | null;
  items: HandoffItem[];
  /** When the oldest waiting item reached this account manager. */
  since: string;
}

export interface HandoffGroup {
  accountManagerId: string;
  accountManagerName: string;
  rows: HandoffRow[];
}

export async function listNeedsRecruiter(): Promise<HandoffGroup[]> {
  const sb = await createSupabaseServerClient();
  const person = "id, first_name, last_name, email, location_city, location_state, current_job_title, trade";
  const [people, applications, jobReferrals, staffMap] = await Promise.all([
    sb
      .from("candidates")
      .select(`${person}, created_at, routed_at, account_manager_id`)
      .not("account_manager_id", "is", null)
      .is("recruiter_id", null)
      .not("status", "in", CLOSED_CANDIDATE)
      .order("created_at", { ascending: true })
      .limit(1000),
    sb
      .from("job_applications")
      .select(`id, created_at, account_manager_id, candidate_id, job:jobs(id, title), candidate:candidates(${person})`)
      .not("account_manager_id", "is", null)
      .is("recruiter_id", null)
      .not("status", "in", CLOSED_APPLICATION)
      .order("created_at", { ascending: true })
      .limit(1000),
    sb
      .from("job_referrals")
      .select(`id, created_at, account_manager_id, candidate_id, job:jobs(id, title), candidate:candidates(${person})`)
      .not("account_manager_id", "is", null)
      .is("recruiter_id", null)
      .not("status", "in", CLOSED_CANDIDATE)
      .order("created_at", { ascending: true })
      .limit(1000),
    getStaffMap(),
  ]);
  if (people.error) fail("listNeedsRecruiter.candidates", people.error);
  if (applications.error) fail("listNeedsRecruiter.applications", applications.error);
  if (jobReferrals.error) fail("listNeedsRecruiter.jobReferrals", jobReferrals.error);

  const rows = new Map<string, HandoffRow>();
  const rowFor = (accountManagerId: string, c: Row): HandoffRow => {
    const key = `${accountManagerId}:${c.id}`;
    let row = rows.get(key);
    if (!row) {
      row = {
        key,
        accountManagerId,
        candidateId: c.id,
        name: personName(c.first_name, c.last_name),
        email: c.email ?? null,
        title: c.current_job_title ?? c.trade ?? null,
        location: placeName(c.location_city, c.location_state),
        items: [],
        since: "",
      };
      rows.set(key, row);
    }
    return row;
  };
  const add = (row: HandoffRow, item: HandoffItem) => {
    row.items.push(item);
    if (!row.since || item.since < row.since) row.since = item.since;
  };

  for (const c of (people.data ?? []) as Row[]) {
    add(rowFor(c.account_manager_id, c), {
      entity: "candidate",
      id: c.id,
      label: "Their profile",
      jobId: null,
      since: c.routed_at ?? c.created_at,
    });
  }
  for (const a of (applications.data ?? []) as Row[]) {
    const c = embedOne(a.candidate);
    if (!c) continue;
    const job = embedOne(a.job);
    add(rowFor(a.account_manager_id, c), {
      entity: "job_application",
      id: a.id,
      label: `Application: ${job?.title ?? "a job"}`,
      jobId: job?.id ?? null,
      since: a.created_at,
    });
  }
  for (const jr of (jobReferrals.data ?? []) as Row[]) {
    const c = embedOne(jr.candidate);
    if (!c) continue;
    const job = embedOne(jr.job);
    add(rowFor(jr.account_manager_id, c), {
      entity: "job_referral",
      id: jr.id,
      label: `Referral: ${job?.title ?? "a job"}`,
      jobId: job?.id ?? null,
      since: jr.created_at,
    });
  }

  const groups = new Map<string, HandoffGroup>();
  for (const row of rows.values()) {
    let group = groups.get(row.accountManagerId);
    if (!group) {
      const s = staffMap.get(row.accountManagerId);
      group = {
        accountManagerId: row.accountManagerId,
        accountManagerName: s ? staffName(s) : "Unknown account manager",
        rows: [],
      };
      groups.set(row.accountManagerId, group);
    }
    group.rows.push(row);
  }
  const out = [...groups.values()];
  for (const g of out) g.rows.sort((a, b) => a.since.localeCompare(b.since)); // longest wait first
  out.sort((a, b) => b.rows.length - a.rows.length || a.accountManagerName.localeCompare(b.accountManagerName));
  return out;
}

// ─── tab 3 + candidate history: routed / assigned events ─────────────

export interface RoutingEvent {
  id: string;
  at: string;
  action: "routed" | "assigned";
  /** What moved. */
  entity: AssignEntity;
  candidateId: string | null;
  candidateName: string | null;
  /** The same, in words: "Their profile", "Application: …", "Referral: …". */
  what: string;
  accountManagerId: string | null;
  recruiterId: string | null;
  accountManagerName: string | null;
  recruiterName: string | null;
  /** Why, in plain words. */
  reason: string;
  /** Extra context, e.g. the job whose owner they were routed to. */
  detail: string | null;
  /** "Automatic" or the admin who did it. */
  by: string;
}

export async function listRecentlyRouted(limit = 50): Promise<RoutingEvent[]> {
  const sb = await createSupabaseServerClient();
  const { data, error } = await sb
    .from("activity_logs")
    .select("*")
    .in("action", ["routed", "assigned"])
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) fail("listRecentlyRouted", error);
  return hydrateRoutingEvents((data ?? []).map(toActivity));
}

/** Routing and assignment history for one person, their applications and their job referrals. */
export async function listRoutingHistory(candidateId: string, relatedIds: string[] = []): Promise<RoutingEvent[]> {
  const ids = [candidateId, ...relatedIds].filter(isUuid).slice(0, 150);
  if (ids.length === 0) return [];
  const sb = await createSupabaseServerClient();
  const { data, error } = await sb
    .from("activity_logs")
    .select("*")
    .in("action", ["routed", "assigned"])
    .in("entity_id", ids)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) fail("listRoutingHistory", error);
  return hydrateRoutingEvents((data ?? []).map(toActivity));
}

async function hydrateRoutingEvents(logs: ActivityLog[]): Promise<RoutingEvent[]> {
  if (logs.length === 0) return [];
  const sb = await createSupabaseServerClient();
  const str = (v: unknown): string | null => (isUuid(v) ? v : null);
  const idsOf = (type: string) => [
    ...new Set(logs.filter((l) => l.entityType === type && isUuid(l.entityId)).map((l) => l.entityId as string)),
  ];

  const applicationIds = idsOf("job_application");
  const jobReferralIds = idsOf("job_referral");
  const actorIds = [...new Set(logs.map((l) => l.actorUserId).filter(isUuid))];

  const [apps, jrs, actors, staffMap] = await Promise.all([
    applicationIds.length
      ? sb.from("job_applications").select("id, candidate_id, job:jobs(id, title)").in("id", applicationIds)
      : Promise.resolve({ data: [] as Row[], error: null }),
    jobReferralIds.length
      ? sb.from("job_referrals").select("id, candidate_id, job:jobs(id, title)").in("id", jobReferralIds)
      : Promise.resolve({ data: [] as Row[], error: null }),
    actorIds.length
      ? sb.from("profiles").select("id, first_name, last_name, email").in("id", actorIds)
      : Promise.resolve({ data: [] as Row[], error: null }),
    getStaffMap(),
  ]);
  if (apps.error) fail("hydrateRoutingEvents.applications", apps.error);
  if (jrs.error) fail("hydrateRoutingEvents.jobReferrals", jrs.error);
  if (actors.error) fail("hydrateRoutingEvents.actors", actors.error);

  const item = new Map<string, { candidateId: string | null; jobTitle: string | null }>();
  for (const r of [...((apps.data ?? []) as Row[]), ...((jrs.data ?? []) as Row[])]) {
    item.set(r.id, { candidateId: r.candidate_id ?? null, jobTitle: embedOne(r.job)?.title ?? null });
  }

  const candidateIds = new Set<string>(idsOf("candidate"));
  for (const v of item.values()) if (v.candidateId) candidateIds.add(v.candidateId);
  const jobIds = [...new Set(logs.map((l) => str(l.metadata.job_id)).filter(isUuid))];

  const [cands, jobs] = await Promise.all([
    candidateIds.size
      ? sb.from("candidates").select("id, first_name, last_name").in("id", [...candidateIds])
      : Promise.resolve({ data: [] as Row[], error: null }),
    jobIds.length
      ? sb.from("jobs").select("id, title").in("id", jobIds)
      : Promise.resolve({ data: [] as Row[], error: null }),
  ]);
  if (cands.error) fail("hydrateRoutingEvents.candidates", cands.error);
  if (jobs.error) fail("hydrateRoutingEvents.jobs", jobs.error);

  const candidateName = new Map(((cands.data ?? []) as Row[]).map((c) => [c.id as string, personName(c.first_name, c.last_name)]));
  const jobTitle = new Map(((jobs.data ?? []) as Row[]).map((j) => [j.id as string, (j.title as string) ?? null]));
  const actorName = new Map(
    ((actors.data ?? []) as Row[]).map((p) => [p.id as string, personName(p.first_name, p.last_name, p.email ?? "Admin")])
  );
  const nameOfStaff = (v: unknown): string | null => {
    const id = str(v);
    if (!id) return null;
    const s = staffMap.get(id);
    return s ? staffName(s) : "Former team member";
  };

  return logs.map((l) => {
    const related = l.entityId ? item.get(l.entityId) : undefined;
    const candidateId = l.entityType === "candidate" ? l.entityId : (related?.candidateId ?? null);
    const what =
      l.entityType === "job_application"
        ? `Application: ${related?.jobTitle ?? "a job"}`
        : l.entityType === "job_referral"
          ? `Referral: ${related?.jobTitle ?? "a job"}`
          : "Their profile";
    const automatic = l.action === "routed";
    const reasonKey = automatic && typeof l.metadata.reason === "string" ? l.metadata.reason : automatic ? null : "manual";
    const routedJob = str(l.metadata.job_id);
    return {
      id: l.id,
      at: l.createdAt,
      action: automatic ? "routed" : "assigned",
      entity: l.entityType === "job_application" || l.entityType === "job_referral" ? l.entityType : "candidate",
      candidateId,
      candidateName: candidateId ? (candidateName.get(candidateId) ?? null) : null,
      what,
      accountManagerId: str(l.metadata.account_manager_id),
      recruiterId: str(l.metadata.recruiter_id),
      accountManagerName: nameOfStaff(l.metadata.account_manager_id),
      recruiterName: nameOfStaff(l.metadata.recruiter_id),
      reason: reasonKey ? routingReasonLabel(reasonKey) : "Routed automatically",
      detail: reasonKey === "job_owner" && routedJob ? (jobTitle.get(routedJob) ?? null) : null,
      by: automatic ? "Automatic" : l.actorUserId ? (actorName.get(l.actorUserId) ?? "Admin") : "Admin",
    };
  });
}

// ─── applications ────────────────────────────────────────────────────

export const APPLICATIONS_PER_PAGE = 50;

export interface ApplicationFilter {
  status?: string;
  /** A staff id, or "none" for applications without an account manager. */
  am?: string;
  /** Only applications missing an account manager or a recruiter. */
  unassigned?: boolean;
  q?: string;
  page?: number;
}

export interface ApplicationRow {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  candidateId: string;
  applicantName: string;
  applicantEmail: string | null;
  jobId: string | null;
  jobTitle: string;
  jobLocation: string | null;
  jobHasOwner: boolean;
  accountManagerId: string | null;
  recruiterId: string | null;
  accountManager: StaffRef | null;
  recruiter: StaffRef | null;
  /** A link they pasted when applying, if any. */
  resumeUrl: string | null;
  /** True when a résumé is on file anywhere (application, upload, or link). */
  hasResume: boolean;
}

export interface ApplicationList {
  rows: ApplicationRow[];
  /** Rows matching every filter, including the status tab. */
  total: number;
  page: number;
  pageCount: number;
  /** Per-status counts with the other filters applied (for the tabs). */
  counts: Record<ApplicationStatus, number>;
  /** Sum of `counts`. */
  countAll: number;
}

function applyApplicationFilters(q: any, f: ApplicationFilter, status: ApplicationStatus | null): any {
  if (status) q = q.eq("status", status);
  if (f.am === "none") q = q.is("account_manager_id", null);
  else if (isUuid(f.am)) q = q.eq("account_manager_id", f.am);
  if (f.unassigned) q = q.or("account_manager_id.is.null,recruiter_id.is.null");
  for (const t of searchTokens(f.q)) {
    q = q.or(`first_name.ilike.%${t}%,last_name.ilike.%${t}%,email.ilike.%${t}%`, { referencedTable: "candidate" });
  }
  return q;
}

export async function listApplications(filter: ApplicationFilter): Promise<ApplicationList> {
  const sb = await createSupabaseServerClient();
  const status = APPLICATION_STATUSES.includes(filter.status as ApplicationStatus) ? (filter.status as ApplicationStatus) : null;

  // Counts first: the tabs need them, and asking for a page past the end is an error.
  const perStatus = await Promise.all(
    APPLICATION_STATUSES.map((s) =>
      headCount(
        "listApplications.count",
        applyApplicationFilters(
          sb.from("job_applications").select("id, candidate:candidates!inner(id)", { count: "exact", head: true }),
          filter,
          s
        )
      )
    )
  );
  const counts = Object.fromEntries(APPLICATION_STATUSES.map((s, i) => [s, perStatus[i]])) as Record<ApplicationStatus, number>;
  const countAll = perStatus.reduce((a, n) => a + n, 0);
  const total = status ? counts[status] : countAll;
  const pageCount = Math.max(1, Math.ceil(total / APPLICATIONS_PER_PAGE));
  const page = Math.min(Math.max(1, Math.floor(filter.page ?? 1) || 1), pageCount);
  if (total === 0) return { rows: [], total, page: 1, pageCount: 1, counts, countAll };

  const from = (page - 1) * APPLICATIONS_PER_PAGE;
  const { data, error } = await applyApplicationFilters(
    sb.from("job_applications").select(
      `id, status, created_at, resume_url, account_manager_id, recruiter_id, candidate_id, job_id,
       job:jobs(id, title, location_city, location_state, account_manager_id),
       candidate:candidates!inner(id, first_name, last_name, email, resume_url, resume_path),
       account_manager:staff!job_applications_account_manager_id_fkey(id, first_name, last_name),
       recruiter:staff!job_applications_recruiter_id_fkey(id, first_name, last_name)`
    ),
    filter,
    status
  )
    .order("created_at", { ascending: false })
    .order("id")
    .range(from, from + APPLICATIONS_PER_PAGE - 1);
  if (error) fail("listApplications", error);

  const rows: ApplicationRow[] = ((data ?? []) as Row[]).map((r) => {
    const c = embedOne(r.candidate);
    const job = embedOne(r.job);
    const link = [r.resume_url, c?.resume_url].find((u) => typeof u === "string" && /^https?:\/\//i.test(u)) ?? null;
    return {
      id: r.id,
      status: r.status,
      createdAt: r.created_at,
      candidateId: r.candidate_id,
      applicantName: personName(c?.first_name, c?.last_name),
      applicantEmail: c?.email ?? null,
      jobId: job?.id ?? r.job_id ?? null,
      jobTitle: job?.title ?? "Job removed",
      jobLocation: placeName(job?.location_city, job?.location_state),
      jobHasOwner: Boolean(job?.account_manager_id),
      accountManagerId: r.account_manager_id ?? null,
      recruiterId: r.recruiter_id ?? null,
      accountManager: toStaffRef(r.account_manager),
      recruiter: toStaffRef(r.recruiter),
      resumeUrl: link,
      hasResume: Boolean(r.resume_url || c?.resume_url || c?.resume_path),
    };
  });
  return { rows, total, page, pageCount, counts, countAll };
}

// ─── candidates list with owners ─────────────────────────────────────

export const CANDIDATES_PER_PAGE = 50;

export interface CandidateListFilter {
  search?: string;
  status?: string;
  source?: string;
  trade?: string;
  /** A staff id, or "none" for people without an account manager. */
  am?: string;
  /** A staff id, or "none" for people without a recruiter. */
  rec?: string;
  page?: number;
}

export interface CandidateListRow {
  candidate: Candidate;
  accountManager: StaffRef | null;
  recruiter: StaffRef | null;
  referrer: { id: string; name: string; email: string | null } | null;
}

export interface CandidateList {
  rows: CandidateListRow[];
  total: number;
  page: number;
  pageCount: number;
}

function applyCandidateFilters(q: any, f: CandidateListFilter): any {
  if (CANDIDATE_STATUSES.includes(f.status as ReferralStatus)) q = q.eq("status", f.status);
  if (CANDIDATE_SOURCES.includes(f.source as CandidateSource)) q = q.eq("source_type", f.source);
  if (f.trade && f.trade !== "all") q = q.eq("trade", f.trade);
  if (f.am === "none") q = q.is("account_manager_id", null);
  else if (isUuid(f.am)) q = q.eq("account_manager_id", f.am);
  if (f.rec === "none") q = q.is("recruiter_id", null);
  else if (isUuid(f.rec)) q = q.eq("recruiter_id", f.rec);
  // Every word has to match one of these fields, so "jane doe" finds Jane Doe.
  for (const t of searchTokens(f.search)) {
    q = q.or(
      ["first_name", "last_name", "email", "phone", "current_job_title", "location_city", "location_state"]
        .map((col) => `${col}.ilike.%${t}%`)
        .join(",")
    );
  }
  return q;
}

/** The candidates list: same search and filters as before, plus owner, recruiter and paging. */
export async function searchCandidatesWithOwners(filter: CandidateListFilter): Promise<CandidateList> {
  const sb = await createSupabaseServerClient();
  const total = await headCount(
    "searchCandidatesWithOwners.count",
    applyCandidateFilters(sb.from("candidates").select("id", { count: "exact", head: true }), filter)
  );
  const pageCount = Math.max(1, Math.ceil(total / CANDIDATES_PER_PAGE));
  const page = Math.min(Math.max(1, Math.floor(filter.page ?? 1) || 1), pageCount);
  if (total === 0) return { rows: [], total, page: 1, pageCount: 1 };

  const from = (page - 1) * CANDIDATES_PER_PAGE;
  const { data, error } = await applyCandidateFilters(
    sb.from("candidates").select(
      `*,
       account_manager:staff!candidates_account_manager_id_fkey(id, first_name, last_name),
       recruiter:staff!candidates_recruiter_id_fkey(id, first_name, last_name),
       referrer:profiles!candidates_primary_referrer_user_id_fkey(id, first_name, last_name, email)`
    ),
    filter
  )
    .order("created_at", { ascending: false })
    .order("id")
    .range(from, from + CANDIDATES_PER_PAGE - 1);
  if (error) fail("searchCandidatesWithOwners", error);

  const rows: CandidateListRow[] = ((data ?? []) as Row[]).map((r) => {
    const referrer = embedOne(r.referrer);
    return {
      candidate: toCandidate(r),
      accountManager: toStaffRef(r.account_manager),
      recruiter: toStaffRef(r.recruiter),
      referrer: referrer
        ? {
            id: referrer.id,
            name: personName(referrer.first_name, referrer.last_name, referrer.email ?? "A member"),
            email: referrer.email ?? null,
          }
        : null,
    };
  });
  return { rows, total, page, pageCount };
}
