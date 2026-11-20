import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ApplicationStatus, JobStatus, ReferralStatus, StaffRole } from "@/types";
import {
  APPLICATION_TO_REFERRAL_STATUS,
  mapCandidateStatus,
  mapEmploymentType,
  mapJobStatus,
  mapSubmissionStatus,
  mapTrade,
  normKey,
} from "./mapping";

/**
 * Bullhorn → ECRN.
 *
 * Staffing Referrals (or the direct Bullhorn client, or the admin simulator)
 * hands ECRN an event shaped `{ id?, type, data }`. `applyInboundEvent` turns
 * it into changes on ECRN's own tables:
 *
 *   user.upserted        CorporateUser → staff
 *   job.upserted         JobOrder      → jobs (+ owner, recruiters, client name)
 *   job.closed           JobOrder      → jobs.status
 *   candidate.linked     Candidate     → candidates.external_crm_id
 *   candidate.updated    Candidate     → candidates status / owner / recruiter
 *   submission.updated   JobSubmission → job_applications.status (or the job referral)
 *   placement.created    Placement     → candidate "placed" (DB trigger opens the payout)
 *   placement.updated
 *
 * Rules every handler follows:
 *   - Match by ECRN id first, then the Bullhorn id, then email where that is safe.
 *   - Tolerate missing fields. An absent field never blanks an ECRN value.
 *   - Keep the raw record in `crm_records` so nothing from Bullhorn is lost.
 *   - Never throw past `applyInboundEvent`: one bad event cannot stop the rest.
 *
 * `sb` is any Supabase client with write access: the service client for the
 * webhook, or an admin's session client for the simulator.
 *
 * Field and status tables live in ./mapping.ts. Reference with sample payloads:
 * docs/BULLHORN_INTEGRATION.md.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type Json = Record<string, any>;
type Row = Record<string, any>;

export interface InboundEvent {
  /** The sender's event id. Used to ignore repeats. */
  id: string | null;
  type: string;
  data: Json;
}

export type InboundStatus = "applied" | "ignored" | "failed";

export interface InboundOutcome {
  status: InboundStatus;
  type: string;
  /** One plain sentence for the admin inbox. */
  summary: string;
  result: Json | null;
  error: string | null;
}

export interface ApplyOptions {
  /** `crm_records.provider` for the raw copy. Default "bullhorn"; the simulator uses "simulator". */
  mirrorProvider?: string;
  /** Marks activity entries as coming from the simulator. */
  simulated?: boolean;
}

export type CanonicalType =
  | "user.upserted"
  | "job.upserted"
  | "job.closed"
  | "candidate.linked"
  | "candidate.updated"
  | "submission.updated"
  | "placement.created"
  | "placement.updated";

export const INBOUND_EVENT_TYPES: CanonicalType[] = [
  "user.upserted",
  "job.upserted",
  "job.closed",
  "candidate.linked",
  "candidate.updated",
  "submission.updated",
  "placement.created",
  "placement.updated",
];

/** Largest batch the webhook accepts in one request. */
export const MAX_EVENTS_PER_REQUEST = 25;

const ECHO_NOTE = "Echo of an inbound Bullhorn event. Not sent back.";

// ═══ Small parsing helpers ═══════════════════════════════════════════

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isObj(v: unknown): v is Json {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function str(v: unknown): string | null {
  if (typeof v === "string") {
    const t = v.trim();
    return t ? t : null;
  }
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}
function num(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const t = v.replace(/[$,\s]/g, "");
    if (t && Number.isFinite(Number(t))) return Number(t);
  }
  return null;
}
function bool(v: unknown): boolean | null {
  if (typeof v === "boolean") return v;
  if (v === 1 || v === "1" || v === "true" || v === "yes") return true;
  if (v === 0 || v === "0" || v === "false" || v === "no") return false;
  return null;
}
function uuid(v: unknown): string | null {
  const s = str(v);
  return s && UUID_RE.test(s) ? s.toLowerCase() : null;
}
function first(...vals: unknown[]): unknown {
  for (const v of vals) if (v !== undefined && v !== null && v !== "") return v;
  return null;
}
/** Bullhorn sends dates as epoch milliseconds; ISO strings are accepted too. Returns YYYY-MM-DD. */
function toDate(v: unknown): string | null {
  let ms: number | null = null;
  if (typeof v === "number" && Number.isFinite(v)) ms = v < 1e11 ? v * 1000 : v;
  else if (typeof v === "string" && v.trim()) {
    const t = v.trim();
    ms = /^\d+$/.test(t) ? (Number(t) < 1e11 ? Number(t) * 1000 : Number(t)) : Date.parse(t);
  }
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return null;
  return new Date(ms).toISOString().slice(0, 10);
}
/** A plain array, or Bullhorn's to-many shape `{ total, data: [...] }`. */
function list(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (isObj(v) && Array.isArray(v.data)) return v.data;
  return [];
}
/** Escape % and _ so `ilike` behaves as a case-insensitive equals. */
function likeExact(v: string): string {
  return v.replace(/[\\%_]/g, "\\$&");
}
function errText(e: unknown): string {
  return (e instanceof Error ? e.message : String(e)).slice(0, 500);
}
function must<T>(res: { data: T | null; error: { message: string } | null }, what: string): T | null {
  if (res.error) throw new Error(`${what}: ${res.error.message}`);
  return res.data;
}

function htmlToText(s: string | null): string | null {
  if (!s) return null;
  if (!/[<&]/.test(s)) return s.trim() || null;
  const out = s
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "\n• ")
    .replace(/<\s*\/\s*(p|div|h[1-6]|ul|ol|tr|li)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return out || null;
}

const US_STATES: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA", colorado: "CO", connecticut: "CT",
  delaware: "DE", "district of columbia": "DC", florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID", illinois: "IL",
  indiana: "IN", iowa: "IA", kansas: "KS", kentucky: "KY", louisiana: "LA", maine: "ME", maryland: "MD",
  massachusetts: "MA", michigan: "MI", minnesota: "MN", mississippi: "MS", missouri: "MO", montana: "MT",
  nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
  "north carolina": "NC", "north dakota": "ND", ohio: "OH", oklahoma: "OK", oregon: "OR", pennsylvania: "PA",
  "rhode island": "RI", "south carolina": "SC", "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT",
  vermont: "VT", virginia: "VA", washington: "WA", "west virginia": "WV", wisconsin: "WI", wyoming: "WY",
};
/** "Florida" → "FL". ECRN stores state codes (territories and the job map rely on them). */
function stateCode(v: string | null): string | null {
  if (!v) return null;
  const t = v.trim();
  if (/^[A-Za-z]{2}$/.test(t)) return t.toUpperCase();
  return US_STATES[t.toLowerCase()] ?? t;
}

// ═══ Event envelope ══════════════════════════════════════════════════

/**
 * Accepts `{ id, type, data }` and the common variants: `eventId`/`event_id`,
 * `event`/`eventType`/`event_type`, `payload`/`record`, and a flat object where
 * the record's fields sit next to `type` (then `id` is the record's own id).
 */
