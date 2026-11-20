import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { toActivity, toProfile } from "@/lib/data/mappers";
import { getStaffMap, staffName } from "@/lib/admin/staff";
import type { ActivityLookups } from "@/lib/admin/activity-labels";
import type { GeneratedResume } from "@/lib/resume";
import type { ActivityLog, ApplicationStatus, PayoutStatus, Profile, ReferralStatus } from "@/types";

/**
 * Admin data access for the Members directory, the member detail screen,
 * the Activity log and the CSV exports. Everything runs as the signed-in
 * admin; Row Level Security returns nothing to anyone else.
 */

export type Sb = Awaited<ReturnType<typeof createSupabaseServerClient>>;
export type Row = Record<string, unknown>;
type RawParams = Record<string, string | string[] | undefined> | URLSearchParams;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (v: unknown): v is string => typeof v === "string" && UUID.test(v);

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v : null);
const obj = (v: unknown): Row => (v && typeof v === "object" && !Array.isArray(v) ? (v as Row) : {});
const first = (v: unknown): Row | null => (Array.isArray(v) ? (v[0] ? obj(v[0]) : null) : v ? obj(v) : null);
const rows = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]) : []);

function reader(sp: RawParams): (key: string) => string {
  return (key) => {
    const v = sp instanceof URLSearchParams ? sp.get(key) : sp[key];
    return String((Array.isArray(v) ? v[0] : v) ?? "").trim();
  };
}

function pick<T extends string>(value: string, allowed: readonly T[]): T | "" {
  return (allowed as readonly string[]).includes(value) ? (value as T) : "";
}

function pageNumber(value: string): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 100000) : 1;
}

// ── labels ───────────────────────────────────────────────────────────

export const INTENT_LABEL: Record<string, string> = {
  job: "Looking for work",
  open: "Open to the right move",
  refer: "Referring people",
  both: "Looking and referring",
};

export const CAREER_STATUS_LABEL: Record<string, string> = {
  actively_looking: "Actively looking",
  open_to_offers: "Open to a move",
  not_looking: "Referring only",
};

export const SOURCE_LABEL: Record<string, string> = {
  recruiter: "Recruiter code",
  member_invite: "Member invite",
  organic: "Organic",
};

export const RELOCATION_LABEL: Record<string, string> = {
  yes: "Open to relocating",
  maybe: "For the right role",
  no: "Not relocating",
};

export const PLATFORM_LABEL: Record<string, string> = { web: "Web", ios: "iOS", android: "Android" };

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS",
  "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC",
  "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
] as const;

export function memberName(p: { firstName?: string | null; lastName?: string | null; email?: string | null } | null | undefined): string {
  if (!p) return "Unknown";
  return [p.firstName, p.lastName].filter(Boolean).join(" ").trim() || p.email || "Unnamed member";
}

const rowName = (r: Row | null | undefined): string =>
  r ? [str(r.first_name), str(r.last_name)].filter(Boolean).join(" ") || str(r.email) || "Unnamed" : "";

/** Uploaded a file, or built one in the app. */
export function hasResume(p: Pick<Profile, "resumePath" | "resumeBuilder">): boolean {
  return Boolean(p.resumePath) || p.resumeBuilder?.generated != null;
}

/** The built resume comes from JSON, so check its shape before rendering it. */
export function asGeneratedResume(v: unknown): GeneratedResume | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const o = v as Row;
  const s = (x: unknown) => (typeof x === "string" ? x : "");
  const list = (x: unknown) => (Array.isArray(x) ? x.filter((i): i is string => typeof i === "string") : []);
  const experience = rows(o.experience)
    .filter((e) => e && typeof e === "object")
    .map((e) => ({ title: s(e.title), company: s(e.company), years: s(e.years), bullets: list(e.bullets) }));
  const r: GeneratedResume = {
    name: s(o.name),
    contact: list(o.contact),
    headline: s(o.headline),
    summary: s(o.summary),
    experience,
    education: list(o.education),
    certifications: list(o.certifications),
    skills: list(o.skills),
    references: list(o.references),
  };
  const empty = !r.name && !r.headline && !r.summary && !experience.length && !r.education.length && !r.skills.length;
  return empty ? null : r;
}

