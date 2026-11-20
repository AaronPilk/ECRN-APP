import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseDemoCounts, parseDemoRemoved, type DemoCounts, type DemoRemoved } from "@/components/admin/settings/shared";

/**
 * Demo data: the fictional team, members, candidates, referrals, applications,
 * payouts and hiring requests loaded by `supabase/seed/demo_admin_seed.sql`
 * so the admin dashboards have something to show before launch.
 *
 * Counting and removing both happen inside the database
 * (`supabase/migrations/0012_demo_data_tools.sql`), and both functions refuse
 * anyone who is not an admin. Call these only after `requireAdmin()`.
 */

/** How many demo rows exist per table. `counts` is null when the lookup failed. */
export async function getDemoDataCounts(): Promise<{ counts: DemoCounts | null; error: string | null }> {
  const sb = await createSupabaseServerClient();
  const { data, error } = await sb.rpc("admin_demo_data_counts");
  if (error) return { counts: null, error: error.message };
  return { counts: parseDemoCounts(data), error: null };
}

/**
 * Remove every demo row in one transaction and report what was removed.
 * Nothing real is deleted; real rows that pointed at a demo team member
 * simply end up with no owner.
 */
export async function clearDemoData(): Promise<{ removed: DemoRemoved | null; error: string | null }> {
  const sb = await createSupabaseServerClient();
  const { data, error } = await sb.rpc("admin_clear_demo_data");
  if (error) return { removed: null, error: error.message };
  return { removed: parseDemoRemoved(data), error: null };
}
