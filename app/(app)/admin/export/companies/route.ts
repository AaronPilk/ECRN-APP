import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/admin/members";
import { csvDownload, denyUnlessAdmin, exportFailed } from "../_shared";

const COLUMNS = [
  "id",
  "company_name",
  "contact_name",
  "email",
  "phone",
  "location",
  "role_needed",
  "number_of_candidates",
  "compensation_range",
  "urgency",
  "status",
  "job_description",
  "notes",
  "created_at",
  "updated_at",
  // added later
  "start_date",
  "external_crm_id",
];

/** Every company hiring request. */
export async function GET(): Promise<Response> {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;

  try {
    const sb = await createSupabaseServerClient();
    const rows = await fetchAllRows((from, to) =>
      sb.from("company_leads").select("*", { count: "exact" }).order("created_at", { ascending: false }).order("id").range(from, to)
    );
    return csvDownload("companies", COLUMNS, rows);
  } catch (e) {
    return exportFailed("companies", e);
  }
}
