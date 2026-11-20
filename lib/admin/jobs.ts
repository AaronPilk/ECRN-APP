import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { one, toJob } from "@/lib/data/mappers";
import type { Job } from "@/types";

/**
 * Job ownership for the admin side.
 *
 * The account manager on `jobs.account_manager_id` receives every application
 * and referral for that job (database triggers route on it); `job_recruiters`
 * lists the recruiters working it. The real client name and internal notes
 * live in the admin-only `job_private` table.
 *
 * Admin-only: Row Level Security rejects these reads and writes for anyone else.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: unknown): v is string => typeof v === "string" && UUID_RE.test(v);

function fail(context: string, error: { message: string } | null): never {
  throw new Error(`${context}: ${error?.message ?? "unknown error"}`);
}

export interface JobOwnership {
  /** Staff id of the account manager who owns the job. */
  accountManagerId: string | null;
  /** Staff ids of the recruiters working the job. */
  recruiterIds: string[];
}

export interface JobOwnershipChange {
  previous: JobOwnership;
  ownerChanged: boolean;
  recruitersChanged: boolean;
}

/** Admin-only values that never appear on the public job row. */
export interface JobPrivateInfo {
  clientCompany: string | null;
  internalNotes: string | null;
}

export interface AdminJobRow {
  job: Job;
  /** The real client name, even when the job is confidential. */
  clientCompany: string | null;
  internalNotes: string | null;
  ownerId: string | null;
  ownerName: string | null;
  ownerIsActive: boolean;
  recruiterCount: number;
  applicationCount: number;
  jobReferralCount: number;
}

// ── Ownership ────────────────────────────────────────────────────────

export async function getJobOwnership(jobId: string): Promise<JobOwnership> {
  if (!isUuid(jobId)) return { accountManagerId: null, recruiterIds: [] };
  const sb = await createSupabaseServerClient();
  const [job, recruiters] = await Promise.all([
    sb.from("jobs").select("account_manager_id").eq("id", jobId).maybeSingle(),
    sb.from("job_recruiters").select("staff_id").eq("job_id", jobId),
  ]);
  if (job.error) fail("getJobOwnership", job.error);
  if (recruiters.error) fail("getJobOwnership", recruiters.error);
  return {
    accountManagerId: (job.data?.account_manager_id as string | null | undefined) ?? null,
    recruiterIds: ((recruiters.data ?? []) as Row[]).map((r) => String(r.staff_id)),
  };
}

/**
 * Set who owns a job and which recruiters work it. `recruiterIds` replaces the
 * current list. Only what actually changed is written, so open applications
 * and referrals follow a new owner (database trigger) without extra churn.
 */
export async function setJobOwnership(
  jobId: string,
  accountManagerId: string | null,
  recruiterIds: string[]
): Promise<JobOwnershipChange> {
  if (!isUuid(jobId)) throw new Error("setJobOwnership: invalid job id");
  if (accountManagerId != null && accountManagerId !== "" && !isUuid(accountManagerId)) {
    throw new Error("setJobOwnership: invalid account manager id");
  }
  const nextOwner = accountManagerId || null;
  const nextRecruiters = [...new Set(recruiterIds.filter(isUuid))];

  const previous = await getJobOwnership(jobId);
  const sb = await createSupabaseServerClient();

  const ownerChanged = previous.accountManagerId !== nextOwner;
  if (ownerChanged) {
    const { error } = await sb.from("jobs").update({ account_manager_id: nextOwner }).eq("id", jobId);
    if (error) fail("setJobOwnership (owner)", error);
  }

  const toRemove = previous.recruiterIds.filter((id) => !nextRecruiters.includes(id));
  const toAdd = nextRecruiters.filter((id) => !previous.recruiterIds.includes(id));
  if (toRemove.length > 0) {
    const { error } = await sb.from("job_recruiters").delete().eq("job_id", jobId).in("staff_id", toRemove);
    if (error) fail("setJobOwnership (remove recruiters)", error);
  }
  if (toAdd.length > 0) {
    const { error } = await sb
      .from("job_recruiters")
      .upsert(
        toAdd.map((staffId) => ({ job_id: jobId, staff_id: staffId })),
        { onConflict: "job_id,staff_id", ignoreDuplicates: true }
      );
    if (error) fail("setJobOwnership (add recruiters)", error);
  }

  return { previous, ownerChanged, recruitersChanged: toRemove.length + toAdd.length > 0 };
}

