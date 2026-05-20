import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/mock";
import { listCompanyLeads } from "@/lib/data/repository";
import { toCsv, csvResponse } from "@/lib/utils/csv";

export async function GET(): Promise<Response> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = (await listCompanyLeads()).map((l) => ({
    id: l.id,
    company_name: l.companyName,
    contact_name: l.contactName,
    email: l.email,
    phone: l.phone,
    location: l.location,
    role_needed: l.roleNeeded,
    number_of_candidates: l.numberOfCandidates,
    compensation_range: l.compensationRange,
    urgency: l.urgency,
    status: l.status,
    job_description: l.jobDescription,
    notes: l.notes,
    created_at: l.createdAt,
    updated_at: l.updatedAt,
  }));

  const csv = toCsv(rows, [
    "id",
    "company_name",
    "contact_name",
    "email",
    "phone",
    "location",
    "role_needed",
    "number_of_candidates",
    "compensation_range",
    "urgency",
    "status",
    "job_description",
    "notes",
    "created_at",
    "updated_at",
  ]);

  return csvResponse(`ecrn-companies-${new Date().toISOString().slice(0, 10)}.csv`, csv);
}