/** Only ever link out to http(s) addresses typed by members. */
export function safeUrl(v: string | null | undefined): string | null {
  const t = (v ?? "").trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return null;
  return /^[\w-]+(\.[\w-]+)+(\/|$)/.test(t) ? `https://${t}` : null;
}

// ── paging helpers ───────────────────────────────────────────────────

interface PageResult {
  data: unknown;
  error: { message: string; code?: string } | null;
  count?: number | null;
}

/**
 * Read every row of a query, 1,000 at a time (PostgREST never returns more
 * per request). `page` must apply a stable order and `.range(from, to)`.
 * Pass `{ count: "exact" }` in the select so a lower server cap can't cut
 * the result short.
 */
export async function fetchAllRows(
  page: (from: number, to: number) => PromiseLike<PageResult>,
  opts: { chunk?: number; max?: number } = {}
): Promise<Row[]> {
  const chunk = opts.chunk ?? 1000;
  const max = opts.max ?? 250000;
  const out: Row[] = [];
  while (out.length < max) {
    const { data, error, count } = await page(out.length, out.length + chunk - 1);
    if (error) {
      if (error.code === "PGRST103") break; // asked for a range past the end
      throw new Error(error.message || "Query failed");
    }
    const batch = rows(data);
    for (const r of batch) out.push(r);
    if (batch.length === 0) break;
    if (count != null ? out.length >= count : batch.length < chunk) break;
  }
  return out;
}

/** Look rows up by id in small batches (ids travel in the URL). Never throws: names are decoration. */
export async function fetchByIds(sb: Sb, table: string, columns: string, ids: Iterable<unknown>): Promise<Row[]> {
  const list = [...new Set([...ids].filter(isUuid))];
  const out: Row[] = [];
  for (let i = 0; i < list.length; i += 100) {
    const { data, error } = await sb.from(table).select(columns).in("id", list.slice(i, i + 100));
    if (error) {
      console.error(`[ECRN] fetchByIds(${table}) failed:`, error.message);
      continue;
    }
    for (const r of rows(data)) out.push(r);
  }
  return out;
}

// ── members: filters ─────────────────────────────────────────────────

export const MEMBERS_PAGE_SIZE = 50;
export const MEMBER_SORTS = ["newest", "last_seen", "name"] as const;
export type MemberSort = (typeof MEMBER_SORTS)[number];

export interface MemberFilters {
  q: string;
  intent: "" | "job" | "open" | "refer" | "both";
  source: "" | "recruiter" | "member_invite" | "organic";
  /** "" = anyone, "none" = no recruiter, otherwise a staff id */
  recruiter: string;
  resume: "" | "yes" | "no";
  /** two-letter state code */
  state: string;
  onboarding: "" | "done" | "not_done";
  sort: MemberSort;
  page: number;
}

export function parseMemberFilters(sp: RawParams): MemberFilters {
  const get = reader(sp);
  const recruiter = get("recruiter");
  const state = get("state").toUpperCase();
  return {
    q: get("q").slice(0, 120),
    intent: pick(get("intent"), ["job", "open", "refer", "both"] as const),
    source: pick(get("source"), ["recruiter", "member_invite", "organic"] as const),
    recruiter: recruiter === "none" || isUuid(recruiter) ? recruiter : "",
    resume: pick(get("resume"), ["yes", "no"] as const),
    state: /^[A-Z]{2}$/.test(state) ? state : "",
    onboarding: pick(get("onboarding"), ["done", "not_done"] as const),
    sort: pick(get("sort"), MEMBER_SORTS) || "newest",
    page: pageNumber(get("page")),
  };
}

/** Filters back to a query string (defaults left out). `page` is only included when you pass it. */
export function memberFilterParams(f: MemberFilters, page?: number): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.intent) p.set("intent", f.intent);
  if (f.source) p.set("source", f.source);
  if (f.recruiter) p.set("recruiter", f.recruiter);
  if (f.resume) p.set("resume", f.resume);
  if (f.state) p.set("state", f.state);
  if (f.onboarding) p.set("onboarding", f.onboarding);
  if (f.sort !== "newest") p.set("sort", f.sort);
  if (page && page > 1) p.set("page", String(page));
  return p;
}

export function memberFiltersActive(f: MemberFilters): boolean {
  return Boolean(f.q || f.intent || f.source || f.recruiter || f.resume || f.state || f.onboarding);
}

