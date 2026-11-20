import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { signPayload } from "./signature";

/**
 * ECRN → Staffing Referrals → Bullhorn (→ Sense for texts and emails).
 *
 * Database triggers write every sign-up, referral, application, status change,
 * assignment and hiring request to `integration_outbox`, so nothing is lost
 * while the connection does not exist yet. This module turns each queued row
 * into a Bullhorn-shaped payload and POSTs it to the Staffing Referrals
 * webhook once these are set:
 *
 *   STAFFING_REFERRALS_WEBHOOK_URL   where to send events
 *   STAFFING_REFERRALS_SECRET        shared secret; ECRN sends an HMAC-SHA256
 *                                    signature of the body in `X-ECRN-Signature`
 *
 * Field names follow Bullhorn's REST entities (Candidate, JobSubmission, Lead)
 * so the receiving side can map them 1:1. When Staffing Referrals shares its
 * exact spec, `toBullhorn` is the only function that needs to change.
 * Full reference: docs/BULLHORN_INTEGRATION.md.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type Json = Record<string, any>;

export type OutboxStatus = "queued" | "sent" | "failed" | "skipped";

export interface OutboxRow {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string | null;
  payload: Json;
  status: OutboxStatus;
  attempts: number;
  last_error: string | null;
  created_at: string;
  sent_at: string | null;
}

/** A failed row is retried automatically until it has been tried this many times. */
export const MAX_DELIVERY_ATTEMPTS = 5;

/**
 * Rows delivered per run. Each row costs three outgoing requests (claim, send,
 * record), and Cloudflare Workers caps requests per invocation (50 on the free
 * plan), so the default stays small. The scheduler simply runs again.
 */
export const DEFAULT_DISPATCH_LIMIT = 15;

export function isStaffingReferralsConfigured(): boolean {
  return Boolean(process.env.STAFFING_REFERRALS_WEBHOOK_URL);
}

/** True when outbound events will carry a signature. */
export function isOutboundSigned(): boolean {
  return Boolean(process.env.STAFFING_REFERRALS_SECRET);
}

const CAREER: Record<string, string> = {
  actively_looking: "Active",
  open_to_offers: "Passive",
  not_looking: "Not Looking",
};

/** Bullhorn ids are integers; ECRN stores them as text. */
function bullhornId(v: unknown): number | string | null {
  if (v == null || v === "") return null;
  const s = String(v).trim();
  return /^\d{1,15}$/.test(s) ? Number(s) : s;
}

/**
 * The account manager or recruiter attached to an event. The triggers put
 * `{ ecrnId, name, email, role, bullhornUserId }` in the payload; Bullhorn gets
 * `{ id, name, email, ecrnId }` where `id` is the CorporateUser id (null until
 * the team has been linked to Bullhorn).
 */
function staffToBullhorn(ref: Json | null | undefined): Json | null {
  if (!ref || typeof ref !== "object" || !ref.ecrnId) return null;
  return {
    id: bullhornId(ref.bullhornUserId),
    name: ref.name ?? null,
    email: ref.email ?? null,
    ecrnId: ref.ecrnId,
  };
}

function routing(p: Json): { owner: Json | null; assignedRecruiter: Json | null } {
  return { owner: staffToBullhorn(p.owner), assignedRecruiter: staffToBullhorn(p.recruiter) };
}

function candidateToBullhorn(c: Json, referrer?: Json | null, yearsBand?: string | null): Json {
  return {
    entity: "Candidate",
    id: bullhornId(c.external_crm_id),
    externalID: c.id ?? null,
    ecrnId: c.id ?? null,
    firstName: c.first_name,
    lastName: c.last_name,
    email: c.email,
    mobile: c.phone,
    occupation: c.current_job_title,
    companyName: c.current_company,
    address: { city: c.location_city, state: c.location_state, countryID: 1 },
    status: c.status,
    source: c.source_type === "referred" ? "ECRN Referral" : c.source_type === "self_signup" ? "ECRN App" : "ECRN",
    willRelocate: c.relocation === "yes" ? true : c.relocation === "no" ? false : null,
    customText: {
      careerStatus: CAREER[c.career_status] ?? null,
      confidential: Boolean(c.is_confidential),
      moveMotivators: (c.move_motivators ?? []).join(", ") || null,
      yearsExperience: c.years_experience ?? yearsBand ?? null,
      linkedin: c.linkedin_url,
      hasResume: Boolean(c.resume_path || c.resume_url),
    },
    referredBy: referrer
      ? { firstName: referrer.first_name, lastName: referrer.last_name, email: referrer.email, mobile: referrer.phone, ecrnId: referrer.id }
      : null,
  };
}

/** "application.status_changed" → "status_changed". */
function actionOf(eventType: string): string {
  const i = eventType.indexOf(".");
  return i >= 0 ? eventType.slice(i + 1) : eventType;
}

