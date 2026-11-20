import { createSupabaseServiceClient, isServiceClientConfigured } from "@/lib/supabase/service";
import { verifySignature } from "@/lib/integrations/signature";
import { extractEvents, INBOUND_EVENT_TYPES, MAX_EVENTS_PER_REQUEST, receiveInboundEvents } from "@/lib/integrations/inbound";

/**
 * Inbound webhook: Staffing Referrals / Bullhorn → ECRN.
 *
 *   POST /api/integrations/staffing-referrals
 *   x-ecrn-signature: <hex HMAC-SHA256 of the raw body, key = STAFFING_REFERRALS_SECRET>
 *   body: one event `{ id, type, data }` or `{ events: [ ... ] }`
 *
 * Every event is stored in `integration_inbox` before it is applied, so
 * nothing is lost if a handler fails. A repeat of an event id answers 200 and
 * is ignored. Reference: docs/BULLHORN_INTEGRATION.md.
 */

export const dynamic = "force-dynamic";

/** A batch of 25 full records is well under this. */
const MAX_BODY_BYTES = 1_000_000;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

/** Health check. Says whether the endpoint is ready; never reveals a secret. */
export async function GET(): Promise<Response> {
  return json({
    ok: true,
    service: "ecrn-staffing-referrals-inbound",
    configured: Boolean(process.env.STAFFING_REFERRALS_SECRET) && isServiceClientConfigured(),
    signature: "x-ecrn-signature: hex HMAC-SHA256 of the raw request body",
    accepts: INBOUND_EVENT_TYPES,
    maxEventsPerRequest: MAX_EVENTS_PER_REQUEST,
  });
}

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.STAFFING_REFERRALS_SECRET;
  const sb = createSupabaseServiceClient();
  if (!secret || !sb) return json({ error: "not configured" }, 503);

  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) return json({ error: "body too large" }, 413);
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: "body too large" }, 413);
  const provided = request.headers.get("x-ecrn-signature") ?? request.headers.get("x-signature");
  if (!provided || !(await verifySignature(raw, secret, provided))) return json({ error: "invalid signature" }, 401);

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: "body is not valid JSON" }, 400);
  }
  const events = extractEvents(body);
  if (events.length === 0) return json({ error: "no events in body" }, 400);
  if (events.length > MAX_EVENTS_PER_REQUEST) {
    return json({ error: `too many events in one request (max ${MAX_EVENTS_PER_REQUEST})` }, 413);
  }

  const results = await receiveInboundEvents(sb, "staffing_referrals", events);
  const count = (s: string) => results.filter((r) => r.status === s).length;
  const notStored = count("error");
  return json(
    {
      ok: notStored === 0,
      received: results.length,
      applied: count("applied"),
      ignored: count("ignored"),
      failed: count("failed"),
      duplicates: count("duplicate"),
      notStored,
      results: results.map((r) => ({ index: r.index, id: r.id, type: r.type, status: r.status, summary: r.summary, error: r.error })),
    },
    // 500 only when an event could not even be stored, so the sender retries it.
    // Events that were stored but failed to apply stay in the admin inbox and can be run again there.
    notStored > 0 ? 500 : 200
  );
}