const SEARCH_COLUMNS = ["first_name", "last_name", "email", "phone", "location_city"];
const RESUME_ON_FILE = "resume_path.not.is.null,resume_builder->>generated.not.is.null";

/** Words to search for, with the characters PostgREST treats specially removed. */
function searchTokens(q: string): string[] {
  return q
    .replace(/["\\%*]/g, " ")
    .split(/[\s,()]+/)
    .filter(Boolean)
    .slice(0, 4);
}

/** `profiles` (never admins) with the directory filters applied. No order, no range. */
export function membersQuery(sb: Sb, f: MemberFilters, columns: string, opts?: { count?: "exact"; head?: boolean }) {
  let q = sb.from("profiles").select(columns, opts).neq("role", "admin");
  // Every word must match one of name / email / phone / city.
  for (const t of searchTokens(f.q)) q = q.or(SEARCH_COLUMNS.map((c) => `${c}.ilike."%${t}%"`).join(","));
  if (f.intent) q = q.eq("intent", f.intent);
  if (f.source) q = q.eq("signup_source", f.source);
  if (f.recruiter === "none") q = q.is("recruited_by_staff_id", null);
  else if (f.recruiter) q = q.eq("recruited_by_staff_id", f.recruiter);
  if (f.resume === "yes") q = q.or(RESUME_ON_FILE);
  else if (f.resume === "no") q = q.is("resume_path", null).is("resume_builder->>generated", null);
  if (f.state) q = q.ilike("location_state", f.state);
  if (f.onboarding === "done") q = q.eq("onboarded", true);
  else if (f.onboarding === "not_done") q = q.eq("onboarded", false);
  return q;
}

/** One page of the filtered directory, in the chosen order, with an exact total. */
export function membersPage(sb: Sb, f: MemberFilters, columns: string, from: number, to: number) {
  const q = membersQuery(sb, f, columns, { count: "exact" });
  const sorted =
    f.sort === "name"
      ? q.order("first_name", { ascending: true, nullsFirst: false }).order("last_name", { ascending: true, nullsFirst: false })
      : f.sort === "last_seen"
        ? q.order("last_seen_at", { ascending: false, nullsFirst: false })
        : q;
  return sorted.order("created_at", { ascending: false }).order("id").range(from, to);
}

export async function listMembers(f: MemberFilters): Promise<{ members: Profile[]; total: number; pastEnd: boolean }> {
  const sb = await createSupabaseServerClient();
  const from = (f.page - 1) * MEMBERS_PAGE_SIZE;
  const { data, count, error } = await membersPage(sb, f, "*", from, from + MEMBERS_PAGE_SIZE - 1);
  if (error) {
    if (error.code === "PGRST103") return { members: [], total: 0, pastEnd: true };
    throw new Error(`listMembers: ${error.message}`);
  }
  const members = rows(data).map(toProfile);
  return { members, total: count ?? members.length, pastEnd: false };
}

export interface MemberStats {
  total: number;
  joined7d: number;
  onboarded: number;
  resumeOnFile: number;
  openToMove: number;
  active7d: number;
}

export async function getMemberStats(): Promise<MemberStats> {
  const sb = await createSupabaseServerClient();
  const base = () => sb.from("profiles").select("id", { count: "exact", head: true }).neq("role", "admin");
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const results = await Promise.all([
    base(),
    base().gte("created_at", since),
    base().eq("onboarded", true),
    base().or(RESUME_ON_FILE),
    base().eq("career_status", "open_to_offers"),
    base().gte("last_seen_at", since),
  ]);
  const [total, joined7d, onboarded, resumeOnFile, openToMove, active7d] = results.map((r) => {
    if (r.error) throw new Error(`getMemberStats: ${r.error.message || "count failed"}`);
    return r.count ?? 0;
  });
  return { total, joined7d, onboarded, resumeOnFile, openToMove, active7d };
}

// ── activity log ─────────────────────────────────────────────────────

export const ACTIVITY_PAGE_SIZE = 100;

export interface ActivityFilters {
  action: string;
  entity: string;
  /** YYYY-MM-DD, inclusive, UTC */
  from: string;
  to: string;
  /** part of the actor's email address */
  actor: string;
  page: number;
}

export interface ActivityActor {
  id: string;
  name: string;
  email: string | null;
  isAdmin: boolean;
}

export interface ActivityRow extends ActivityLog {
  actor: ActivityActor | null;
}

const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));

