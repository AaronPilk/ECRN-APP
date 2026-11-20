import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/admin/members";
import { csvDownload, denyUnlessAdmin, exportFailed } from "../_shared";

const COLUMNS = [
  "id",
  "first_name",
  "last_name",
  "email",
  "phone",
  "role",
  "location_city",
  "location_state",
  "linkedin_url",
  "company_name",
  "external_crm_id",
  "is_active",
  "created_at",
];

/**
 * Every account, admins included (the original "Users" export, kept for old links).
 * For members with onboarding answers and recruiter credit use /admin/export/members.
 */
export async function GET(): Promise<Response> {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;

  try {
    const sb = await createSupabaseServerClient();
    const rows = await fetchAllRows((from, to) =>
      sb.from("profiles").select("*", { count: "exact" }).order("created_at", { ascending: false }).order("id").range(from, to)
    );
    return csvDownload("users", COLUMNS, rows);
  } catch (e) {
    return exportFailed("users", e);
  }
}