export function normalizeInboundEvent(raw: unknown): InboundEvent {
  if (!isObj(raw)) throw new Error("An event must be a JSON object.");
  const type = str(raw.type) ?? str(raw.event) ?? str(raw.eventType) ?? str(raw.event_type) ?? "";
  const nested = [raw.data, raw.payload, raw.record].find(isObj);
  if (nested) {
    return { id: str(raw.id) ?? str(raw.eventId) ?? str(raw.event_id), type, data: nested };
  }
  const rest: Json = { ...raw };
  for (const k of ["type", "event", "eventType", "event_type", "eventId", "event_id", "source", "occurredAt"]) delete rest[k];
  return { id: str(raw.eventId) ?? str(raw.event_id), type, data: rest };
}

/** Pull the event list out of a webhook body: one event, an array, or `{ events: [...] }`. */
export function extractEvents(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (isObj(body) && Array.isArray(body.events)) return body.events;
  if (isObj(body)) return [body];
  return [];
}

const ENTITY_ALIAS: Record<string, string> = {
  user: "user", corporateuser: "user", staff: "user",
  job: "job", joborder: "job",
  candidate: "candidate",
  submission: "submission", jobsubmission: "submission", application: "submission",
  placement: "placement",
};

/** "JobOrder.updated", "job_order.created", "job.upserted" → "job.upserted". Null when ECRN has no handler. */
export function canonicalEventType(type: string): CanonicalType | null {
  const i = type.lastIndexOf(".");
  if (i <= 0) return null;
  const entity = ENTITY_ALIAS[type.slice(0, i).toLowerCase().replace(/[^a-z]/g, "")];
  const action = type.slice(i + 1).toLowerCase().replace(/[^a-z]/g, "");
  const change = ["upserted", "created", "updated", "inserted", "changed", "statuschanged"].includes(action);
  switch (entity) {
    case "user":
      return change ? "user.upserted" : null;
    case "job":
      if (action === "closed") return "job.closed";
      return change ? "job.upserted" : null;
    case "candidate":
      if (action === "linked" || action === "created" || action === "inserted") return "candidate.linked";
      return change ? "candidate.updated" : null;
    case "submission":
      return change ? "submission.updated" : null;
    case "placement":
      if (action === "created" || action === "inserted") return "placement.created";
      return change ? "placement.updated" : null;
    default:
      return null;
  }
}

// ═══ References and lookups ══════════════════════════════════════════

/** How an event points at a record: ECRN id, Bullhorn id, email. */
interface Ref {
  ecrnId: string | null;
  externalId: string | null;
  email: string | null;
}

/** Reads a reference from `{ id, ecrnId, externalID, email }` or from a bare id. */
function ref(v: unknown, extra: { ecrnId?: unknown; email?: unknown } = {}): Ref | null {
  let ecrnId = uuid(extra.ecrnId);
  let externalId: string | null = null;
  let email = str(extra.email);
  if (isObj(v)) {
    ecrnId = ecrnId ?? uuid(v.ecrnId) ?? uuid(v.ecrn_id) ?? uuid(v.externalID) ?? uuid(v.externalId);
    const id = str(v.id) ?? str(v.bullhornId) ?? str(v.bullhornUserId);
    if (id && UUID_RE.test(id)) ecrnId = ecrnId ?? id.toLowerCase();
    else externalId = id;
    email = email ?? str(v.email);
  } else {
    const id = str(v);
    if (id && UUID_RE.test(id)) ecrnId = ecrnId ?? id.toLowerCase();
    else externalId = id;
  }
  if (!ecrnId && !externalId && !email) return null;
  return { ecrnId, externalId, email: email ? email.toLowerCase() : null };
}

const STAFF_COLS = "id, first_name, last_name, email, phone, title, staff_role, manager_id, invite_code, external_crm_id, is_active, metadata";
const JOB_COLS =
  "id, title, status, is_public, is_company_public, company_name, location_city, location_state, job_type, trade, description, compensation_min, compensation_max, compensation_display, start_date, external_crm_id, account_manager_id, referral_payout_amount, metadata";
const CANDIDATE_COLS =
  "id, first_name, last_name, email, status, external_crm_id, account_manager_id, recruiter_id, routing_reason, primary_referrer_user_id";
const APPLICATION_COLS = "id, job_id, candidate_id, status, account_manager_id, recruiter_id, metadata";
const JOB_REFERRAL_COLS = "id, job_id, candidate_id, status, account_manager_id, recruiter_id, metadata";

async function findStaff(sb: SupabaseClient, r: Ref | null): Promise<Row | null> {
  if (!r) return null;
  if (r.ecrnId) {
    const rows = must(await sb.from("staff").select(STAFF_COLS).eq("id", r.ecrnId).limit(1), "staff lookup") as Row[] | null;
    if (rows?.[0]) return rows[0];
  }
  if (r.externalId) {
    const rows = must(await sb.from("staff").select(STAFF_COLS).eq("external_crm_id", r.externalId).limit(1), "staff lookup") as Row[] | null;
    if (rows?.[0]) return rows[0];
  }
  if (r.email) {
    const rows = must(
      await sb.from("staff").select(STAFF_COLS).ilike("email", likeExact(r.email)).order("created_at").limit(1),
      "staff lookup"
    ) as Row[] | null;
    if (rows?.[0]) return rows[0];
  }
  return null;
}

async function findJob(sb: SupabaseClient, r: Ref | null): Promise<Row | null> {
  if (!r) return null;
  if (r.ecrnId) {
    const rows = must(await sb.from("jobs").select(JOB_COLS).eq("id", r.ecrnId).limit(1), "job lookup") as Row[] | null;
    if (rows?.[0]) return rows[0];
  }
  if (r.externalId) {
    const rows = must(
      await sb.from("jobs").select(JOB_COLS).eq("external_crm_id", r.externalId).order("created_at").limit(1),
      "job lookup"
    ) as Row[] | null;
    if (rows?.[0]) return rows[0];
  }
  return null;
}

async function findCandidate(sb: SupabaseClient, r: Ref | null): Promise<Row | null> {
  if (!r) return null;
  if (r.ecrnId) {
    const rows = must(await sb.from("candidates").select(CANDIDATE_COLS).eq("id", r.ecrnId).limit(1), "candidate lookup") as Row[] | null;
    if (rows?.[0]) return rows[0];
  }
  if (r.externalId) {
    const rows = must(
      await sb.from("candidates").select(CANDIDATE_COLS).eq("external_crm_id", r.externalId).order("created_at").limit(1),
      "candidate lookup"
    ) as Row[] | null;
    if (rows?.[0]) return rows[0];
  }
  if (r.email) {
    const rows = must(
      await sb.from("candidates").select(CANDIDATE_COLS).ilike("email", likeExact(r.email)).order("created_at").limit(1),
      "candidate lookup"
    ) as Row[] | null;
    if (rows?.[0]) return rows[0];
  }
  return null;
}

// ═══ Handler context ═════════════════════════════════════════════════

interface Ctx {
  sb: SupabaseClient;
  simulated: boolean;
  /** The raw Bullhorn record to keep in `crm_records` (written even when the handler fails). */
  mirror: { entityType: string; externalId: string | null; data: Json; ecrnTable: string | null; ecrnId: string | null } | null;
  /** Rows this event changed that have outbox triggers (used to stop the echo). */
  touched: Set<string>;
  /** Things an admin should know that did not stop the event. */
  notes: string[];
}

