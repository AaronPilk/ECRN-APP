import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DEMO_MODE, SUPABASE_URL } from "@/lib/supabase/env";
import { isBullhornConfigured } from "@/lib/integrations/bullhorn";

/**
 * Reads for the Settings page: who the owners are, what is connected, and the
 * few facts the launch checklist can check for itself. Admin-only: Row Level
 * Security returns nothing for anyone else. Call after `requireAdmin()`.
 */

// ── owners ───────────────────────────────────────────────────────────

export interface OwnerRow {
  /** Lowercased email. */
  email: string;
  /** On the admin list (so a new sign-up with this email becomes an admin). */
  onList: boolean;
  addedAt: string | null;
  account: { id: string; name: string; role: string; createdAt: string; lastSeenAt: string | null } | null;
  /** Has an account that can open the admin side today. */
  isAdmin: boolean;
  isYou: boolean;
}

interface ProfileRow {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  created_at: string;
  last_seen_at: string | null;
}

const PROFILE_COLUMNS = "id, email, first_name, last_name, role, created_at, last_seen_at";

/** Escape `%`, `_` and `\` so a value can be matched literally with ilike. */
export const escapeLike = (s: string) => s.replace(/[\\%_]/g, (m) => `\\${m}`);

export async function listOwners(me: { id: string; email: string }): Promise<{ owners: OwnerRow[]; listSize: number; error: string | null }> {
  const sb = await createSupabaseServerClient();
  const [listRes, adminsRes] = await Promise.all([
    sb.from("admin_allowlist").select("email, created_at").order("created_at", { ascending: true }),
    sb.from("profiles").select(PROFILE_COLUMNS).eq("role", "admin").limit(200),
  ]);
  if (listRes.error) return { owners: [], listSize: 0, error: listRes.error.message };

  const list = (listRes.data ?? []) as { email: string; created_at: string }[];
  const listed = new Map<string, string>(); // lowercased email -> added at
  for (const row of list) {
    const key = row.email.trim().toLowerCase();
    if (key && !listed.has(key)) listed.set(key, row.created_at);
  }

  // Accounts for the listed emails (Supabase Auth stores emails in lower case).
  let listedProfiles: ProfileRow[] = [];
  if (listed.size > 0) {
    const { data } = await sb.from("profiles").select(PROFILE_COLUMNS).in("email", [...listed.keys()]).limit(500);
    listedProfiles = (data ?? []) as ProfileRow[];
  }

  const profiles = new Map<string, ProfileRow>();
  for (const p of [...listedProfiles, ...((adminsRes.data ?? []) as ProfileRow[])]) {
    profiles.set(p.email.trim().toLowerCase(), p);
  }

  const toRow = (email: string): OwnerRow => {
    const p = profiles.get(email) ?? null;
    return {
      email,
      onList: listed.has(email),
      addedAt: listed.get(email) ?? null,
      account: p
        ? {
            id: p.id,
            name: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
            role: p.role,
            createdAt: p.created_at,
            lastSeenAt: p.last_seen_at,
          }
        : null,
      isAdmin: p?.role === "admin",
      isYou: p ? p.id === me.id : email === me.email.trim().toLowerCase(),
    };
  };

  const owners = [...listed.keys()].map(toRow);
  // Accounts that have admin access without being on the list (set by hand in the database).
  for (const [email, p] of profiles) {
    if (p.role === "admin" && !listed.has(email)) owners.push(toRow(email));
  }
  return { owners, listSize: listed.size, error: null };
}

// ── connections ──────────────────────────────────────────────────────

export interface Connections {
  supabase: boolean;
  demoMode: boolean;
  serviceKey: boolean;
  staffingWebhook: boolean;
  staffingSecret: boolean;
  bullhornApi: boolean;
  sendgrid: boolean;
  resend: boolean;
  twilio: boolean;
}

/** Which environment variables are set. Only yes or no, never the values. */
export function getConnections(): Connections {
  return {
    supabase: Boolean(SUPABASE_URL),
    demoMode: DEMO_MODE,
    serviceKey: Boolean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
    staffingWebhook: Boolean(process.env.STAFFING_REFERRALS_WEBHOOK_URL),
    staffingSecret: Boolean(process.env.STAFFING_REFERRALS_SECRET),
    bullhornApi: isBullhornConfigured(),
    sendgrid: Boolean(process.env.SENDGRID_API_KEY),
    resend: Boolean(process.env.RESEND_API_KEY),
    twilio: Boolean(process.env.TWILIO_ACCOUNT_SID),
  };
}

// ── launch checklist facts ───────────────────────────────────────────

export interface LaunchFacts {
  /** Active team members that are not demo rows. Null when the lookup failed. */
  realTeamMembers: number | null;
  demoTeamMembers: number | null;
  openJobs: number | null;
  openJobsWithoutOwner: number | null;
}

export async function getLaunchFacts(): Promise<LaunchFacts> {
  const sb = await createSupabaseServerClient();
  const [staffRes, openRes, ownerlessRes] = await Promise.all([
    sb.from("staff").select("id, is_active, metadata").limit(1000),
    sb.from("jobs").select("id", { count: "exact", head: true }).eq("status", "open"),
    sb.from("jobs").select("id", { count: "exact", head: true }).eq("status", "open").is("account_manager_id", null),
  ]);

  let realTeamMembers: number | null = null;
  let demoTeamMembers: number | null = null;
  if (!staffRes.error) {
    const rows = (staffRes.data ?? []) as { is_active: boolean; metadata: Record<string, unknown> | null }[];
    const isDemo = (m: Record<string, unknown> | null) => m?.demo === true || m?.demo === "true";
    demoTeamMembers = rows.filter((r) => isDemo(r.metadata)).length;
    realTeamMembers = rows.filter((r) => r.is_active && !isDemo(r.metadata)).length;
  }
  return {
    realTeamMembers,
    demoTeamMembers,
    openJobs: openRes.error ? null : (openRes.count ?? 0),
    openJobsWithoutOwner: ownerlessRes.error ? null : (ownerlessRes.count ?? 0),
  };
}