/** Bullhorn-shaped body for one outbox event. This is exactly what gets sent. */
export function toBullhorn(row: OutboxRow): Json {
  const p: Json = row.payload ?? {};
  const base = { source: "ECRN", event: row.event_type, eventId: row.id, occurredAt: row.created_at };
  switch (row.entity_type) {
    // candidate.created, candidate.updated
    case "candidate": {
      const c: Json = p.candidate ?? {};
      return {
        ...base,
        data: {
          ...candidateToBullhorn(c, p.referrer, p.years_experience_band),
          ...routing(p),
          routingReason: c.routing_reason ?? null,
        },
      };
    }
    // referral.created
    case "referral":
      return {
        ...base,
        data: {
          entity: "Referral",
          ecrnId: p.referral?.id ?? row.entity_id,
          candidateEcrnId: p.referral?.candidate_id,
          isPrimary: p.referral?.is_primary,
          duplicateStatus: p.referral?.duplicate_status,
          referralSource: p.referral?.referral_source,
          notes: p.referral?.notes,
          referrer: p.referrer,
        },
      };
    // application.created, application.status_changed, application.assigned,
    // job_referral.created, job_referral.updated
    case "job_application":
    case "job_referral": {
      const a: Json = p.application ?? p.job_referral ?? {};
      const isReferral = row.entity_type === "job_referral";
      return {
        ...base,
        data: {
          entity: "JobSubmission",
          ecrnId: a.id ?? row.entity_id,
          action: actionOf(row.event_type),
          candidateEcrnId: a.candidate_id,
          candidate: { ecrnId: a.candidate_id ?? null },
          jobOrder: { id: bullhornId(p.job?.external_crm_id), ecrnId: p.job?.id ?? a.job_id ?? null, title: p.job?.title ?? null },
          status: a.status,
          via: isReferral ? "Referral" : "Direct application",
          referrerEcrnId: isReferral ? a.referrer_user_id ?? null : null,
          comments: a.notes ?? null,
          ...routing(p),
        },
      };
    }
    // company_lead.created
    case "company_lead":
      return {
        ...base,
        data: {
          entity: "Lead",
          companyName: p.company_name,
          name: p.contact_name,
          email: p.email,
          phone: p.phone,
          address: { city: p.location },
          description: [p.role_needed, p.job_description].filter(Boolean).join("\n"),
          numOpenings: p.number_of_candidates,
          salary: p.compensation_range,
          ecrnId: p.id,
        },
      };
    // member.onboarded
    case "profile":
      return {
        ...base,
        data: {
          entity: p.role === "referral_partner" ? "ReferralPartner" : "Member",
          firstName: p.first_name,
          lastName: p.last_name,
          email: p.email,
          mobile: p.phone,
          intent: p.intent,
          careerStatus: CAREER[p.career_status] ?? null,
          city: p.location_city,
          state: p.location_state,
          ecrnId: p.id,
        },
      };
    default:
      return { ...base, data: p };
  }
}

export interface DispatchResult {
  sent: number;
  failed: number;
  /** Set when nothing was attempted (not connected yet). */
  skipped: string | null;
}

/**
 * Deliver queued events, oldest first, plus failed ones that still have
 * attempts left. Works with any client allowed to update `integration_outbox`:
 * an admin's session client or the service client (scheduled delivery).
 *
 * Rows marked `skipped` (demo data, echoes of inbound events) are never sent.
 */
export async function dispatchOutbox(sb: SupabaseClient, limit = DEFAULT_DISPATCH_LIMIT): Promise<DispatchResult> {
  const url = process.env.STAFFING_REFERRALS_WEBHOOK_URL;
  if (!url) return { sent: 0, failed: 0, skipped: "STAFFING_REFERRALS_WEBHOOK_URL is not set yet, so events stay queued. Nothing is lost." };
  const secret = process.env.STAFFING_REFERRALS_SECRET;

  const { data, error } = await sb
    .from("integration_outbox")
    .select("*")
    .or(`status.eq.queued,and(status.eq.failed,attempts.lt.${MAX_DELIVERY_ATTEMPTS})`)
    .order("created_at", { ascending: true })
    .limit(Math.max(1, Math.min(200, Math.floor(limit) || DEFAULT_DISPATCH_LIMIT)));
  if (error) throw new Error(error.message);

  let sent = 0;
  let failed = 0;
  for (const row of (data ?? []) as OutboxRow[]) {
    if (row.status !== "queued" && row.status !== "failed") continue;

    // Claim the row so two runs at the same moment (scheduler + the admin
    // button) cannot both send it. Whoever bumps `attempts` first wins.
    const claim = await sb
      .from("integration_outbox")
      .update({ attempts: row.attempts + 1 })
      .eq("id", row.id)
      .eq("attempts", row.attempts)
      .in("status", ["queued", "failed"])
      .select("id");
    if (claim.error || !claim.data || claim.data.length === 0) continue;

    try {
      const body = JSON.stringify(toBullhorn(row));
      const headers: Record<string, string> = {
        "content-type": "application/json",
        "x-ecrn-event": row.event_type,
        "x-ecrn-event-id": row.id,
      };
      if (secret) headers["x-ecrn-signature"] = await signPayload(body, secret);
      const res = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await sb
        .from("integration_outbox")
        .update({ status: "sent", sent_at: new Date().toISOString(), last_error: null })
        .eq("id", row.id);
      sent++;
    } catch (e) {
      await sb
        .from("integration_outbox")
        .update({ status: "failed", last_error: e instanceof Error ? e.message.slice(0, 300) : "failed" })
        .eq("id", row.id);
      failed++;
    }
  }
  return { sent, failed, skipped: null };
}