function applied(type: string, summary: string, result: Json = {}): InboundOutcome {
  return { status: "applied", type, summary, result, error: null };
}
function ignored(type: string, summary: string, result: Json = {}): InboundOutcome {
  return { status: "ignored", type, summary, result, error: null };
}

async function logActivity(ctx: Ctx, entityType: string, entityId: string, action: string, metadata: Json = {}): Promise<void> {
  const { error } = await ctx.sb.from("activity_logs").insert({
    actor_user_id: null,
    entity_type: entityType,
    entity_id: entityId,
    action,
    metadata: { ...metadata, source: "bullhorn", ...(ctx.simulated ? { simulated: true } : {}) },
  });
  if (error) ctx.notes.push(`Activity log not written: ${error.message}`);
}

/** Owner and recruiter named on a Candidate or JobSubmission, resolved to ECRN staff ids. */
async function resolveRouting(
  ctx: Ctx,
  data: Json,
  recruiterFallback?: unknown
): Promise<{ accountManagerId: string | null; recruiterId: string | null }> {
  const ownerRef = ref(first(data.owner, data.ownerId, data.accountManager, data.accountManagerId));
  const recruiterRef = ref(first(data.assignedRecruiter, data.recruiter, data.recruiterId, recruiterFallback));
  const owner = await findStaff(ctx.sb, ownerRef);
  let recruiter = await findStaff(ctx.sb, recruiterRef);
  if (ownerRef && !owner) ctx.notes.push("The owner on this event is not in the ECRN team yet. Send user.upserted for them, then resend.");
  if (recruiterRef && !recruiter) ctx.notes.push("The recruiter on this event is not in the ECRN team yet. Send user.upserted for them, then resend.");

  let accountManagerId: string | null = owner?.id ?? null;
  // In Bullhorn a candidate's owner is often the recruiter. Then the recruiter's
  // manager is the account manager, the same rule ECRN's own routing uses.
  if (owner && owner.staff_role === "recruiter") {
    recruiter = recruiter ?? owner;
    accountManagerId = owner.manager_id ?? null;
  }
  if (!accountManagerId && recruiter?.manager_id) accountManagerId = recruiter.manager_id;
  return { accountManagerId, recruiterId: recruiter?.id ?? null };
}

/** Same side effects as the admin "change status" action: partners see it on their referral. */
async function setCandidateStatus(ctx: Ctx, candidate: Row, status: ReferralStatus, extra: Json = {}): Promise<void> {
  must(await ctx.sb.from("candidates").update({ status, ...extra }).eq("id", candidate.id), "candidate update");
  await ctx.sb.from("referrals").update({ status }).eq("candidate_id", candidate.id).eq("is_primary", true);
  const jr = await ctx.sb
    .from("job_referrals")
    .update({ status })
    .eq("candidate_id", candidate.id)
    .neq("status", "duplicate_review")
    .select("id");
  for (const r of (jr.data ?? []) as Row[]) ctx.touched.add(r.id);
  await logActivity(ctx, "candidate", candidate.id, "status_changed", { from: candidate.status ?? null, to: status });
}

const PAYOUT_STAGES = ["payout_pending", "payout_approved", "payout_paid"];

// ═══ user.upserted: CorporateUser → staff ════════════════════════════

const STAFF_ROLES: StaffRole[] = ["owner", "account_manager", "recruiter"];

function parseRole(v: unknown): StaffRole | null {
  const k = normKey(str(v)).replace(/ /g, "_") as StaffRole;
  return STAFF_ROLES.includes(k) ? k : null;
}

/**
 * Best guess from Bullhorn's title, user type and department. Only used when a
 * person is new to ECRN; an admin can correct it on the Team page and the
 * correction is kept. Confirm the wording against Delta's Bullhorn user types.
 */
function guessRole(...texts: (string | null)[]): StaffRole {
  const t = texts.filter(Boolean).join(" ").toLowerCase();
  if (/\b(owner|ceo|president|founder|principal|managing partner|chief)\b/.test(t)) return "owner";
  if (/account (manager|executive|director)|client (manager|partner|services)|business development|\bsales\b|\bdirector\b|\bvp\b|vice president|team lead/.test(t)) {
    return "account_manager";
  }
  return "recruiter";
}

function codePart(s: string | null): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase();
}

/** JORDAN, then JORDANA, JORDANAVERY, JAVERY, JORDAN2… First free one wins. 3 to 24 letters or digits. */
function inviteCodeCandidates(firstName: string, lastName: string): string[] {
  const f = codePart(firstName);
  const l = codePart(lastName);
  const out: string[] = [];
  const push = (c: string) => {
    const code = c.slice(0, 24);
    if (code.length >= 3 && !out.includes(code)) out.push(code);
  };
  push(f);
  if (l) push(f + l[0]);
  push(f + l);
  if (f && l) push(f[0] + l);
  const base = (f + l).length >= 3 ? (f.length >= 3 ? f : f + l) : "ECRN";
  for (let n = 2; n <= 30; n++) push(base.slice(0, 21) + n);
  return out;
}

