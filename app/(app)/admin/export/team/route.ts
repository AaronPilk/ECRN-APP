import { createSupabaseServerClient } from "@/lib/supabase/server";
import { STAFF_ROLE_LABEL, inviteUrl } from "@/lib/admin/staff";
import { fetchAllRows } from "@/lib/admin/members";
import type { StaffRole } from "@/types";
import { csvDownload, denyUnlessAdmin, exportFailed, fullName } from "../_shared";

const COLUMNS = [
  "id",
  "first_name",
  "last_name",
  "email",
  "phone",
  "title",
  "staff_role",
  "role",
  "manager_id",
  "manager_name",
  "invite_code",
  "invite_link",
  "specialties",
  "territories",
  "bullhorn_user_id",
  "has_login",
  "profile_id",
  "is_active",
  "signups_direct",
  "signups_network",
  "signups_total",
  "created_at",
  "updated_at",
];

/** The Delta team: owners, account managers and recruiters, with their codes, manager and sign-ups credited. */
export async function GET(): Promise<Response> {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;

  try {
    const sb = await createSupabaseServerClient();
    const [staff, credited] = await Promise.all([
      fetchAllRows((from, to) =>
        sb.from("staff").select("*", { count: "exact" }).order("first_name").order("last_name").order("id").range(from, to)
      ),
      fetchAllRows((from, to) =>
        sb
          .from("profiles")
          .select("id, recruited_by_staff_id, signup_source", { count: "exact" })
          .neq("role", "admin")
          .not("recruited_by_staff_id", "is", null)
          .order("id")
          .range(from, to)
      ),
    ]);

    const byId = new Map(staff.map((s) => [s.id as string, s]));
    const signups = new Map<string, { direct: number; network: number }>();
    for (const p of credited) {
      const id = p.recruited_by_staff_id as string;
      const tally = signups.get(id) ?? { direct: 0, network: 0 };
      if (p.signup_source === "member_invite") tally.network += 1;
      else tally.direct += 1;
      signups.set(id, tally);
    }

    const rows = staff.map((s) => {
      const tally = signups.get(s.id as string) ?? { direct: 0, network: 0 };
      const code = typeof s.invite_code === "string" ? s.invite_code : "";
      return {
        ...s,
        role: STAFF_ROLE_LABEL[s.staff_role as StaffRole] ?? s.staff_role,
        manager_name: typeof s.manager_id === "string" ? fullName(byId.get(s.manager_id)) : null,
        invite_link: code ? inviteUrl(code) : null,
        bullhorn_user_id: s.external_crm_id,
        has_login: Boolean(s.profile_id),
        signups_direct: tally.direct,
        signups_network: tally.network,
        signups_total: tally.direct + tally.network,
      };
    });

    return csvDownload("team", COLUMNS, rows);
  } catch (e) {
    return exportFailed("team", e);
  }
}
