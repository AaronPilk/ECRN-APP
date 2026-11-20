import { createSupabaseServiceClient } from "@/lib/supabase/service";
import { safeEqual } from "@/lib/integrations/signature";
import { DEFAULT_DISPATCH_LIMIT, dispatchOutbox } from "@/lib/integrations/staffing-referrals";
import { runBullhornPull } from "@/lib/integrations/bullhorn-sync";

/**
 * Scheduled delivery: send queued outbox events to Staffing Referrals.
 *
 *   POST /api/integrations/dispatch
 *   authorization: Bearer <CRON_SECRET>
 *
 * Optional query: `limit` (rows per run, default 15, max 200) and `pull=1`
 * (also pull from Bullhorn when the direct API is configured).
 *
 * Call it every few minutes from a Cloudflare Cron Trigger or any scheduler.
 * See "Scheduled delivery" in docs/BULLHORN_INTEGRATION.md for ready-to-paste
 * examples.
 */

export const dynamic = "force-dynamic";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function POST(request: Request): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET;
  const sb = createSupabaseServiceClient();
  if (!cronSecret || !sb) return json({ error: "not configured" }, 503);

  const auth = request.headers.get("authorization") ?? "";
  if (!safeEqual(auth, `Bearer ${cronSecret}`)) return json({ error: "unauthorized" }, 401);

  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(200, Number(url.searchParams.get("limit")) || DEFAULT_DISPATCH_LIMIT));

  try {
    const outbound = await dispatchOutbox(sb, limit);
    let bullhorn: Awaited<ReturnType<typeof runBullhornPull>> | { error: string } | null = null;
    if (url.searchParams.get("pull") === "1") {
      try {
        bullhorn = await runBullhornPull(sb);
      } catch (e) {
        bullhorn = { error: e instanceof Error ? e.message.slice(0, 300) : "Bullhorn pull failed" };
      }
    }
    return json({ ok: true, ...outbound, ...(bullhorn ? { bullhorn } : {}) });
  } catch (e) {
    return json({ ok: false, error: e instanceof Error ? e.message.slice(0, 300) : "dispatch failed" }, 500);
  }
}