async function handleUser(ctx: Ctx, data: Json): Promise<InboundOutcome> {
  const type = "user.upserted";
  const self = ref(data);
  ctx.mirror = { entityType: "CorporateUser", externalId: self?.externalId ?? null, data, ecrnTable: null, ecrnId: null };

  let firstName = str(data.firstName) ?? str(data.first_name);
  let lastName = str(data.lastName) ?? str(data.last_name);
  const fullName = str(data.name);
  if (!firstName && fullName) {
    const parts = fullName.split(/\s+/);
    firstName = parts[0];
    lastName = lastName ?? (parts.slice(1).join(" ") || null);
  }
  const email = str(data.email)?.toLowerCase() ?? null;
  const phone = str(data.mobile) ?? str(data.phone);
  const title = str(data.occupation) ?? str(data.title);
  const explicitRole = parseRole(first(data.role, data.staffRole, data.ecrnRole));
  const enabled = bool(first(data.enabled, data.isActive, data.active));
  const isActive = bool(data.isDeleted) === true ? false : enabled;
  const managerRef = ref(first(data.manager, data.reportToPerson, data.reportsTo, data.managerId));

  const existing = await findStaff(ctx.sb, self);
  const manager = managerRef ? await findStaff(ctx.sb, managerRef) : null;
  // The manager may arrive in a later event. Remember their Bullhorn id so the link is made then.
  const pendingManager = managerRef?.externalId && !manager ? managerRef.externalId : null;

  let staffId: string;
  let created = false;
  const changes: string[] = [];

  if (existing) {
    staffId = existing.id;
    const patch: Json = {};
    if (firstName && firstName !== existing.first_name) patch.first_name = firstName;
    if (lastName != null && lastName !== existing.last_name) patch.last_name = lastName;
    if (email && email !== (existing.email ?? "").toLowerCase()) patch.email = email;
    if (phone && phone !== existing.phone) patch.phone = phone;
    if (title && title !== existing.title) patch.title = title;
    if (self?.externalId && self.externalId !== existing.external_crm_id) patch.external_crm_id = self.externalId;
    if (explicitRole && explicitRole !== existing.staff_role) patch.staff_role = explicitRole;
    if (isActive != null && isActive !== existing.is_active) patch.is_active = isActive;
    if (manager && manager.id !== existing.id && manager.id !== existing.manager_id) patch.manager_id = manager.id;
    const meta: Json = isObj(existing.metadata) ? { ...existing.metadata } : {};
    const wantPending = manager ? null : pendingManager;
    if ((meta.bullhorn_manager_id ?? null) !== wantPending && (wantPending || manager)) {
      if (wantPending) meta.bullhorn_manager_id = wantPending;
      else delete meta.bullhorn_manager_id;
      patch.metadata = meta;
    }
    changes.push(...Object.keys(patch).filter((k) => k !== "metadata"));
    if (Object.keys(patch).length > 0) {
      must(await ctx.sb.from("staff").update(patch).eq("id", staffId), "staff update");
      if (patch.staff_role || patch.manager_id || patch.is_active !== undefined) {
        await logActivity(ctx, "staff", staffId, "updated", { changed: changes });
      }
    }
  } else {
    if (!firstName) throw new Error("The user has no name (firstName or name is required to add a team member).");
    const taken = new Set(
      ((must(await ctx.sb.from("staff").select("invite_code"), "invite codes") as Row[] | null) ?? []).map((r) => String(r.invite_code).toUpperCase())
    );
    const options = inviteCodeCandidates(firstName, lastName ?? "").filter((c) => !taken.has(c));
    const role = explicitRole ?? guessRole(title, str(data.userType?.name) ?? str(data.userType), str(data.primaryDepartment?.name));
    const base: Json = {
      first_name: firstName,
      last_name: lastName ?? "",
      email,
      phone,
      title,
      staff_role: role,
      manager_id: manager?.id ?? null,
      external_crm_id: self?.externalId ?? null,
      is_active: isActive ?? true,
      metadata: { source: "bullhorn", ...(pendingManager ? { bullhorn_manager_id: pendingManager } : {}) },
    };
    let inserted: Row | null = null;
    let lastError = "No free invite code could be made from the name.";
    // A code can be taken between the check and the insert; fall through to the next option.
    for (const code of [...options.slice(0, 4), `ECRN${Math.floor(1000 + Math.random() * 9000)}`]) {
      const res = await ctx.sb.from("staff").insert({ ...base, invite_code: code }).select("id, invite_code").limit(1);
      if (!res.error && res.data?.[0]) {
        inserted = res.data[0] as Row;
        break;
      }
      lastError = res.error?.message ?? lastError;
      if (res.error?.code !== "23505" || !/invite_code/i.test(res.error.message)) break;
    }
    if (!inserted) throw new Error(`Could not add the team member: ${lastError}`);
    staffId = inserted.id;
    created = true;
    await logActivity(ctx, "staff", staffId, "created", {
      name: `${firstName} ${lastName ?? ""}`.trim(),
      staff_role: role,
      invite_code: inserted.invite_code,
    });
  }

  ctx.mirror.ecrnTable = "staff";
  ctx.mirror.ecrnId = staffId;

  // People whose manager is this user, received before this user existed.
  let linkedReports = 0;
  if (self?.externalId) {
    const waiting = await ctx.sb
      .from("staff")
      .update({ manager_id: staffId })
      .eq("metadata->>bullhorn_manager_id", self.externalId)
      .is("manager_id", null)
      .neq("id", staffId)
      .select("id");
    linkedReports = waiting.data?.length ?? 0;
  }

  const name = `${firstName ?? existing?.first_name ?? ""} ${lastName ?? existing?.last_name ?? ""}`.trim();
  if (pendingManager) ctx.notes.push(`Manager ${pendingManager} is not in ECRN yet. The link is made when their user.upserted arrives.`);
  const summary = created
    ? `Added ${name} to the team.`
    : changes.length > 0
      ? `Updated ${name} (${changes.join(", ")}).`
      : `${name} is already up to date.`;
  return applied(type, summary, { table: "staff", id: staffId, created, changed: changes, linkedReports });
}

// ═══ job.upserted / job.closed: JobOrder → jobs ══════════════════════

function money(n: number): string {
  return n >= 1000 ? `${Math.round(n / 1000)}K` : String(Math.round(n));
}

/** Salary fields → ECRN's yearly min/max (dollars) and the short display text. */
function compensation(data: Json): { min: number | null; max: number | null; display: string | null } {
  const unit = normKey(str(data.salaryUnit));
  const low = num(first(data.salaryLow, data.salaryMin, data.compensationMin));
  const high = num(first(data.salaryHigh, data.salaryMax, data.compensationMax));
  const salary = num(data.salary);
  const payRate = num(data.payRate);
  const hourly = /hour|hr/.test(unit);
  if (hourly || (!salary && !low && !high && payRate && payRate > 0)) {
    const rate = hourly ? salary || payRate : payRate;
    return { min: null, max: null, display: rate && rate > 0 ? `$${Math.round(rate)}/hr` : null };
  }
  const min = low && low > 0 ? Math.round(low) : salary && salary > 0 ? Math.round(salary) : null;
  const max = high && high > 0 ? Math.round(high) : salary && salary > 0 ? Math.round(salary) : null;
  if (min == null && max == null) return { min: null, max: null, display: null };
  const a = min ?? max!;
  const b = max ?? min!;
  const display = a === b ? `$${money(a)}` : a >= 1000 && b >= 1000 ? `$${Math.round(a / 1000)}–${money(b)}` : `$${money(a)}–$${money(b)}`;
  return { min, max, display };
}

