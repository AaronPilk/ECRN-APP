import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStaffMap, staffName } from "@/lib/admin/staff";
import { fetchAllRows, isUuid } from "@/lib/admin/members";
import { csvDownload, denyUnlessAdmin, embedded, exportFailed, fullName } from "../_shared";

const SELECT =
  "*, job:jobs(id, title, company_name, location_city, location_state, status, external_crm_id, private:job_private(client_company)), " +
  "candidate:candidates(id, first_name, last_name, email, phone, status, external_crm_id), " +
  "applicant:profiles!job_applications_applicant_user_id_fkey(id, first_name, last_name, email, phone)";

const STATUSES = ["submitted", "reviewing", "interviewing", "offer", "hired", "rejected", "withdrawn"];

const COLUMNS = [
  "application_id",
  "status",
  "applied_at",
  "updated_at",
  "job_id",
  "job_title",
  "job_company_public",
  "job_client_company",
  "job_location",
  "job_status",
  "job_bullhorn_id",
  "candidate_id",
  "candidate_name",
  "candidate_email",
  "candidate_phone",
  "candidate_status",
  "candidate_bullhorn_id",
  "applicant_user_id",
  "applicant_name",
  "applicant_email",
  "account_manager_id",
  "account_manager_name",
  "recruiter_id",
  "recruiter_name",
  "resume_url",
  "linkedin_url",
  "notes",
];

/**
 * Every job application with the job, the person, and who owns it.
 * Optional filters: ?status=, ?job=<job id>, ?account_manager=<staff id|none>, ?recruiter=<staff id|none>.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;

  try {
    const sb = await createSupabaseServerClient();
    const sp = request.nextUrl.searchParams;
    const status = sp.get("status") ?? "";
    const job = sp.get("job") ?? sp.get("job_id") ?? "";
    const owner = sp.get("account_manager") ?? "";
    const recruiter = sp.get("recruiter") ?? "";

    const [apps, staff] = await Promise.all([
      fetchAllRows((from, to) => {
        let q = sb.from("job_applications").select(SELECT, { count: "exact" });
        if (STATUSES.includes(status)) q = q.eq("status", status);
        if (isUuid(job)) q = q.eq("job_id", job);
        if (owner === "none") q = q.is("account_manager_id", null);
        else if (isUuid(owner)) q = q.eq("account_manager_id", owner);
        if (recruiter === "none") q = q.is("recruiter_id", null);
        else if (isUuid(recruiter)) q = q.eq("recruiter_id", recruiter);
        return q.order("created_at", { ascending: false }).order("id").range(from, to);
      }),
      getStaffMap(),
    ]);

    const rows = apps.map((a) => {
      const j = embedded(a.job);
      const c = embedded(a.candidate);
      const p = embedded(a.applicant);
      const am = typeof a.account_manager_id === "string" ? staff.get(a.account_manager_id) : undefined;
      const rec = typeof a.recruiter_id === "string" ? staff.get(a.recruiter_id) : undefined;
      return {
        application_id: a.id,
        status: a.status,
        applied_at: a.created_at,
        updated_at: a.updated_at,
        job_id: a.job_id,
        job_title: j?.title ?? null,
        job_company_public: j?.company_name ?? null,
        job_client_company: embedded(j?.private)?.client_company ?? null,
        job_location: j ? [j.location_city, j.location_state].filter(Boolean).join(", ") : null,
        job_status: j?.status ?? null,
        job_bullhorn_id: j?.external_crm_id ?? null,
        candidate_id: a.candidate_id,
        candidate_name: fullName(c),
        candidate_email: c?.email ?? null,
        candidate_phone: c?.phone ?? p?.phone ?? null,
        candidate_status: c?.status ?? null,
        candidate_bullhorn_id: c?.external_crm_id ?? null,
        applicant_user_id: a.applicant_user_id,
        applicant_name: fullName(p),
        applicant_email: p?.email ?? null,
        account_manager_id: a.account_manager_id,
        account_manager_name: am ? staffName(am) : null,
        recruiter_id: a.recruiter_id,
        recruiter_name: rec ? staffName(rec) : null,
        resume_url: a.resume_url,
        linkedin_url: a.linkedin_url,
        notes: a.notes,
      };
    });

    return csvDownload("applications", COLUMNS, rows);
  } catch (e) {
    return exportFailed("applications", e);
  }
}