export function parseActivityFilters(sp: RawParams): ActivityFilters {
  const get = reader(sp);
  const slug = (v: string) => (/^[a-z][a-z0-9_]{0,63}$/.test(v) ? v : "");
  const from = get("from");
  const to = get("to");
  return {
    action: slug(get("action")),
    entity: slug(get("entity_type") || get("entity")),
    from: isDate(from) ? from : "",
    to: isDate(to) ? to : "",
    actor: get("actor").slice(0, 120),
    page: pageNumber(get("page")),
  };
}

export function activityFilterParams(f: ActivityFilters, page?: number): URLSearchParams {
  const p = new URLSearchParams();
  if (f.action) p.set("action", f.action);
  if (f.entity) p.set("entity_type", f.entity);
  if (f.from) p.set("from", f.from);
  if (f.to) p.set("to", f.to);
  if (f.actor) p.set("actor", f.actor);
  if (page && page > 1) p.set("page", String(page));
  return p;
}

export function activityFiltersActive(f: ActivityFilters): boolean {
  return Boolean(f.action || f.entity || f.from || f.to || f.actor);
}

const ACTOR_COLUMNS = "(id, first_name, last_name, email, role)";
const ACTIVITY_COLUMNS = `*, actor:profiles!activity_logs_actor_user_id_fkey${ACTOR_COLUMNS}`;
const ACTIVITY_COLUMNS_ACTOR_REQUIRED = `*, actor:profiles!activity_logs_actor_user_id_fkey!inner${ACTOR_COLUMNS}`;

/** One page of the audit trail, newest first, with the actor's profile and an exact total. */
export function activityPage(sb: Sb, f: ActivityFilters, from: number, to: number) {
  const actor = f.actor.replace(/[%*\\]/g, " ").trim();
  let q = sb.from("activity_logs").select(actor ? ACTIVITY_COLUMNS_ACTOR_REQUIRED : ACTIVITY_COLUMNS, { count: "exact" });
  if (f.action) q = q.eq("action", f.action);
  if (f.entity) q = q.eq("entity_type", f.entity);
  if (f.from) q = q.gte("created_at", `${f.from}T00:00:00.000Z`);
  if (f.to) q = q.lt("created_at", new Date(Date.parse(`${f.to}T00:00:00Z`) + 86400000).toISOString());
  if (actor) q = q.ilike("actor.email", `%${actor}%`);
  return q.order("created_at", { ascending: false }).order("id").range(from, to);
}

export function toActivityRow(r: Row): ActivityRow {
  const a = first(r.actor);
  return {
    ...toActivity(r),
    actor: a && isUuid(a.id) ? { id: a.id, name: rowName(a), email: str(a.email), isAdmin: a.role === "admin" } : null,
  };
}

export async function listActivity(
  f: ActivityFilters
): Promise<{ logs: ActivityRow[]; total: number; pastEnd: boolean; lookups: ActivityLookups }> {
  const sb = await createSupabaseServerClient();
  const from = (f.page - 1) * ACTIVITY_PAGE_SIZE;
  const { data, count, error } = await activityPage(sb, f, from, from + ACTIVITY_PAGE_SIZE - 1);
  if (error) {
    if (error.code === "PGRST103") return { logs: [], total: 0, pastEnd: true, lookups: {} };
    throw new Error(`listActivity: ${error.message}`);
  }
  const logs = rows(data).map(toActivityRow);
  return { logs, total: count ?? logs.length, pastEnd: false, lookups: await loadActivityLookups(sb, logs) };
}

/** Staff names only: enough for routing and attribution sentences (used by the CSV export). */
export async function staffLookups(): Promise<ActivityLookups> {
  const staff: Record<string, string> = {};
  for (const [id, s] of await getStaffMap()) staff[id] = staffName(s);
  return { staff };
}

/** Records that only make sense through the candidate / job they point at. */
const LINKED_ENTITIES: ReadonlySet<string> = new Set(["referral", "job_referral", "job_application", "payout"]);

/**
 * Resolve the names a page of log rows mentions (members, candidates, jobs,
 * companies, team) so each row can read as a sentence and link to its record.
 */