async function handleJob(ctx: Ctx, data: Json): Promise<InboundOutcome> {
  const type = "job.upserted";
  const self = ref(data);
  ctx.mirror = { entityType: "JobOrder", externalId: self?.externalId ?? null, data, ecrnTable: null, ecrnId: null };
  if (!self) throw new Error("The job has no id (Bullhorn JobOrder id or ecrnId).");

  const existing = await findJob(ctx.sb, self);
  const address: Json = isObj(data.address) ? data.address : {};
  const title = str(data.title);
  const city = str(address.city) ?? str(data.city);
  const state = stateCode(str(address.state) ?? str(data.state));
  const jobType = mapEmploymentType(str(data.employmentType) ?? str(data.jobType));
  const description = htmlToText(str(data.publicDescription) ?? str(data.description));
  const comp = compensation(data);
  const startDate = toDate(first(data.startDate, data.dateBegin));
  const categories = list(data.categories);
  const trade = mapTrade(
    str(data.trade) ?? str(data.publishedCategory?.name) ?? str(isObj(categories[0]) ? categories[0].name : categories[0])
  );
  const bullhornStatus = str(data.status);
  const status: JobStatus | null = bool(data.isDeleted) === true ? "archived" : mapJobStatus(bullhornStatus, bool(data.isOpen));
  const isPublic = bool(data.isPublic);
  const client = str(data.clientCorporation?.name) ?? str(data.clientCorporation) ?? str(data.companyName) ?? str(data.clientName);
  const companyPublic = bool(first(data.isCompanyPublic, data.companyPublic, data.clientPublic));
  const payoutDollars = num(first(data.referralPayout, data.referralPayoutAmount));

  const ownerRef = ref(first(data.owner, data.ownerId, data.accountManager));
  const owner = await findStaff(ctx.sb, ownerRef);
  if (ownerRef && !owner) ctx.notes.push("The job owner is not in the ECRN team yet, so the job has no account manager. Send user.upserted for them, then resend the job.");

  const bullhornMeta: Json = {
    status: bullhornStatus,
    isOpen: bool(data.isOpen),
    employmentType: str(data.employmentType),
    numOpenings: num(data.numOpenings),
    clientCorporationId: str(data.clientCorporation?.id),
    dateLastModified: first(data.dateLastModified) ?? null,
    compensation_display: comp.display,
  };

  let jobId: string;
  let created = false;
  const changes: string[] = [];

  if (existing) {
    jobId = existing.id;
    const patch: Json = {};
    const set = (col: string, value: unknown) => {
      if (value !== null && value !== undefined && value !== existing[col]) patch[col] = value;
    };
    set("title", title);
    set("location_city", city);
    set("location_state", state);
    set("job_type", jobType);
    set("description", description);
    set("compensation_min", comp.min);
    set("compensation_max", comp.max);
    set("trade", trade);
    set("start_date", startDate);
    set("status", status);
    set("is_public", isPublic);
    set("external_crm_id", self.externalId);
    set("account_manager_id", owner?.id ?? null);
    if (payoutDollars != null && payoutDollars > 0) {
      set("referral_payout_amount", Math.round(payoutDollars * 100));
      if (patch.referral_payout_amount) patch.referral_payout_display = `$${Math.round(payoutDollars).toLocaleString("en-US")}`;
    }
    // Only replace the pay text ECRN wrote itself; an admin's own wording stays.
    const previousAuto = isObj(existing.metadata?.bullhorn) ? existing.metadata.bullhorn.compensation_display : null;
    if (comp.display && (!existing.compensation_display || existing.compensation_display === previousAuto)) {
      set("compensation_display", comp.display);
    }
    if (client) {
      patch.company_name = client; // a DB trigger moves it to admin-only job_private unless the company is public
      if (companyPublic != null && companyPublic !== existing.is_company_public) patch.is_company_public = companyPublic;
    }
    changes.push(...Object.keys(patch).filter((k) => k !== "company_name"));
    patch.metadata = { ...(isObj(existing.metadata) ? existing.metadata : {}), bullhorn: bullhornMeta };
    must(await ctx.sb.from("jobs").update(patch).eq("id", jobId), "job update");
    if (patch.status) await logActivity(ctx, "job", jobId, "status_changed", { from: existing.status, to: patch.status });
    if (patch.account_manager_id) await logActivity(ctx, "job", jobId, "assigned", { account_manager_id: patch.account_manager_id });
  } else {
    if (!title) throw new Error("The job has no title, so it cannot be created.");
    const row: Json = {
      title,
      company_name: client,
      is_company_public: companyPublic ?? false,
      location_city: city,
      location_state: state,
      job_type: jobType,
      trade,
      description,
      compensation_min: comp.min,
      compensation_max: comp.max,
      compensation_display: comp.display,
      start_date: startDate,
      // Open only when Bullhorn says so. Unknown status waits as a draft for an admin.
      status: status ?? "draft",
      is_public: isPublic ?? true,
      external_crm_id: self.externalId,
      account_manager_id: owner?.id ?? null,
      metadata: { source: "bullhorn", bullhorn: bullhornMeta },
    };
    if (payoutDollars != null && payoutDollars > 0) {
      row.referral_payout_amount = Math.round(payoutDollars * 100);
      row.referral_payout_display = `$${Math.round(payoutDollars).toLocaleString("en-US")}`;
    }
    const inserted = must(await ctx.sb.from("jobs").insert(row).select("id").limit(1), "job insert") as Row[] | null;
    if (!inserted?.[0]) throw new Error("The job was not created.");
    jobId = inserted[0].id;
    created = true;
    await logActivity(ctx, "job", jobId, "created", { title, status: row.status, account_manager_id: row.account_manager_id });
    if (row.status === "draft") ctx.notes.push(`Bullhorn status "${bullhornStatus ?? "none"}" is not in the job status table, so the job was saved as a draft.`);
  }

  ctx.mirror.ecrnTable = "jobs";
  ctx.mirror.ecrnId = jobId;

  // assignedUsers → job_recruiters (the list replaces what was there).
  let recruiters: number | null = null;
  if (data.assignedUsers !== undefined) {
    const refs = list(data.assignedUsers).map((u) => ref(u)).filter((r): r is Ref => r !== null);
    const ids = new Set<string>();
    for (const r of refs) {
      const s = await findStaff(ctx.sb, r);
      if (s) ids.add(s.id);
    }
    const unmatched = refs.length - ids.size;
    if (unmatched > 0) ctx.notes.push(`${unmatched} assigned user(s) are not in the ECRN team yet and were skipped.`);
    // Do not wipe the list when nobody on it could be matched.
    if (ids.size > 0 || refs.length === 0) {
      must(await ctx.sb.from("job_recruiters").delete().eq("job_id", jobId), "job recruiters clear");
      if (ids.size > 0) {
        must(await ctx.sb.from("job_recruiters").insert([...ids].map((staff_id) => ({ job_id: jobId, staff_id }))), "job recruiters insert");
      }
      recruiters = ids.size;
    }
  }

  const label = title ?? existing?.title ?? "job";
  const summary = created
    ? `Created job "${label}" (${String((status ?? "draft")).replace("_", " ")}).`
    : changes.length > 0
      ? `Updated job "${label}" (${changes.join(", ")}).`
      : `Job "${label}" is already up to date.`;
  return applied(type, summary, { table: "jobs", id: jobId, created, changed: changes, account_manager_id: owner?.id ?? existing?.account_manager_id ?? null, recruiters });
}

async function handleJobClosed(ctx: Ctx, data: Json): Promise<InboundOutcome> {
  const type = "job.closed";
  const self = ref(data);
  ctx.mirror = { entityType: "JobOrder", externalId: self?.externalId ?? null, data, ecrnTable: null, ecrnId: null };
  const job = await findJob(ctx.sb, self);
  if (!job) return ignored(type, "No ECRN job matches this Bullhorn job, so there was nothing to close.");
  ctx.mirror.ecrnTable = "jobs";
  ctx.mirror.ecrnId = job.id;

  const reason = normKey(str(data.reason) ?? str(data.closedReason));
  const mapped = mapJobStatus(str(data.status), null);
  const status: JobStatus = mapped === "filled" || /fill|placed/.test(reason) ? "filled" : "archived";
  if (job.status === status) return applied(type, `Job "${job.title}" was already ${status}.`, { table: "jobs", id: job.id, status });

  must(await ctx.sb.from("jobs").update({ status }).eq("id", job.id), "job update");
  await logActivity(ctx, "job", job.id, "status_changed", { from: job.status, to: status });
  return applied(type, `Closed job "${job.title}" as ${status}.`, { table: "jobs", id: job.id, from: job.status, status });
}

// ═══ candidate.linked / candidate.updated ════════════════════════════

