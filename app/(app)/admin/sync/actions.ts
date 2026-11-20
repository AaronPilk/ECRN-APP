"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dispatchOutbox } from "@/lib/integrations/staffing-referrals";
import { applyInboundEvent, extractEvents, normalizeInboundEvent, receiveInboundEvents } from "@/lib/integrations/inbound";
import { runBullhornPull } from "@/lib/integrations/bullhorn-sync";
import type { SimulateResult } from "@/lib/integrations/samples";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Only ever send the admin back to this screen. */
function backTo(formData: FormData, fallback: string): string {
  const back = String(formData.get("back") ?? "");
  return back.startsWith("/admin/sync") ? back : fallback;
}
function withParam(path: string, key: "notice" | "error", value: string): string {
  const [base, query = ""] = path.split("?");
  const params = new URLSearchParams(query);
  params.delete("notice");
  params.delete("error");
  params.set(key, value);
  return `${base}?${params.toString()}`;
}

/** Deliver queued outbox events to Staffing Referrals now. */
export async function dispatchNowAction(): Promise<{ message: string }> {
  await requireAdmin();
  const sb = await createSupabaseServerClient();
  try {
    const r = await dispatchOutbox(sb);
    revalidatePath("/admin/sync");
    if (r.skipped) return { message: r.skipped };
    if (r.sent === 0 && r.failed === 0) return { message: "Nothing is waiting to be sent." };
    return { message: `Sent ${r.sent}, failed ${r.failed}.` };
  } catch (e) {
    return { message: e instanceof Error ? e.message : "Delivery failed." };
  }
}

/** Pull team, jobs and placements from Bullhorn (only does anything once the direct API is configured). */
export async function pullBullhornNowAction(): Promise<{ message: string }> {
  await requireAdmin();
  const sb = await createSupabaseServerClient();
  try {
    const r = await runBullhornPull(sb);
    revalidatePath("/admin", "layout");
    return { message: r.message };
  } catch (e) {
    return { message: e instanceof Error ? e.message.slice(0, 300) : "The Bullhorn pull failed." };
  }
}

/** Put one failed outbox event (or all of them) back in the queue. Skipped rows are never touched. */
export async function retryOutboxAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const back = backTo(formData, "/admin/sync?tab=outbox");
  const id = String(formData.get("id") ?? "");
  if (id !== "all" && !UUID_RE.test(id)) redirect(withParam(back, "error", "That event could not be found."));

  const sb = await createSupabaseServerClient();
  let q = sb.from("integration_outbox").update({ status: "queued", attempts: 0, last_error: null }).eq("status", "failed");
  if (id !== "all") q = q.eq("id", id);
  const { data, error } = await q.select("id");
  revalidatePath("/admin/sync");
  if (error) redirect(withParam(back, "error", error.message));
  const n = data?.length ?? 0;
  redirect(withParam(back, "notice", n === 0 ? "Nothing to retry." : n === 1 ? "1 event is back in the queue." : `${n} events are back in the queue.`));
}

/** Run a stored inbound event through the handlers again (after a fix, or once the team has been synced). */
export async function rerunInboxAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const back = backTo(formData, "/admin/sync?tab=inbox");
  const id = String(formData.get("id") ?? "");
  if (!UUID_RE.test(id)) redirect(withParam(back, "error", "That event could not be found."));

  const sb = await createSupabaseServerClient();
  const { data: rows, error } = await sb.from("integration_inbox").select("id, provider, event_type, external_id, payload").eq("id", id).limit(1);
  const row = rows?.[0];
  if (error || !row) redirect(withParam(back, "error", error?.message ?? "That event could not be found."));

  let data: Record<string, unknown> = {};
  try {
    data = normalizeInboundEvent(row.payload).data;
  } catch {
    /* applyInboundEvent reports the unreadable payload */
  }
  const simulated = row.provider === "simulator";
  const outcome = await applyInboundEvent(
    sb,
    { id: row.external_id, type: row.event_type, data },
    { mirrorProvider: simulated ? "simulator" : "bullhorn", simulated }
  );
  await sb
    .from("integration_inbox")
    .update({
      status: outcome.status,
      result: { summary: outcome.summary, ...(outcome.result ?? {}) },
      error: outcome.error,
      processed_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/admin", "layout");
  if (outcome.status === "failed") redirect(withParam(back, "error", `Still failing: ${outcome.error ?? outcome.summary}`));
  redirect(withParam(back, "notice", `${outcome.status === "applied" ? "Applied" : "Ignored"}: ${outcome.summary}`));
}

/** Remove the raw records the simulator wrote to the Bullhorn mirror. ECRN records are not touched. */
export async function clearSimulatedMirrorAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const back = backTo(formData, "/admin/sync?tab=mirror");
  const sb = await createSupabaseServerClient();
  const { data, error } = await sb.from("crm_records").delete().eq("provider", "simulator").select("external_id");
  revalidatePath("/admin/sync");
  if (error) redirect(withParam(back, "error", error.message));
  redirect(withParam(back, "notice", `Removed ${data?.length ?? 0} simulated record(s) from the mirror.`));
}

/**
 * Simulator: apply a hand-written Bullhorn event with the admin's own session,
 * exactly as the webhook would, and record it in the inbox with provider
 * "simulator". It changes real ECRN records.
 */
export async function simulateEventAction(input: string): Promise<SimulateResult> {
  await requireAdmin();
  if (typeof input !== "string" || !input.trim()) return { ok: false, message: "Paste an event first.", events: [] };
  if (input.length > 100_000) return { ok: false, message: "That is too large for the simulator (100 KB max).", events: [] };

  let body: unknown;
  try {
    body = JSON.parse(input);
  } catch (e) {
    return { ok: false, message: `That is not valid JSON: ${e instanceof Error ? e.message : "parse error"}`, events: [] };
  }
  const events = extractEvents(body);
  if (events.length === 0) return { ok: false, message: 'Nothing to apply. An event looks like { "type": "...", "data": { ... } }.', events: [] };
  if (events.length > 10) return { ok: false, message: "The simulator takes up to 10 events at a time.", events: [] };
  for (const ev of events) {
    try {
      if (!normalizeInboundEvent(ev).type) return { ok: false, message: 'Every event needs a "type", for example "job.upserted".', events: [] };
    } catch (e) {
      return { ok: false, message: e instanceof Error ? e.message : "An event could not be read.", events: [] };
    }
  }

  const sb = await createSupabaseServerClient();
  const results = await receiveInboundEvents(sb, "simulator", events, {
    mirrorProvider: "simulator",
    simulated: true,
    generateId: () => `sim_${crypto.randomUUID()}`,
  });
  revalidatePath("/admin", "layout");

  const failed = results.some((r) => r.status === "failed" || r.status === "error");
  return {
    ok: !failed,
    message: failed ? "At least one event was not applied. See below." : null,
    events: results.map((r) => {
      const { notes, ...rest } = (r.result ?? {}) as { notes?: unknown } & Record<string, unknown>;
      return {
        type: r.type,
        status: r.status,
        summary: r.summary,
        error: r.error,
        notes: Array.isArray(notes) ? notes.map(String) : [],
        detail: Object.keys(rest).length > 0 ? JSON.stringify(rest, null, 2) : null,
      };
    }),
  };
}
