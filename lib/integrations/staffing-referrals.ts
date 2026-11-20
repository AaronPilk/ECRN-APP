/**
 * ECRN → Staffing Referrals → Bullhorn (→ Sense for texts/emails).
 *
 * Every signup, referral, application, status change, and hiring request is
 * written to `integration_outbox` by database triggers (migration 0006), so
 * nothing is lost even before the connection exists. This module turns each
 * queued row into a Bullhorn-shaped payload and POSTs it to the Staffing
 * Referrals webhook once these env vars are set:
 *
 *   STAFFING_REFERRALS_WEBHOOK_URL   where to send events
 *   STAFFING_REFERRALS_SECRET        shared secret; we send an HMAC-SHA256
 *                                    signature in `X-ECRN-Signature`
 *
 * Field names follow Bullhorn's REST entities (Candidate, Lead/ClientContact,
 * JobSubmission) so the receiving side can map them 1:1. Adjust `toBullhorn`
 * once Staffing Referrals shares its exact spec.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Json = Record<string, any>;

export interface OutboxRow {
  id: string;
  event_type: string;
  entity_type: string;
  entity_id: string | null;
  payload: Json;
  status: "queued" | "sent" | "failed" | "skipped";
  attempts: number;
  last_error: string | null;
  created_at: string;
  sent_at: string | null;
}

export function isStaffingReferralsConfigured(): boolean {
  return Boolean(process.env.STAFFING_REFERRALS_WEBHOOK_URL);
}

const CAREER: Record<string, string> = {
  actively_looking: "Active",
  open_to_offers: "Passive",
  not_looking: "Not Looking",
};

function candidateToBullhorn(c: Json, referrer?: Json | null, yearsBand?: string | null): Json {
  return {
    entity: "Candidate",
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
    externalID: c.external_crm_id ?? null,
    ecrnId: c.id,
  };
}

/** Bullhorn-shaped body for one outbox event. */
export function toBullhorn(row: OutboxRow): Json {
  const p = row.payload ?? {};
  const base = { source: "ECRN", event: row.event_type, eventId: row.id, occurredAt: row.created_at };
  switch (row.entity_type) {
    case "candidate":
      return { ...base, data: candidateToBullhorn(p.candidate ?? {}, p.referrer, p.years_experience_band) };
    case "referral":
      return {
        ...base,
        data: {
          entity: "Referral",
          candidateEcrnId: p.referral?.candidate_id,
          isPrimary: p.referral?.is_primary,
          duplicateStatus: p.referral?.duplicate_status,
          referralSource: p.referral?.referral_source,
          notes: p.referral?.notes,
          referrer: p.referrer,
        },
      };
    case "job_application":
    case "job_referral": {
      const a = p.application ?? p.job_referral ?? {};
      return {
        ...base,
        data: {
          entity: "JobSubmission",
          candidateEcrnId: a.candidate_id,
          jobOrder: { ecrnId: p.job?.id, title: p.job?.title, id: p.job?.external_crm_id ?? null },
          status: a.status,
          via: row.entity_type === "job_referral" ? "Referral" : "Direct application",
          comments: a.notes ?? null,
        },
      };
    }
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

async function sign(body: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Deliver queued (and retryable failed) events. Requires a client that can
 * update `integration_outbox` (an admin session or the service role).
 */
export async function dispatchOutbox(sb: SupabaseClient, limit = 50): Promise<{ sent: number; failed: number; skipped: string | null }> {
  const url = process.env.STAFFING_REFERRALS_WEBHOOK_URL;
  if (!url) return { sent: 0, failed: 0, skipped: "STAFFING_REFERRALS_WEBHOOK_URL isn't set yet, so events stay queued." };

  const { data, error } = await sb
    .from("integration_outbox")
    .select("*")
    .or("status.eq.queued,and(status.eq.failed,attempts.lt.5)")
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw new Error(error.message);

  let sent = 0;
  let failed = 0;
  for (const row of (data ?? []) as OutboxRow[]) {
    const body = JSON.stringify(toBullhorn(row));
    const headers: Record<string, string> = { "content-type": "application/json", "x-ecrn-event": row.event_type, "x-ecrn-event-id": row.id };
    if (process.env.STAFFING_REFERRALS_SECRET) headers["x-ecrn-signature"] = await sign(body, process.env.STAFFING_REFERRALS_SECRET);
    try {
      const res = await fetch(url, { method: "POST", headers, body, signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await sb.from("integration_outbox").update({ status: "sent", sent_at: new Date().toISOString(), attempts: row.attempts + 1, last_error: null }).eq("id", row.id);
      sent++;
    } catch (e) {
      await sb
        .from("integration_outbox")
        .update({ status: "failed", attempts: row.attempts + 1, last_error: e instanceof Error ? e.message.slice(0, 300) : "failed" })
        .eq("id", row.id);
      failed++;
    }
  }
  return { sent, failed, skipped: null };
}
