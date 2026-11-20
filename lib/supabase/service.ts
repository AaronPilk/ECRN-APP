import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./env";

/**
 * Supabase client that uses the project's secret (service role) key.
 *
 * It bypasses Row Level Security, so it is only for trusted server code that
 * has no signed-in user: the inbound Staffing Referrals webhook and the
 * scheduled outbox delivery. Never import this from a client component and
 * never return its data to a visitor without your own access check.
 *
 * Set the key as a hosting secret (never commit it):
 *   npx wrangler secret put SUPABASE_SECRET_KEY
 *
 * Returns null when the key is missing, so callers can answer "not configured"
 * instead of crashing.
 */
function secretKey(): string | null {
  // SUPABASE_SERVICE_ROLE_KEY is the older name for the same key.
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}

export function isServiceClientConfigured(): boolean {
  return Boolean(SUPABASE_URL && secretKey());
}

export function createSupabaseServiceClient(): SupabaseClient | null {
  const key = secretKey();
  if (!SUPABASE_URL || !key) return null;
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
