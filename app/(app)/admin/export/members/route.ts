import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStaffMap, staffName } from "@/lib/admin/staff";
import { fetchAllRows, fetchByIds, membersPage, parseMemberFilters } from "@/lib/admin/members";
import { csvDownload, denyUnlessAdmin, embeddedCount, exportFailed, fullName } from "../_shared";

const COLUMNS = [
  "id",
  "first_name",
  "last_name",
  "email",
  "phone",
  "role",
  "is_active",
  "onboarded",
  "onboarding_completed_at",
  "tour_completed_at",
  "intent",
  "career_status",
  "discipline",
  "years_experience",
  "location_city",
  "location_state",
  "location_lat",
  "location_lng",
  "relocation",
  "move_motivators",
  "current_employer",
  "linkedin_url",
  "company_name",
  "resume_on_file",
  "resume_uploaded",
  "resume_built",
  "resume_path",
  "resume_uploaded_at",
  "signup_source",
  "recruiter_id",
  "recruiter_name",
  "recruiter_code",
  "invited_by_id",
  "invited_by_name",
  "invited_by_email",
  "signup_platform",
  "last_platform",
  "last_seen_at",
  "referrals_count",
  "applications_count",
  "external_crm_id",
  "onboarding_answers",
  "metadata",
  "created_at",
  "updated_at",
];

/**
 * Every member (never admins) with all profile and onboarding columns.
 * Takes the same query string as /admin/members, so "Export CSV" downloads
 * exactly what the filters show, across every page.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;

  try {
    const sb = await createSupabaseServerClient();
    const filters = parseMemberFilters(request.nextUrl.searchParams);
    const [members, staff] = await Promise.all([
      fetchAllRows((from, to) => membersPage(sb, filters, "*, referrals(count), job_applications(count)", from, to)),
      getStaffMap(),
    ]);
    const inviters = new Map(
      (await fetchByIds(sb, "profiles", "id, first_name, last_name, email", members.map((m) => m.invited_by))).map((p) => [p.id as string, p])
    );

    const rows = members.map((m) => {
      const recruiter = typeof m.recruited_by_staff_id === "string" ? staff.get(m.recruited_by_staff_id) : undefined;
      const inviter = typeof m.invited_by === "string" ? inviters.get(m.invited_by) : undefined;
      const builder = m.resume_builder && typeof m.resume_builder === "object" ? (m.resume_builder as Record<string, unknown>) : {};
      const uploaded = Boolean(m.resume_path);
      const built = builder.generated != null;
      return {
        ...m,
        resume_on_file: uploaded || built,
        resume_uploaded: uploaded,
        resume_built: built,
        recruiter_id: m.recruited_by_staff_id,
        recruiter_name: recruiter ? staffName(recruiter) : null,
        recruiter_code: recruiter?.inviteCode ?? null,
        invited_by_id: m.invited_by,
        invited_by_name: fullName(inviter),
        invited_by_email: inviter?.email ?? null,
        referrals_count: embeddedCount(m.referrals),
        applications_count: embeddedCount(m.job_applications),
      };
    });

    return csvDownload("members", COLUMNS, rows);
  } catch (e) {
    return exportFailed("members", e);
  }
}