async function handleCandidate(ctx: Ctx, data: Json, type: "candidate.linked" | "candidate.updated"): Promise<InboundOutcome> {
  const self = ref(data, { ecrnId: first(data.candidateEcrnId, data.ecrnCandidateId) });
  ctx.mirror = { entityType: "Candidate", externalId: self?.externalId ?? null, data, ecrnTable: null, ecrnId: null };
  const candidate = await findCandidate(ctx.sb, self);
  if (!candidate) return ignored(type, "No ECRN person matches (looked for the ECRN id, then the Bullhorn id, then email).");
  ctx.mirror.ecrnTable = "candidates";
  ctx.mirror.ecrnId = candidate.id;
  ctx.touched.add(candidate.id);

  const patch: Json = {};
  const changes: string[] = [];
  const name = `${candidate.first_name} ${candidate.last_name}`.trim();

  if (self?.externalId && self.externalId !== candidate.external_crm_id) {
    patch.external_crm_id = self.externalId;
    changes.push("linked to Bullhorn");
  }

  const bullhornStatus = str(data.status);
  let target = mapCandidateStatus(bullhornStatus, str(data.ecrnStatus));
  // "Placed" must not pull someone back out of the payout stages ECRN manages.
  if (target === "placed" && PAYOUT_STAGES.includes(candidate.status)) target = null;
  if (target === candidate.status) target = null;
  if (bullhornStatus && !target && mapCandidateStatus(bullhornStatus, str(data.ecrnStatus)) === null) {
    ctx.notes.push(`Bullhorn status "${bullhornStatus}" has no ECRN equivalent, so the ECRN status was left as it is.`);
  }

  const route = await resolveRouting(ctx, data);
  if (route.accountManagerId && route.accountManagerId !== candidate.account_manager_id) patch.account_manager_id = route.accountManagerId;
  if (route.recruiterId && route.recruiterId !== candidate.recruiter_id) patch.recruiter_id = route.recruiterId;
  const reassigned = Boolean(patch.account_manager_id || patch.recruiter_id);
  if (reassigned) {
    patch.routing_reason = "bullhorn";
    patch.routed_at = new Date().toISOString();
    changes.push("owner");
  }

  if (target) {
    await setCandidateStatus(ctx, candidate, target, patch);
    changes.push(`status ${candidate.status} → ${target}`);
  } else if (Object.keys(patch).length > 0) {
    must(await ctx.sb.from("candidates").update(patch).eq("id", candidate.id), "candidate update");
  }
  if (patch.external_crm_id) await logActivity(ctx, "candidate", candidate.id, "crm_linked", { external_crm_id: patch.external_crm_id });
  if (reassigned) {
    await logActivity(ctx, "candidate", candidate.id, "assigned", {
      account_manager_id: patch.account_manager_id ?? candidate.account_manager_id ?? null,
      recruiter_id: patch.recruiter_id ?? candidate.recruiter_id ?? null,
    });
  }

  const summary = changes.length > 0 ? `${name}: ${changes.join(", ")}.` : `${name} is already up to date.`;
  return applied(type, summary, {
    table: "candidates",
    id: candidate.id,
    changed: changes,
    status: target ?? candidate.status,
    account_manager_id: patch.account_manager_id ?? candidate.account_manager_id ?? null,
    recruiter_id: patch.recruiter_id ?? candidate.recruiter_id ?? null,
  });
}

// ═══ submission.updated: JobSubmission → job_applications ════════════

async function latestFor(sb: SupabaseClient, table: "job_applications" | "job_referrals", candidateId: string, jobId: string): Promise<Row | null> {
  const cols = table === "job_applications" ? APPLICATION_COLS : JOB_REFERRAL_COLS;
  const rows = must(
    await sb.from(table).select(cols).eq("candidate_id", candidateId).eq("job_id", jobId).order("created_at", { ascending: false }).limit(1),
    `${table} lookup`
  ) as Row[] | null;
  return rows?.[0] ?? null;
}

async function byId(sb: SupabaseClient, table: "job_applications" | "job_referrals", id: string): Promise<Row | null> {
  const cols = table === "job_applications" ? APPLICATION_COLS : JOB_REFERRAL_COLS;
  const rows = must(await sb.from(table).select(cols).eq("id", id).limit(1), `${table} lookup`) as Row[] | null;
  return rows?.[0] ?? null;
}

async function bySubmissionId(sb: SupabaseClient, table: "job_applications" | "job_referrals", submissionId: string): Promise<Row | null> {
  const cols = table === "job_applications" ? APPLICATION_COLS : JOB_REFERRAL_COLS;
  const rows = must(
    await sb.from(table).select(cols).eq("metadata->>bullhorn_submission_id", submissionId).order("created_at", { ascending: false }).limit(1),
    `${table} lookup`
  ) as Row[] | null;
  return rows?.[0] ?? null;
}

async function handleSubmission(ctx: Ctx, data: Json): Promise<InboundOutcome> {
  const type = "submission.updated";
  const rawId = str(data.id);
  const submissionId = rawId && !UUID_RE.test(rawId) ? rawId : str(data.bullhornId);
  const ecrnId =
    uuid(data.ecrnId) ?? uuid(data.ecrnApplicationId) ?? uuid(data.applicationEcrnId) ?? uuid(data.externalID) ?? (rawId && UUID_RE.test(rawId) ? rawId.toLowerCase() : null);
  ctx.mirror = { entityType: "JobSubmission", externalId: submissionId, data, ecrnTable: null, ecrnId: null };

  let application: Row | null = null;
  let jobReferral: Row | null = null;
  if (ecrnId) {
    application = await byId(ctx.sb, "job_applications", ecrnId);
    if (!application) jobReferral = await byId(ctx.sb, "job_referrals", ecrnId);
  }
  if (!application && !jobReferral && submissionId) {
    application = await bySubmissionId(ctx.sb, "job_applications", submissionId);
    if (!application) jobReferral = await bySubmissionId(ctx.sb, "job_referrals", submissionId);
  }
  if (!application && !jobReferral) {
    const candidate = await findCandidate(ctx.sb, ref(first(data.candidate, data.candidateId), { ecrnId: data.candidateEcrnId, email: data.candidateEmail }));
    const job = await findJob(ctx.sb, ref(first(data.jobOrder, data.jobOrderId, data.job), { ecrnId: data.jobEcrnId }));
    if (candidate && job) {
      application = await latestFor(ctx.sb, "job_applications", candidate.id, job.id);
      if (!application) jobReferral = await latestFor(ctx.sb, "job_referrals", candidate.id, job.id);
    }
  }
  if (!application && !jobReferral) {
    return ignored(type, "No ECRN application or job referral matches (looked for the ECRN id, the Bullhorn submission id, then candidate + job).");
  }

  const bullhornStatus = str(data.status);
  const mapped = mapSubmissionStatus(bullhornStatus, str(data.ecrnStatus));
  if (bullhornStatus && !mapped) ctx.notes.push(`Bullhorn status "${bullhornStatus}" has no ECRN equivalent, so the status was left as it is.`);
  const route = await resolveRouting(ctx, data, data.sendingUser);

  const record = (application ?? jobReferral) as Row;
  const table = application ? "job_applications" : "job_referrals";
  const patch: Json = {};
  const changes: string[] = [];
  ctx.mirror.ecrnTable = table;
  ctx.mirror.ecrnId = record.id;
  ctx.touched.add(record.id);

  if (submissionId && record.metadata?.bullhorn_submission_id !== submissionId) {
    patch.metadata = { ...(isObj(record.metadata) ? record.metadata : {}), bullhorn_submission_id: submissionId };
    changes.push("linked to Bullhorn");
  }
  if (route.accountManagerId && route.accountManagerId !== record.account_manager_id) patch.account_manager_id = route.accountManagerId;
  if (route.recruiterId && route.recruiterId !== record.recruiter_id) patch.recruiter_id = route.recruiterId;
  if (patch.account_manager_id || patch.recruiter_id) changes.push("owner");

  let from: string | null = null;
  let to: string | null = null;
  if (application && mapped) {
    // A late "new lead" from Bullhorn must not move an application back to the start.
    const target: ApplicationStatus | null = mapped === "submitted" && application.status !== "submitted" ? null : mapped;
    if (target && target !== application.status) {
      patch.status = target;
      from = application.status;
      to = target;
    }
  } else if (jobReferral && mapped && jobReferral.status !== "duplicate_review") {
    const target = APPLICATION_TO_REFERRAL_STATUS[mapped];
    if (target !== jobReferral.status) {
      patch.status = target;
      from = jobReferral.status;
      to = target;
    }
  }
  if (to) changes.push(`status ${from} → ${to}`);

  if (Object.keys(patch).length > 0) {
    must(await ctx.sb.from(table).update(patch).eq("id", record.id), `${table} update`);
    const entity = application ? "job_application" : "job_referral";
    if (to) await logActivity(ctx, entity, record.id, "status_changed", { from, to });
    if (patch.account_manager_id || patch.recruiter_id) {
      await logActivity(ctx, entity, record.id, "assigned", {
        account_manager_id: patch.account_manager_id ?? record.account_manager_id ?? null,
        recruiter_id: patch.recruiter_id ?? record.recruiter_id ?? null,
      });
    }
  }

  const what = application ? "Application" : "Job referral";
  const summary = changes.length > 0 ? `${what}: ${changes.join(", ")}.` : `${what} is already up to date.`;
  return applied(type, summary, { table, id: record.id, changed: changes, status: to ?? record.status });
}

