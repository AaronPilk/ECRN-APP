import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { getCurrentProfile } from "@/lib/auth/mock";
import { getCompanyLeadById, listActivityForEntity } from "@/lib/data/repository";
import { updateCompanyLeadStatusAction } from "../../actions";
import type { CompanyLeadStatus } from "@/types";

const STATUS_OPTIONS: { key: CompanyLeadStatus; label: string }[] = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "qualified", label: "Qualified" },
  { key: "engaged", label: "Engaged" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
  { key: "archived", label: "Archived" },
];

interface PageProps {
  params: { id: string };
}

export default async function AdminCompanyDetail({ params }: PageProps) {
  const profile = (await getCurrentProfile())!;
  if (profile.role !== "admin") redirect("/dashboard");

  const lead = await getCompanyLeadById(params.id);
  if (!lead) notFound();

  const activity = await listActivityForEntity("company_lead", lead.id);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <Link href="/admin/companies" className="text-sm text-slate-500 hover:text-ecrn-ink">
        ← All hiring leads
      </Link>

      <Card>
        <CardContent className="py-6">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-ecrn-ink">
                  {lead.companyName}
                </h1>
                <Badge
                  variant={
                    lead.status === "won"
                      ? "green"
                      : lead.status === "lost"
                        ? "red"
                        : lead.status === "new"
                          ? "amber"
                          : "blue"
                  }
                >
                  {lead.status}
                </Badge>
                {lead.urgency !== "normal" && (
                  <Badge variant={lead.urgency === "critical" ? "red" : "amber"}>
                    {lead.urgency}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-slate-600">
                {lead.contactName} · {lead.email}
                {lead.phone && ` · ${lead.phone}`}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Submitted {new Date(lead.createdAt).toLocaleString("en-US")}
              </p>
            </div>
          </div>

          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            <Row label="Role needed" value={lead.roleNeeded ?? "—"} />
            <Row
              label="Candidates needed"
              value={lead.numberOfCandidates?.toString() ?? "—"}
            />
            <Row label="Location" value={lead.location ?? "—"} />
            <Row label="Compensation" value={lead.compensationRange ?? "—"} />
          </div>

          {lead.jobDescription && (
            <div className="mt-5">
              <h2 className="text-xs uppercase tracking-wide text-slate-500 font-medium mb-1.5">
                Job description
              </h2>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {lead.jobDescription}
              </p>
            </div>
          )}

          {lead.notes && (
            <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/60">
              <div className="text-xs uppercase tracking-wide text-slate-500 font-medium">
                Notes
              </div>
              <p className="mt-1.5 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {lead.notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status changer */}
      <Card>
        <CardContent className="py-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Update status
          </h2>
          <form
            action={updateCompanyLeadStatusAction}
            className="space-y-3"
          >
            <input type="hidden" name="leadId" value={lead.id} />
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={lead.status}
                className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200 text-[15px] text-ecrn-ink focus:outline-none focus:border-ecrn-green focus:ring-2 focus:ring-ecrn-green/20"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="notes">Notes (replaces existing notes)</Label>
              <Textarea id="notes" name="notes" rows={3} defaultValue={lead.notes ?? ""} />
            </div>
            <Button type="submit" variant="dark" size="md">
              Save
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Activity */}
      <Card>
        <CardContent className="py-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Activity
          </h2>
          {activity.length === 0 ? (
            <p className="text-sm text-slate-500">No activity yet.</p>
          ) : (
            <ol className="relative border-l border-slate-200 ml-2 space-y-3 pl-5">
              {activity.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[1.45rem] top-1.5 w-2.5 h-2.5 rounded-full bg-ecrn-green ring-4 ring-white" />
                  <div className="text-sm font-medium text-ecrn-ink">
                    {a.action.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {new Date(a.createdAt).toLocaleString("en-US")}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60">
      <div className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">{label}</div>
      <div className="mt-1 text-sm font-medium text-ecrn-ink">{value}</div>
    </div>
  );
}
