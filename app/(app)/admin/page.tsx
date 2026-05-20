import { Card, CardContent } from "@/components/ui/Card";
import {
  listAllJobs,
  listCandidates,
  listCompanyLeads,
} from "@/lib/data/repository";
import { getCurrentProfile } from "@/lib/auth/mock";
import { redirect } from "next/navigation";

export default async function AdminDashboard() {
  const profile = (await getCurrentProfile())!;
  if (profile.role !== "admin") redirect("/dashboard");

  const candidates = await listCandidates();
  const jobs = await listAllJobs();
  const leads = await listCompanyLeads();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div>
        <p className="text-xs font-medium tracking-[0.18em] uppercase text-slate-500">Admin</p>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-delta-ink">
          Delta Operations
        </h1>
        <p className="mt-1 text-slate-500">
          Network health across candidates, jobs, leads, and payouts.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Candidates" value={candidates.length} />
        <Stat label="Jobs" value={jobs.length} />
        <Stat label="Open jobs" value={jobs.filter((j) => j.status === "open").length} />
        <Stat label="Company leads" value={leads.length} />
      </div>

      <Card>
        <CardContent className="py-6">
          <h2 className="text-lg font-semibold text-delta-ink">Coming online in Batch 4</h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-2xl">
            The full admin dashboard — candidate table, duplicate review queue, job CRUD, company
            leads, payout ledger, activity timeline, and CSV export — lands in Batch 4. The
            foundation, schema, and data layer are already in place; we just need to build the
            views on top.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums text-delta-ink">{value}</div>
    </Card>
  );
}