export async function loadActivityLookups(sb: Sb, logs: ActivityLog[]): Promise<ActivityLookups> {
  const ids: Record<string, Set<string>> = {
    profile: new Set(),
    candidate: new Set(),
    job: new Set(),
    referral: new Set(),
    job_referral: new Set(),
    job_application: new Set(),
    payout: new Set(),
    company_lead: new Set(),
  };
  const add = (kind: string, v: unknown) => {
    if (isUuid(v)) ids[kind]?.add(v);
  };
  for (const log of logs) {
    const m = log.metadata;
    add("candidate", m.candidate_id);
    add("job", m.job_id);
    add("profile", m.invited_by);
    if (log.action === "primary_referrer_reassigned") {
      add("profile", m.from);
      add("profile", m.to);
    }
    if (LINKED_ENTITIES.has(log.entityType)) {
      // Skip the lookup when the metadata already says which candidate (and job) the row is about.
      const known = isUuid(m.candidate_id) && (log.entityType === "referral" || isUuid(m.job_id));
      if (!known) add(log.entityType, log.entityId);
    } else {
      add(log.entityType, log.entityId);
    }
  }

  const linkColumns = "id, candidate_id, job_id";
  const [staff, referrals, jobReferrals, applications, payouts, companies] = await Promise.all([
    staffLookups(),
    fetchByIds(sb, "referrals", "id, candidate_id", ids.referral),
    fetchByIds(sb, "job_referrals", linkColumns, ids.job_referral),
    fetchByIds(sb, "job_applications", linkColumns, ids.job_application),
    fetchByIds(sb, "payouts", linkColumns, ids.payout),
    fetchByIds(sb, "company_leads", "id, company_name", ids.company_lead),
  ]);

  const links: NonNullable<ActivityLookups["links"]> = {};
  for (const r of [...referrals, ...jobReferrals, ...applications, ...payouts]) {
    if (!isUuid(r.id)) continue;
    links[r.id] = { candidateId: str(r.candidate_id), jobId: str(r.job_id) };
    add("candidate", r.candidate_id);
    add("job", r.job_id);
  }

  const [profiles, candidates, jobs] = await Promise.all([
    fetchByIds(sb, "profiles", "id, first_name, last_name, email, role", ids.profile),
    fetchByIds(sb, "candidates", "id, first_name, last_name", ids.candidate),
    fetchByIds(sb, "jobs", "id, title", ids.job),
  ]);

  const out: ActivityLookups = { ...staff, links, profiles: {}, candidates: {}, jobs: {}, companies: {} };
  for (const p of profiles) if (isUuid(p.id)) out.profiles![p.id] = { name: rowName(p), isAdmin: p.role === "admin" };
  for (const c of candidates) if (isUuid(c.id)) out.candidates![c.id] = rowName(c);
  for (const j of jobs) if (isUuid(j.id)) out.jobs![j.id] = str(j.title) ?? "Untitled job";
  for (const c of companies) if (isUuid(c.id)) out.companies![c.id] = str(c.company_name) ?? "Company";
  return out;
}

// ── member detail ────────────────────────────────────────────────────

export interface PersonRef {
  id: string;
  name: string;
  email: string | null;
  isAdmin: boolean;
}

export interface MemberCandidate {
  id: string;
  name: string;
  status: ReferralStatus;
  sourceType: string;
  accountManagerId: string | null;
  recruiterId: string | null;
  routingReason: string | null;
  routedAt: string | null;
  externalCrmId: string | null;
  createdAt: string;
}

export interface MemberApplication {
  id: string;
  status: ApplicationStatus;
  createdAt: string;
  jobId: string;
  jobTitle: string;
  jobPlace: string;
  accountManagerId: string | null;
  recruiterId: string | null;
}

export interface MemberReferral {
  id: string;
  candidateId: string;
  /** null when the candidate row is gone; fall back to what they typed */
  candidateName: string;
  status: ReferralStatus;
  isPrimary: boolean;
  duplicateStatus: string;
  source: string | null;
  createdAt: string;
  jobs: { id: string; title: string }[];
}

