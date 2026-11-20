import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStaffMap, staffName } from "@/lib/admin/staff";
import { fetchAllRows } from "@/lib/admin/members";
import { csvDownload, denyUnlessAdmin, embedded, exportFailed, fullName } from "../_shared";

const SELECT = "*, referrer:profiles!candidates_primary_referrer_user_id_fkey(id, first_name, last_name, email)";

const COLUMNS = [
  "id",
  "first_name",
  "last_name",
  "email",
  "phone",
  "location_city",
  "location_state",
  "current_job_title",
  "trade",
  "years_experience",
  "linkedin_url",
  "resume_url",
  "source_type",
  "status",
  "primary_referrer_id",
  "primary_referrer_email",
  "primary_referrer_name",
  "external_crm_id",
  "created_at",
  "updated_at",
  // added with team routing
  "current_company",
  "career_status",
  "relocation",
  "move_motivators",
  "is_confidential",
  "user_id",
  "account_manager_id",
  "account_manager_name",
  "recruiter_id",
  "recruiter_name",
  "routing_reason",
  "routed_at",
  "duplicate_of_candidate_id",
  "notes",
];

/** Every candidate in the pipeline with their referrer and current owner. */
export async function GET(): Promise<Response> {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;

  try {
    const sb = await createSupabaseServerClient();
    const [candidates, staff] = await Promise.all([
      fetchAllRows((from, to) =>
        sb.from("candidates").select(SELECT, { count: "exact" }).order("created_at", { ascending: false }).order("id").range(from, to)
      ),
      getStaffMap(),
    ]);

    const rows = candidates.map((c) => {
      const referrer = embedded(c.referrer);
      const am = typeof c.account_manager_id === "string" ? staff.get(c.account_manager_id) : undefined;
      const rec = typeof c.recruiter_id === "string" ? staff.get(c.recruiter_id) : undefined;
      return {
        ...c,
        primary_referrer_id: c.primary_referrer_user_id,
        primary_referrer_email: referrer?.email ?? null,
        primary_referrer_name: fullName(referrer),
        account_manager_name: am ? staffName(am) : null,
        recruiter_name: rec ? staffName(rec) : null,
      };
    });

    return csvDownload("candidates", COLUMNS, rows);
  } catch (e) {
    return exportFailed("candidates", e);
  }
}
