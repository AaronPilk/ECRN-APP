import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getCurrentProfile } from "@/lib/auth/mock";
import { listCompanyLeads } from "@/lib/data/repository";
import type { CompanyLeadStatus } from "@/types";
import { Download } from "lucide-react";

interface PageProps {
  searchParams?: { status?: CompanyLeadStatus | "all" };
}

const FILTERS: { key: CompanyLeadStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "qualified", label: "Qualified" },
  { key: "engaged", label: "Engaged" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
];

const STATUS_VARIANT: Record<CompanyLeadStatus, "neutral" | "blue" | "green" | "amber" | "red" | "dark"> = {
  new: "amber",
  contacted: "blue",
  qualified: "blue",
  engaged: "blue",
  won: "green",
  lost: "red",
  archived: "neutral",
};

export default async function AdminCompaniesPage({ searchParams }: PageProps) {
  const profile = (await getCurrentProfile())!;
  if (profile.role !== "admin") redirect("/dashboard");

  const all = await listCompanyLeads();
  const filter = (searchParams?.status as CompanyLeadStatus | "all") ?? "all";
  const leads = filter === "all" ? all : all.filter((l) => l.status === filter);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ecrn-ink">
            Company hiring leads
          </h1>
          <p className="mt-1 text-slate-500">
            {leads.length} lead{leads.length === 1 ? "" : "s"}
            {filter !== "all" && ` in "${filter}"`}.
          </p>
        </div>
        <Link href="/admin/export/companies">
          <Button variant="secondary" size="sm">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const href = f.key === "all" ? "/admin/companies" : `/admin/companies?status=${f.key}`;
          return (
            <Link
              key={f.key}
              href={href}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? "bg-ecrn-black text-white border-ecrn-black"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {leads.length === 0 ? (
        <Card className="p-10 text-center text-slate-500">
          No hiring leads in this view. New submissions from{" "}
          <Link href="/hire" className="text-ecrn-green hover:underline">
            /hire
          </Link>{" "}
          appear here.
        </Card>
      ) : (
        <div className="space-y-3">
          {leads.map((l) => (
            <Link key={l.id} href={`/admin/companies/${l.id}`}>
              <Card className="hover:shadow-float hover:border-ecrn-green/40 transition-all">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[15px] font-semibold text-ecrn-ink">
                          {l.companyName}
                        </h3>
                        <Badge variant={STATUS_VARIANT[l.status]}>{l.status}</Badge>
                        {l.urgency === "critical" && <Badge variant="red">Urgent</Badge>}
                        {l.urgency === "high" && <Badge variant="amber">High</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        {l.contactName} · {l.email}
                        {l.phone && ` · ${l.phone}`}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {l.roleNeeded ?? "—"}
                        {l.numberOfCandidates && ` · ${l.numberOfCandidates} needed`}
                        {l.compensationRange && ` · ${l.compensationRange}`}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Submitted {l.createdAt.slice(0, 10)}
                      </p>
                    </div>
                    <div className="text-slate-300 text-lg shrink-0">›</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