export interface MemberPayout {
  id: string;
  amountCents: number;
  status: PayoutStatus;
  candidateName: string | null;
  jobTitle: string | null;
  placementDate: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface MemberInvitee {
  id: string;
  name: string;
  email: string | null;
  onboarded: boolean;
  createdAt: string;
}

export interface MemberDevice {
  id: string;
  platform: string;
  createdAt: string;
  lastSeenAt: string | null;
}

export interface MemberNotification {
  id: string;
  eventType: string;
  channel: string;
  status: string;
  error: string | null;
  createdAt: string;
}

export interface MemberDetail {
  profile: Profile;
  onboardingAnswers: Row;
  resumeUrl: string | null;
  builtResume: GeneratedResume | null;
  resumeBuilderAnswers: Row;
  inviter: PersonRef | null;
  candidates: MemberCandidate[];
  applications: MemberApplication[];
  referrals: MemberReferral[];
  placements: number;
  payouts: MemberPayout[];
  invited: MemberInvitee[];
  invitedTotal: number;
  devices: MemberDevice[];
  notifications: MemberNotification[];
  activity: ActivityRow[];
  lookups: ActivityLookups;
}

const PLACED: ReadonlySet<string> = new Set(["placed", "payout_pending", "payout_approved", "payout_paid"]);

/** A failed side panel should not take the whole member page down. */
function soft(what: string, r: { data: unknown; error: { message: string } | null }): Row[] {
  if (r.error) {
    console.error(`[ECRN] member detail: ${what} failed:`, r.error.message);
    return [];
  }
  return rows(r.data);
}

/** Everything ECRN knows about one person. Returns null when the id is not a profile. */
export async function getMemberDetail(id: string): Promise<MemberDetail | null> {
  if (!isUuid(id)) return null;
  const sb = await createSupabaseServerClient();
  const { data: raw, error } = await sb.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`getMemberDetail: ${error.message}`);
  if (!raw) return null;
  const profile = toProfile(raw);

