import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/mock";
import { listAllProfiles } from "@/lib/data/repository";
import { toCsv, csvResponse } from "@/lib/utils/csv";

export async function GET(): Promise<Response> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = (await listAllProfiles()).map((p) => ({
    id: p.id,
    first_name: p.firstName,
    last_name: p.lastName,
    email: p.email,
    phone: p.phone,
    role: p.role,
    location_city: p.locationCity,
    location_state: p.locationState,
    linkedin_url: p.linkedinUrl,
    company_name: p.companyName,
    external_crm_id: p.externalCrmId,
    is_active: p.isActive,
    created_at: p.createdAt,
  }));

  const csv = toCsv(rows, [
    "id",
    "first_name",
    "last_name",
    "email",
    "phone",
    "role",
    "location_city",
    "location_state",
    "linkedin_url",
    "company_name",
    "external_crm_id",
    "is_active",
    "created_at",
  ]);

  return csvResponse(`ecrn-users-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
