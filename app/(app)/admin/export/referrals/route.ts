import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/mock";
import { listAllReferralsEnriched } from "@/lib/data/repository";
import { toCsv, csvResponse } from "@/lib/utils/csv";

export async function GET(): Promise<Response> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = (await listAllReferralsEnriched()).map(
    ({ referral, candidate, referrer }) => ({
      referral_id: referral.id,
      candidate_id: candidate.id,
      candidate_name: `${candidate.firstName} ${candidate.lastName}`,
      candidate_email: candidate.email,
      candidate_phone: candidate.phone,
      candidate_status: candidate.status,
      referrer_id: referrer?.id ?? null,
      referrer_name: referrer
        ? `${referrer.firstName ?? ""} ${referrer.lastName ?? ""}`.trim()
        : null,
      referrer_email: referrer?.email ?? null,
      is_primary: referral.isPrimary,
      duplicate_status: referral.duplicateStatus,
      referral_source: referral.referralSource,
      notes: referral.notes,
      created_at: referral.createdAt,
    })
  );

  const csv = toCsv(rows, [
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
  ]);

  return csvResponse(`ecrn-referrals-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
