import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/mock";
import { listAllPayoutsEnriched } from "@/lib/data/repository";
import { toCsv, csvResponse } from "@/lib/utils/csv";

export async function GET(): Promise<Response> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = (await listAllPayoutsEnriched()).map(
    ({ payout, candidate, referrer, job }) => ({
      payout_id: payout.id,
      amount_cents: payout.amountCents,
      amount_dollars: (payout.amountCents / 100).toFixed(2),
      status: payout.status,
      candidate_id: candidate?.id ?? null,
      candidate_name: candidate ? `${candidate.firstName} ${candidate.lastName}` : null,
      referrer_id: referrer?.id ?? null,
      referrer_name: referrer
        ? `${referrer.firstName ?? ""} ${referrer.lastName ?? ""}`.trim()
        : null,
      referrer_email: referrer?.email ?? null,
      job_id: job?.id ?? null,
      job_title: job?.title ?? null,
      placement_date: payout.placementDate,
      approved_at: payout.approvedAt,
      paid_at: payout.paidAt,
      notes: payout.notes,
      created_at: payout.createdAt,
    })
  );

  const csv = toCsv(rows, [
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
  ]);

  return csvResponse(`ecrn-payouts-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