  const [inviterRes, candidateRes, appRes, referralRes, jobReferralRes, payoutRes, invitedRes, deviceRes, notifRes, activityRes, signed] =
    await Promise.all([
      profile.invitedBy
        ? sb.from("profiles").select("id, first_name, last_name, email, role").eq("id", profile.invitedBy).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      sb
        .from("candidates")
        .select("id, first_name, last_name, status, source_type, account_manager_id, recruiter_id, routing_reason, routed_at, external_crm_id, created_at")
        .eq("user_id", id)
        .order("created_at")
        .limit(10),
      sb
        .from("job_applications")
        .select("id, status, created_at, job_id, account_manager_id, recruiter_id, job:jobs(id, title, location_city, location_state)")
        .eq("applicant_user_id", id)
        .order("created_at", { ascending: false })
        .limit(200),
      sb
        .from("referrals")
        .select("id, candidate_id, status, is_primary, duplicate_status, referral_source, metadata, created_at, candidate:candidates(id, first_name, last_name, status)")
        .eq("referrer_user_id", id)
        .order("created_at", { ascending: false })
        .limit(500),
      sb.from("job_referrals").select("id, candidate_id, job_id, job:jobs(id, title)").eq("referrer_user_id", id).limit(500),
      sb
        .from("payouts")
        .select("id, amount_cents, status, placement_date, paid_at, created_at, candidate:candidates(id, first_name, last_name), job:jobs(id, title)")
        .eq("referrer_user_id", id)
        .order("created_at", { ascending: false })
        .limit(200),
      sb
        .from("profiles")
        .select("id, first_name, last_name, email, onboarded, created_at", { count: "exact" })
        .eq("invited_by", id)
        .order("created_at", { ascending: false })
        .limit(100),
      sb.from("device_tokens").select("id, platform, created_at, last_seen_at").eq("user_id", id).order("last_seen_at", { ascending: false }).limit(20),
      sb
        .from("notification_events")
        .select("id, event_type, channel, status, error, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false })
        .limit(20),
      sb
        .from("activity_logs")
        .select(ACTIVITY_COLUMNS)
        .or(`actor_user_id.eq.${id},entity_id.eq.${id}`)
        .order("created_at", { ascending: false })
        .order("id")
        .limit(50),
      profile.resumePath
        ? sb.storage.from("resumes").createSignedUrl(profile.resumePath, 600)
        : Promise.resolve({ data: null, error: null }),
    ]);

  const inviterRow = inviterRes.error ? null : first(inviterRes.data);
  const jobsByCandidate = new Map<string, { id: string; title: string }[]>();
  for (const jr of soft("job referrals", jobReferralRes)) {
    const job = first(jr.job);
    if (!isUuid(jr.candidate_id) || !job || !isUuid(job.id)) continue;
    const list = jobsByCandidate.get(jr.candidate_id) ?? [];
    if (!list.some((j) => j.id === job.id)) list.push({ id: job.id, title: str(job.title) ?? "Untitled job" });
    jobsByCandidate.set(jr.candidate_id, list);
  }

  const referrals: MemberReferral[] = soft("referrals", referralRes).map((r) => {
    const c = first(r.candidate);
    const typed = obj(obj(r.metadata).submitted);
    const isPrimary = Boolean(r.is_primary);
    return {
      id: String(r.id),
      candidateId: String(r.candidate_id),
      candidateName: (c ? rowName(c) : rowName(typed)) || "Referred contact",
      // The candidate record is the live pipeline status for the referral that holds the credit.
      status: ((isPrimary && c ? c.status : r.status) ?? "submitted") as ReferralStatus,
      isPrimary,
      duplicateStatus: str(r.duplicate_status) ?? "unique",
      source: str(r.referral_source),
      createdAt: String(r.created_at),
      jobs: jobsByCandidate.get(String(r.candidate_id)) ?? [],
    };
  });

  const activity = soft("activity", activityRes).map(toActivityRow);

  return {
    profile,
    onboardingAnswers: obj(raw.onboarding_answers),
    resumeUrl: signed.error ? null : str(obj(signed.data).signedUrl),
    builtResume: asGeneratedResume(profile.resumeBuilder.generated),
    resumeBuilderAnswers: obj(profile.resumeBuilder.answers),
    inviter:
      inviterRow && isUuid(inviterRow.id)
        ? { id: inviterRow.id, name: rowName(inviterRow), email: str(inviterRow.email), isAdmin: inviterRow.role === "admin" }
        : null,
    candidates: soft("candidate", candidateRes).map((c) => ({
      id: String(c.id),
      name: rowName(c),
      status: c.status as ReferralStatus,
      sourceType: str(c.source_type) ?? "",
      accountManagerId: str(c.account_manager_id),
      recruiterId: str(c.recruiter_id),
      routingReason: str(c.routing_reason),
      routedAt: str(c.routed_at),
      externalCrmId: str(c.external_crm_id),
      createdAt: String(c.created_at),
    })),
    applications: soft("applications", appRes).map((a) => {
      const job = first(a.job);
      return {
        id: String(a.id),
        status: a.status as ApplicationStatus,
        createdAt: String(a.created_at),
        jobId: String(a.job_id),
        jobTitle: (job && str(job.title)) || "Job no longer listed",
        jobPlace: job ? [str(job.location_city), str(job.location_state)].filter(Boolean).join(", ") : "",
        accountManagerId: str(a.account_manager_id),
        recruiterId: str(a.recruiter_id),
      };
    }),
    referrals,
    placements: referrals.filter((r) => r.isPrimary && PLACED.has(r.status)).length,
    payouts: soft("payouts", payoutRes).map((p) => {
      const c = first(p.candidate);
      const job = first(p.job);
      return {
        id: String(p.id),
        amountCents: typeof p.amount_cents === "number" ? p.amount_cents : 0,
        status: p.status as PayoutStatus,
        candidateName: c ? rowName(c) : null,
        jobTitle: job ? str(job.title) : null,
        placementDate: str(p.placement_date),
        paidAt: str(p.paid_at),
        createdAt: String(p.created_at),
      };
    }),
    invited: soft("invited", invitedRes).map((p) => ({
      id: String(p.id),
      name: rowName(p),
      email: str(p.email),
      onboarded: Boolean(p.onboarded),
      createdAt: String(p.created_at),
    })),
    invitedTotal: invitedRes.error ? 0 : invitedRes.count ?? 0,
    devices: soft("devices", deviceRes).map((d) => ({
      id: String(d.id),
      platform: str(d.platform) ?? "",
      createdAt: String(d.created_at),
      lastSeenAt: str(d.last_seen_at),
    })),
    notifications: soft("notifications", notifRes).map((n) => ({
      id: String(n.id),
      eventType: str(n.event_type) ?? "",
      channel: str(n.channel) ?? "",
      status: str(n.status) ?? "",
      error: str(n.error),
      createdAt: String(n.created_at),
    })),
    activity,
    lookups: await loadActivityLookups(sb, activity),
  };
}
