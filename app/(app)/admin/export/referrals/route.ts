import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/admin/members";
import { csvDownload, denyUnlessAdmin, embedded, exportFailed, fullName } from "../_shared";

const SELECT =
  "*, candidate:candidates(id, first_name, last_name, email, phone, status), " +
  "referrer:profiles!referrals_referrer_user_id_fkey(id, first_name, last_name, email)";

const COLUMNS = [
  "referral_id",
  "candidate_id",
  "candidate_name",
  "candidate_email",
  "candidate_phone",
  "candidate_status",
  "referrer_id",
  "referrer_name",
  "referrer_email",
  "is_primary",
  "duplicate_status",
  "referral_source",
  "notes",
  "created_at",
  // added later
  "referral_status",
  "updated_at",
];

/** Every referral with the person referred and who sent it. */
export async function GET(): Promise<Response> {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;

  try {
    const sb = await createSupabaseServerClient();
    const referrals = await fetchAllRows((from, to) =>
      sb.from("referrals").select(SELECT, { count: "exact" }).order("created_at", { ascending: false }).order("id").range(from, to)
    );

    const rows = referrals.map((r) => {
      const candidate = embedded(r.candidate);
      const referrer = embedded(r.referrer);
      return {
        referral_id: r.id,
        candidate_id: r.candidate_id,
        candidate_name: fullName(candidate),
        candidate_email: candidate?.email ?? null,
        candidate_phone: candidate?.phone ?? null,
        candidate_status: candidate?.status ?? null,
        referrer_id: r.referrer_user_id,
        referrer_name: fullName(referrer),
        referrer_email: referrer?.email ?? null,
        is_primary: r.is_primary,
        duplicate_status: r.duplicate_status,
        referral_source: r.referral_source,
        notes: r.notes,
        created_at: r.created_at,
        referral_status: r.status,
        updated_at: r.updated_at,
      };
    });

    return csvDownload("referrals", COLUMNS, rows);
  } catch (e) {
    return exportFailed("referrals", e);
  }
}