/** Link a job to its Bullhorn JobOrder (or clear the link with null). */
export async function setJobExternalCrmId(jobId: string, externalCrmId: string | null): Promise<void> {
  if (!isUuid(jobId)) throw new Error("setJobExternalCrmId: invalid job id");
  const value = externalCrmId?.trim() || null;
  const sb = await createSupabaseServerClient();
  const { error } = await sb.from("jobs").update({ external_crm_id: value }).eq("id", jobId);
  if (error) fail("setJobExternalCrmId", error);
}

// ── Private client details ───────────────────────────────────────────

/** The real client name and internal notes (null for confidential jobs on `jobs` by design). */
export async function getJobPrivate(jobId: string): Promise<JobPrivateInfo> {
  if (!isUuid(jobId)) return { clientCompany: null, internalNotes: null };
  const sb = await createSupabaseServerClient();
  const { data, error } = await sb
    .from("job_private")
    .select("client_company, internal_notes")
    .eq("job_id", jobId)
    .maybeSingle();
  if (error) fail("getJobPrivate", error);
  return {
    clientCompany: (data?.client_company as string | null | undefined) ?? null,
    internalNotes: (data?.internal_notes as string | null | undefined) ?? null,
  };
}

/**
 * Store exactly what the admin typed, including a cleared field. (The database
 * trigger on `jobs` only ever adds to `job_private`; it never clears a value.)
 */
export async function setJobPrivate(jobId: string, info: JobPrivateInfo): Promise<void> {
  if (!isUuid(jobId)) throw new Error("setJobPrivate: invalid job id");
  const sb = await createSupabaseServerClient();
  const { error } = await sb.from("job_private").upsert(
    {
      job_id: jobId,
      client_company: info.clientCompany?.trim() || null,
      internal_notes: info.internalNotes?.trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "job_id" }
  );
  if (error) fail("setJobPrivate", error);
}

// ── Admin job list ───────────────────────────────────────────────────

const ADMIN_JOB_SELECT = [
  "*",
  "private:job_private(client_company, internal_notes)",
  "owner:staff!jobs_account_manager_id_fkey(id, first_name, last_name, is_active)",
  "recruiters:job_recruiters(count)",
  "applications:job_applications(count)",
  "referrals:job_referrals(count)",
].join(", ");

const PAGE_SIZE = 1000;

/** `relation(count)` embeds come back as `[{ count: n }]`. */
function embeddedCount(v: unknown): number {
  const first = Array.isArray(v) ? v[0] : v;
  const n = first && typeof first === "object" ? Number((first as { count?: unknown }).count) : 0;
  return Number.isFinite(n) ? n : 0;
}

function toAdminJobRow(r: Row): AdminJobRow {
  const priv = one(r.private, (p) => p);
  const owner = one(r.owner, (o) => o);
  return {
    job: toJob(r),
    clientCompany: priv?.client_company ?? r.company_name ?? null,
    internalNotes: priv?.internal_notes ?? null,
    ownerId: r.account_manager_id ?? null,
    ownerName: owner ? `${owner.first_name ?? ""} ${owner.last_name ?? ""}`.trim() || null : null,
    ownerIsActive: owner ? owner.is_active !== false : false,
    recruiterCount: embeddedCount(r.recruiters),
    applicationCount: embeddedCount(r.applications),
    jobReferralCount: embeddedCount(r.referrals),
  };
}

/**
 * Every job, newest first, with its owner, the real client name, and how much
 * has come in (counts are computed in the database, one row per job).
 */
export async function listJobsAdmin(): Promise<AdminJobRow[]> {
  const sb = await createSupabaseServerClient();
  const rows: Row[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await sb
      .from("jobs")
      .select(ADMIN_JOB_SELECT)
      .order("created_at", { ascending: false })
      .order("id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) fail("listJobsAdmin", error);
    const page = (data ?? []) as unknown as Row[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return rows.map(toAdminJobRow);
}
