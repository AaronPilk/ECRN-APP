import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/mock";
import { searchCandidates, getProfileById } from "@/lib/data/repository";
import { toCsv, csvResponse } from "@/lib/utils/csv";

export async function GET(): Promise<Response> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const candidates = await searchCandidates({});
  const rows: Record<string, unknown>[] = [];
  for (const c of candidates) {
    const referrer = c.primaryReferrerUserId
      ? await getProfileById(c.primaryReferrerUserId)
      : null;
    rows.push({
      id: c.id,
      first_name: c.firstName,
      last_name: c.lastName,
      email: c.email,
      phone: c.phone,
      location_city: c.locationCity,
      location_state: c.locationState,
      current_job_title: c.currentJobTitle,
      trade: c.trade,
      years_experience: c.yearsExperience,
      linkedin_url: c.linkedinUrl,
      resume_url: c.resumeUrl,
      source_type: c.sourceType,
      status: c.status,
      primary_referrer_id: c.primaryReferrerUserId,
      primary_referrer_email: referrer?.email ?? null,
      primary_referrer_name: referrer
        ? `${referrer.firstName ?? ""} ${referrer.lastName ?? ""}`.trim()
        : null,
      external_crm_id: c.externalCrmId,
      created_at: c.createdAt,
      updated_at: c.updatedAt,
    });
  }

  const csv = toCsv(rows, [
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
  ]);

  return csvResponse(`ecrn-candidates-${stamp()}.csv`, csv);
}

function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}
