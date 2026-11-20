import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { AdminHeader, AdminPage, Panel, Pill, fmtDate, fmtDateTime, relTime, titleCase } from "@/components/admin/ui";
import { KeyValues } from "@/components/admin/charts";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { requireAdmin } from "@/lib/auth/session";
import { getCompanyLeadById, listActivityForEntity } from "@/lib/data/repository";
import type { ActivityLog, CompanyLeadStatus } from "@/types";
import { updateCompanyLeadStatusAction } from "../../actions";
import { LEAD_STATUSES, LEAD_STATUS_LABEL, LEAD_STATUS_TONE, URGENCY_LABEL, UrgencyPill } from "../lead-ui";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminCompanyDetail(props: PageProps) {
  await requireAdmin();
  const params = await props.params;

  const lead = await getCompanyLeadById(params.id);
  if (!lead) notFound();

  const activity = await listActivityForEntity("company_lead", lead.id);

  return (
    <AdminPage className="max-w-[1100px]">
      <Link href="/admin/companies" className="inline-flex items-center gap-1 text-[13.5px] font-medium text-ecrn-green-text -ml-1">
        <ChevronLeft className="w-4 h-4" /> All company leads
      </Link>

      <AdminHeader
        eyebrow="Company lead"
        title={lead.companyName}
        subtitle={`Received ${fmtDateTime(lead.createdAt)} from the hiring form`}
        actions={
          <>
            <Pill tone={LEAD_STATUS_TONE[lead.status]}>{LEAD_STATUS_LABEL[lead.status]}</Pill>
            <UrgencyPill urgency={lead.urgency} />
          </>
        }
      />

      <div className="grid lg:grid-cols-3 gap-4 items-start">
        <div className="lg:col-span-2 space-y-4">
          <Panel title="What they need">
            <KeyValues
              rows={[
                { label: "Role", value: lead.roleNeeded ?? "Not specified" },
                { label: "People needed", value: lead.numberOfCandidates != null ? String(lead.numberOfCandidates) : "Not specified" },
                { label: "Location", value: lead.location ?? "Not specified" },
                { label: "Pay range", value: lead.compensationRange ?? "Not specified" },
                { label: "Start date", value: lead.startDate ? fmtDate(lead.startDate) : "Not specified" },
                { label: "Urgency", value: URGENCY_LABEL[lead.urgency] },
              ]}
            />
            {lead.jobDescription && (
              <div className="mt-4">
                <h3 className="t-eyebrow mb-1.5">Job description</h3>
                <p className="text-[14px] text-ecrn-ink whitespace-pre-line leading-relaxed">{lead.jobDescription}</p>
              </div>
            )}
          </Panel>

          <Panel title="Activity" subtitle="Status changes on this lead">
            {activity.length === 0 ? (
              <p className="text-[13.5px] text-ecrn-secondary">
                Nothing yet. Changes you save on this lead are listed here.
              </p>
            ) : (
              <ol className="relative ml-1.5 border-l border-ecrn-line space-y-3.5 pl-5">
                {[...activity].reverse().map((a) => (
                  <li key={a.id} className="relative">
                    <span className="absolute -left-[1.56rem] top-1.5 w-2.5 h-2.5 rounded-full bg-ecrn-green ring-4 ring-white" />
                    <div className="text-[13.5px] font-medium text-ecrn-ink">{describe(a)}</div>
                    <div className="text-[12px] text-ecrn-secondary" title={fmtDateTime(a.createdAt)}>
                      {relTime(a.createdAt)}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="Contact">
            <div className="text-[15px] font-medium text-ecrn-ink">{lead.contactName}</div>
            <div className="mt-1.5 space-y-1 text-[13.5px]">
              <a href={`mailto:${lead.email}`} className="block text-ecrn-green-text hover:underline break-all">
                {lead.email}
              </a>
              {lead.phone ? (
                <a href={`tel:${lead.phone}`} className="block text-ecrn-green-text hover:underline">
                  {lead.phone}
                </a>
              ) : (
                <span className="block text-ecrn-secondary">No phone number given</span>
              )}
            </div>
            {lead.externalCrmId && (
              <p className="mt-3 text-[12px] text-ecrn-secondary">
                CRM record <span className="font-mono text-ecrn-ink">{lead.externalCrmId}</span>
              </p>
            )}
          </Panel>

          <Panel title="Update this lead">
            <form action={updateCompanyLeadStatusAction} className="space-y-3">
              <input type="hidden" name="leadId" value={lead.id} />
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  defaultValue={lead.status}
                  className="w-full h-11 px-3 rounded-[12px] bg-white border border-ecrn-line text-[14.5px] text-ecrn-ink focus:outline-none focus:border-ecrn-green focus:ring-2 focus:ring-ecrn-green/20"
                >
                  {LEAD_STATUSES.map((s: CompanyLeadStatus) => (
                    <option key={s} value={s}>
                      {LEAD_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={5}
                  defaultValue={lead.notes ?? ""}
                  placeholder="Calls, next steps, who is handling it"
                  className="text-[14.5px]"
                />
                <p className="mt-1 text-[12px] text-ecrn-secondary">
                  Saving replaces the notes with what is in this box. Only admins see them.
                </p>
              </div>
              <Button type="submit" variant="dark" size="sm" fullWidth>
                Save
              </Button>
            </form>
          </Panel>
        </div>
      </div>
    </AdminPage>
  );
}

function describe(a: ActivityLog): string {
  if (a.action === "status_changed") {
    const to = typeof a.metadata.to === "string" ? a.metadata.to : null;
    const label = to && to in LEAD_STATUS_LABEL ? LEAD_STATUS_LABEL[to as CompanyLeadStatus] : to ? titleCase(to) : null;
    return label ? `Status set to ${label.toLowerCase()}` : "Status changed";
  }
  if (a.action === "company_lead_submitted" || a.action === "created") return "Lead received";
  const words = a.action.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