// ═══ placement.created / placement.updated ═══════════════════════════

async function handlePlacement(ctx: Ctx, data: Json, type: "placement.created" | "placement.updated"): Promise<InboundOutcome> {
  const placementId = str(data.id);
  const candidateRef = ref(first(data.candidate, data.candidateId), { ecrnId: data.candidateEcrnId, email: data.candidateEmail });
  const jobRef = ref(first(data.jobOrder, data.jobOrderId, data.job), { ecrnId: data.jobEcrnId });
  const salary = num(data.salary);
  const startDate = toDate(first(data.dateBegin, data.startDate));
  const bullhornStatus = str(data.status);
  const cancelled = /cancel|terminat|fell through|fall off|no start|declin|reject|void/i.test(bullhornStatus ?? "");

  ctx.mirror = { entityType: "Placement", externalId: placementId, data, ecrnTable: null, ecrnId: null };
  const candidate = await findCandidate(ctx.sb, candidateRef);
  const job = await findJob(ctx.sb, jobRef);
  // Normalised copy next to the raw record, so reports do not need to know Bullhorn's field names.
  ctx.mirror.data = {
    ...data,
    _ecrn: {
      candidate_id: candidate?.id ?? null,
      job_id: job?.id ?? null,
      salary: salary && salary > 0 ? salary : null,
      start_date: startDate,
      pay_rate: num(data.payRate),
      fee: num(data.fee),
      employment_type: str(data.employmentType),
      cancelled,
    },
  };
  if (!candidate) return ignored(type, "No ECRN person matches this placement (looked for the ECRN id, then the Bullhorn id, then email).");
  ctx.mirror.ecrnTable = "candidates";
  ctx.mirror.ecrnId = candidate.id;
  ctx.touched.add(candidate.id);
  const name = `${candidate.first_name} ${candidate.last_name}`.trim();

  if (cancelled) {
    await logActivity(ctx, "candidate", candidate.id, "placement_cancelled", { placement_id: placementId, job_id: job?.id ?? null, bullhorn_status: bullhornStatus });
    ctx.notes.push("ECRN never reverses a placement or a payout on its own. Review this person and their payout by hand.");
    return applied(type, `Bullhorn marks ${name}'s placement as "${bullhornStatus}". Nothing was changed in ECRN. Review it by hand.`, {
      table: "candidates",
      id: candidate.id,
      needsReview: true,
    });
  }

  const changes: string[] = [];
  const alreadyPlaced = candidate.status === "placed" || PAYOUT_STAGES.includes(candidate.status);
  const extra: Json = {};
  if (candidateRef?.externalId && !candidate.external_crm_id) extra.external_crm_id = candidateRef.externalId;
  if (!alreadyPlaced) {
    // The candidates_on_placed trigger opens a pending payout for the referrer.
    await setCandidateStatus(ctx, candidate, "placed", extra);
    changes.push(`status ${candidate.status} → placed`);
  } else if (Object.keys(extra).length > 0) {
    must(await ctx.sb.from("candidates").update(extra).eq("id", candidate.id), "candidate update");
  }

  if (job) {
    const application = await latestFor(ctx.sb, "job_applications", candidate.id, job.id);
    if (application && application.status !== "hired") {
      must(await ctx.sb.from("job_applications").update({ status: "hired" }).eq("id", application.id), "application update");
      ctx.touched.add(application.id);
      await logActivity(ctx, "job_application", application.id, "status_changed", { from: application.status, to: "hired" });
      changes.push("application → hired");
    }
  }

  await logActivity(ctx, "candidate", candidate.id, "placement_recorded", {
    placement_id: placementId,
    job_id: job?.id ?? null,
    salary: salary && salary > 0 ? salary : null,
    start_date: startDate,
  });

  const payouts = (await ctx.sb.from("payouts").select("id, amount_cents, status").eq("candidate_id", candidate.id).order("created_at", { ascending: false }).limit(1)).data as Row[] | null;
  const payout = payouts?.[0] ?? null;
  if (!candidate.primary_referrer_user_id) ctx.notes.push("Nobody referred this person, so there is no payout.");
  else if (payout && payout.amount_cents === 0) ctx.notes.push("The payout was opened at $0. Set the amount on the Payouts page.");

  const summary = changes.length > 0 ? `${name} placed${job ? ` on "${job.title}"` : ""}: ${changes.join(", ")}.` : `${name} was already placed. Placement details saved.`;
  return applied(type, summary, {
    table: "candidates",
    id: candidate.id,
    changed: changes,
    job_id: job?.id ?? null,
    start_date: startDate,
    salary: salary && salary > 0 ? salary : null,
    payout,
  });
}

// ═══ Raw mirror and echo guard ═══════════════════════════════════════

/** Keep the Bullhorn record. Partial events are merged into what is already stored. */
async function writeMirror(ctx: Ctx, provider: string): Promise<boolean> {
  const m = ctx.mirror;
  if (!m || !m.externalId) return false;
  const prior = await ctx.sb
    .from("crm_records")
    .select("data")
    .eq("provider", provider)
    .eq("entity_type", m.entityType)
    .eq("external_id", m.externalId)
    .limit(1);
  const priorData = (prior.data as Row[] | null)?.[0]?.data;
  const row: Json = {
    provider,
    entity_type: m.entityType,
    external_id: m.externalId,
    data: { ...(isObj(priorData) ? priorData : {}), ...m.data },
    synced_at: new Date().toISOString(),
  };
  // Leave an existing link alone when this event could not be matched.
  if (m.ecrnTable && m.ecrnId) {
    row.ecrn_table = m.ecrnTable;
    row.ecrn_id = m.ecrnId;
  }
  must(await ctx.sb.from("crm_records").upsert(row, { onConflict: "provider,entity_type,external_id" }), "mirror");
  return true;
}

