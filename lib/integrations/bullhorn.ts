/**
 * Bullhorn integration placeholder.
 *
 * Delta uses external recruiting systems (likely Bullhorn). For MVP we
 * do not actually connect to Bullhorn — but we set up the surface area
 * so it's a drop-in later. When credentials are added in Batch 8:
 *
 *   1. Implement `pushCandidateToBullhorn`, `pullJobsFromBullhorn`, etc.
 *      against the Bullhorn REST API.
 *   2. The `external_crm_id` column on candidates/jobs/profiles is already
 *      reserved in the schema for the Bullhorn ID.
 *   3. The `integrations` table tracks status/config; toggle it
 *      from the admin Integrations page.
 *
 * For now, every function is a no-op that logs intent. This keeps the
 * rest of the app forward-compatible — call sites can wire to these
 * functions today and gain real behavior when the integration ships.
 */

import type { Candidate, Job, Profile } from "@/types";

interface BullhornClientConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

function getConfig(): BullhornClientConfig | null {
  const clientId = process.env.BULLHORN_CLIENT_ID;
  const clientSecret = process.env.BULLHORN_CLIENT_SECRET;
  const refreshToken = process.env.BULLHORN_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;
  return { clientId, clientSecret, refreshToken };
}

export function isBullhornConfigured(): boolean {
  return getConfig() !== null;
}

export async function pushCandidateToBullhorn(_candidate: Candidate): Promise<{ externalId: string | null }> {
  if (!isBullhornConfigured()) {
    return { externalId: null };
  }
  // TODO: real Bullhorn API call. Use ATSI/Candidate endpoint.
  return { externalId: null };
}

export async function pullJobsFromBullhorn(): Promise<Job[]> {
  if (!isBullhornConfigured()) return [];
  // TODO: real Bullhorn API call. Use JobOrder endpoint.
  return [];
}

export async function syncProfileToBullhorn(_profile: Profile): Promise<void> {
  if (!isBullhornConfigured()) return;
  // TODO
}

export async function updateCandidateStatusFromBullhorn(
  _candidateId: string,
  _status: string
): Promise<void> {
  if (!isBullhornConfigured()) return;
  // TODO: webhook handler / poll endpoint to mirror Bullhorn status changes.
}
