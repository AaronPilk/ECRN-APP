import { createSupabaseServerClient } from "@/lib/supabase/server";
import { fetchAllRows } from "@/lib/admin/members";
import { csvDownload, denyUnlessAdmin, embedded, exportFailed, fullName } from "../_shared";

const SELECT =
  "*, candidate:candidates(id, first_name, last_name), " +
  "referrer:profiles!payouts_referrer_user_id_fkey(id, first_name, last_name, email), job:jobs(id, title)";

const COLUMNS = [
  "payout_id",
  "amount_cents",
  "amount_dollars",
  "status",
  "candidate_id",
  "candidate_name",
  "referrer_id",
  "referrer_name",
  "referrer_email",
  "job_id",
  "job_title",
  "placement_date",
  "approved_at",
  "paid_at",
  "notes",
  "created_at",
];

/** Every referral payout with the person placed, the referrer and the job. */
export async function GET(): Promise<Response> {
  const denied = await denyUnlessAdmin();
  if (denied) return denied;

  try {
    const sb = await createSupabaseServerClient();
    const payouts = await fetchAllRows((from, to) =>
      sb.from("payouts").select(SELECT, { count: "exact" }).order("created_at", { ascending: false }).order("id").range(from, to)
    );

    const rows = payouts.map((p) => {
      const candidate = embedded(p.candidate);
      const referrer = embedded(p.referrer);
      const job = embedded(p.job);
      const cents = typeof p.amount_cents === "number" ? p.amount_cents : 0;
      return {
        payout_id: p.id,
        amount_cents: cents,
        amount_dollars: (cents / 100).toFixed(2),
        status: p.status,
        candidate_id: p.candidate_id,
        candidate_name: fullName(candidate),
        referrer_id: p.referrer_user_id,
        referrer_name: fullName(referrer),
        referrer_email: referrer?.email ?? null,
        job_id: p.job_id,
        job_title: job?.title ?? null,
        placement_date: p.placement_date,
        approved_at: p.approved_at,
        paid_at: p.paid_at,
        notes: p.notes,
        created_at: p.created_at,
      };
    });

    return csvDownload("payouts", COLUMNS, rows);
  } catch (e) {
    return exportFailed("payouts", e);
  }
}
