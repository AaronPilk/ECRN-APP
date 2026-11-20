import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { bullhornAuthMode, isBullhornConfigured, pullCorporateUsers, pullJobOrders, pullPlacements, setBullhornTokenStore } from "./bullhorn";
import { receiveInboundEvents, type InboundEvent } from "./inbound";

/**
 * Pull the team, jobs and placements straight from Bullhorn and run them
 * through the same pipeline as webhook events (inbox → handlers → mirror).
 * Does nothing until the BULLHORN_* credentials are set.
 *
 * Each run handles a small number of records so it fits inside one Cloudflare
 * Worker request; cursors in `integrations.config` (provider "bullhorn")
 * remember where the next run continues. Run it from Admin → Integrations, or
 * on a schedule through POST /api/integrations/dispatch?pull=1.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type Json = Record<string, any>;

export interface BullhornPullResult {
  configured: boolean;
  processed: number;
  applied: number;
  ignored: number;
  failed: number;
  unchanged: number;
  /** True when the run stopped at its budget and there is more to pull. */
  more: boolean;
  message: string;
}

/** New (not yet seen) records handled per run. */
const DEFAULT_BUDGET = 20;
/** How far back the first placement pull looks. Older placements are history, not news. */
const FIRST_PLACEMENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export async function runBullhornPull(sb: SupabaseClient, opts: { budget?: number } = {}): Promise<BullhornPullResult> {
  const result: BullhornPullResult = { configured: false, processed: 0, applied: 0, ignored: 0, failed: 0, unchanged: 0, more: false, message: "" };
  if (!isBullhornConfigured()) {
    result.message = "Bullhorn is not connected yet. Add the BULLHORN_* credentials to turn this on.";
    return result;
  }
  result.configured = true;

  const { data: rows, error } = await sb.from("integrations").select("id, config").eq("provider", "bullhorn").limit(1);
  if (error) throw new Error(`integrations lookup: ${error.message}`);
  const integration = (rows as Json[] | null)?.[0] ?? null;
  const config: Json = integration?.config && typeof integration.config === "object" ? { ...integration.config } : {};
  const cursors: Json = config.cursors && typeof config.cursors === "object" ? { ...config.cursors } : {};

  const saveConfig = async (patch: Json) => {
    Object.assign(config, patch);
    if (integration) await sb.from("integrations").update({ config }).eq("id", integration.id);
  };

  // Refresh-token-only sign-in: keep Bullhorn's newest single-use token (admin-only table).
  if (bullhornAuthMode() === "refresh_token") {
    setBullhornTokenStore({
      load: async () => (typeof config.refresh_token === "string" ? config.refresh_token : null),
      save: async (refreshToken) => saveConfig({ refresh_token: refreshToken }),
    });
  }

  const users = await pullCorporateUsers();
  const jobs = await pullJobOrders({ since: cursors.JobOrder ?? null });
  const placements = await pullPlacements({ since: cursors.Placement ?? Date.now() - FIRST_PLACEMENT_WINDOW_MS });

  let budget = Math.max(1, opts.budget ?? DEFAULT_BUDGET);
  const queue: { entity: "CorporateUser" | "JobOrder" | "Placement"; event: InboundEvent }[] = [
    ...users.map((event) => ({ entity: "CorporateUser" as const, event })),
    ...jobs.map((event) => ({ entity: "JobOrder" as const, event })),
    ...placements.map((event) => ({ entity: "Placement" as const, event })),
  ];

  for (const item of queue) {
    if (budget <= 0) {
      result.more = true;
      break;
    }
    const [r] = await receiveInboundEvents(sb, "bullhorn", [item.event]);
    if (!r || r.status === "error") {
      result.failed++;
      result.more = true;
      break; // could not even store it: stop here and let the next run retry from the same cursor
    }
    if (r.status === "duplicate") result.unchanged++;
    else {
      budget--;
      result.processed++;
      if (r.status === "applied") result.applied++;
      else if (r.status === "ignored") result.ignored++;
      else result.failed++;
    }
    // One millisecond behind, so records sharing a timestamp are not skipped
    // (the one pulled again is recognised by its event id and ignored).
    const modified = Number(item.event.data.dateLastModified);
    if (item.entity !== "CorporateUser" && Number.isFinite(modified) && modified > 0) cursors[item.entity] = modified - 1;
  }

  config.cursors = cursors;
  if (integration) {
    await sb.from("integrations").update({ config, status: "active", last_synced_at: new Date().toISOString() }).eq("id", integration.id);
  }

  result.message =
    `Bullhorn pull: ${result.applied} applied, ${result.ignored} ignored, ${result.failed} failed, ${result.unchanged} unchanged.` +
    (result.more ? " There is more to pull. Run it again to continue." : "");
  return result;
}