/**
 * ECRN's triggers queue an outbound event whenever a candidate, application or
 * job referral changes. When the change itself came from Bullhorn, sending it
 * straight back would loop, so those fresh rows are marked `skipped`.
 */
async function outboxMarker(sb: SupabaseClient): Promise<string> {
  const { data } = await sb.from("integration_outbox").select("created_at").order("created_at", { ascending: false }).limit(1);
  return ((data as Row[] | null)?.[0]?.created_at as string | undefined) ?? "1970-01-01T00:00:00Z";
}
async function suppressEcho(sb: SupabaseClient, ids: string[], marker: string): Promise<number> {
  if (ids.length === 0) return 0;
  const { data } = await sb
    .from("integration_outbox")
    .update({ status: "skipped", last_error: ECHO_NOTE })
    .eq("status", "queued")
    .in("entity_id", ids)
    .gt("created_at", marker)
    .select("id");
  return data?.length ?? 0;
}

const ECHO_TYPES: CanonicalType[] = ["candidate.linked", "candidate.updated", "submission.updated", "placement.created", "placement.updated"];

// ═══ Public entry points ═════════════════════════════════════════════

/**
 * Apply one inbound event. Never throws: the outcome says what happened.
 *   applied  ECRN was updated (or already matched)
 *   ignored  nothing to do (unknown type, or no ECRN record matches)
 *   failed   something went wrong; `error` has the reason and the event can be run again
 */
export async function applyInboundEvent(sb: SupabaseClient, event: unknown, opts: ApplyOptions = {}): Promise<InboundOutcome> {
  let type = "unknown";
  try {
    const ev = normalizeInboundEvent(event);
    type = ev.type || "unknown";
    const canonical = canonicalEventType(ev.type);
    if (!canonical) return ignored(type, `ECRN has no handler for "${type}", so it was stored and ignored.`);

    const provider = opts.mirrorProvider ?? "bullhorn";
    const ctx: Ctx = { sb, simulated: Boolean(opts.simulated), mirror: null, touched: new Set(), notes: [] };
    const marker = ECHO_TYPES.includes(canonical) ? await outboxMarker(sb) : null;

    let outcome: InboundOutcome;
    try {
      switch (canonical) {
        case "user.upserted":
          outcome = await handleUser(ctx, ev.data);
          break;
        case "job.upserted":
          outcome = await handleJob(ctx, ev.data);
          break;
        case "job.closed":
          outcome = await handleJobClosed(ctx, ev.data);
          break;
        case "candidate.linked":
        case "candidate.updated":
          outcome = await handleCandidate(ctx, ev.data, canonical);
          break;
        case "submission.updated":
          outcome = await handleSubmission(ctx, ev.data);
          break;
        case "placement.created":
        case "placement.updated":
          outcome = await handlePlacement(ctx, ev.data, canonical);
          break;
      }
    } catch (e) {
      outcome = { status: "failed", type: canonical, summary: "The event could not be applied.", result: {}, error: errText(e) };
    }

    // Best effort from here on: neither step may turn an applied event into a failure.
    let mirrored = false;
    try {
      mirrored = await writeMirror(ctx, provider);
    } catch (e) {
      ctx.notes.push(`Raw record not saved to the mirror: ${errText(e)}`);
    }
    let echoesStopped = 0;
    if (marker && ctx.touched.size > 0) {
      try {
        echoesStopped = await suppressEcho(sb, [...ctx.touched], marker);
      } catch {
        /* the event itself is already applied */
      }
    }

    outcome.type = type;
    outcome.result = { ...(outcome.result ?? {}), handler: canonical, mirrored, echoesStopped, ...(ctx.notes.length ? { notes: ctx.notes } : {}) };
    return outcome;
  } catch (e) {
    return { status: "failed", type, summary: "The event could not be read.", result: null, error: errText(e) };
  }
}

export interface ReceivedEvent {
  index: number;
  id: string | null;
  type: string;
  /** duplicate = this event id was already received; error = it could not even be stored. */
  status: InboundStatus | "duplicate" | "error";
  summary: string;
  inboxId: string | null;
  result: Json | null;
  error: string | null;
}

export interface ReceiveOptions extends ApplyOptions {
  /** Give events without an id one of their own (the simulator does this). */
  generateId?: () => string;
}

/** An inbox row still "received" after this long was cut off mid-way and is run again on a repeat. */
const STUCK_AFTER_MS = 2 * 60 * 1000;

/**
 * The full inbound pipeline for a batch: record each event in
 * `integration_inbox` (repeats of the same `external_id` are ignored), apply
 * it, then mark the row applied / ignored / failed with the result or error.
 */
export async function receiveInboundEvents(
  sb: SupabaseClient,
  provider: string,
  rawEvents: unknown[],
  opts: ReceiveOptions = {}
): Promise<ReceivedEvent[]> {
  const out: ReceivedEvent[] = [];
  for (let index = 0; index < rawEvents.length; index++) {
    const raw = rawEvents[index];
    let id: string | null = null;
    let type = "unknown";
    let inboxId: string | null = null;
    try {
      const ev = normalizeInboundEvent(raw);
      id = ev.id ?? opts.generateId?.() ?? null;
      type = ev.type || "unknown";

      if (id) {
        const seen = await sb.from("integration_inbox").select("id, status, received_at").eq("provider", provider).eq("external_id", id).limit(1);
        if (seen.error) throw new Error(`inbox lookup: ${seen.error.message}`);
        const prior = (seen.data as Row[] | null)?.[0];
        if (prior) {
          const stuck = prior.status === "received" && Date.now() - new Date(prior.received_at).getTime() > STUCK_AFTER_MS;
          if (!stuck) {
            out.push({ index, id, type, status: "duplicate", summary: "Already received. Ignored.", inboxId: prior.id, result: null, error: null });
            continue;
          }
          inboxId = prior.id;
        }
      }

      if (!inboxId) {
        const ins = await sb
          .from("integration_inbox")
          .insert({ provider, event_type: type, external_id: id, payload: isObj(raw) ? raw : { value: raw }, status: "received" })
          .select("id")
          .limit(1);
        if (ins.error) {
          // Two deliveries of the same event at the same moment: the other one has it.
          if (ins.error.code === "23505") {
            out.push({ index, id, type, status: "duplicate", summary: "Already received. Ignored.", inboxId: null, result: null, error: null });
            continue;
          }
          throw new Error(`inbox insert: ${ins.error.message}`);
        }
        inboxId = (ins.data as Row[] | null)?.[0]?.id ?? null;
      }

      const outcome = await applyInboundEvent(sb, { id, type: ev.type, data: ev.data }, opts);
      if (inboxId) {
        await sb
          .from("integration_inbox")
          .update({
            status: outcome.status,
            result: { summary: outcome.summary, ...(outcome.result ?? {}) },
            error: outcome.error,
            processed_at: new Date().toISOString(),
          })
          .eq("id", inboxId);
      }
      out.push({ index, id, type, status: outcome.status, summary: outcome.summary, inboxId, result: outcome.result, error: outcome.error });
    } catch (e) {
      out.push({ index, id, type, status: "error", summary: "The event could not be stored.", inboxId, result: null, error: errText(e) });
    }
  }
  return out;
}
