import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getCurrentProfile } from "@/lib/auth/mock";
import { listAllJobs } from "@/lib/data/repository";
import { Plus, Download } from "lucide-react";
import { updateJobStatusAction } from "../actions";
import type { JobStatus } from "@/types";

interface PageProps {
  searchParams?: { status?: JobStatus | "all"; saved?: string };
}

const STATUS_FILTERS: { key: JobStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "open", label: "Open" },
  { key: "paused", label: "Paused" },
  { key: "filled", label: "Filled" },
  { key: "archived", label: "Archived" },
];

const STATUS_VARIANT: Record<JobStatus, "neutral" | "blue" | "green" | "amber" | "red" | "dark"> = {
  draft: "neutral",
  open: "green",
  paused: "amber",
  filled: "blue",
  archived: "neutral",
};

export default async function AdminJobsPage({ searchParams }: PageProps) {
  const profile = (await getCurrentProfile())!;
  if (profile.role !== "admin") redirect("/dashboard");

  const all = await listAllJobs();
  const filter = (searchParams?.status as JobStatus | "all") ?? "all";
  const jobs = filter === "all" ? all : all.filter((j) => j.status === filter);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      {searchParams?.saved && (
        <div className="p-3 rounded-xl text-sm bg-emerald-50 border border-emerald-200/60 text-emerald-900">
          Job saved.
        </div>
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ecrn-ink">
            Jobs
          </h1>
          <p className="mt-1 text-slate-500">
            {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
            {filter !== "all" && ` in "${filter}"`}.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/jobs/new">
            <Button size="sm" variant="primary">
              <Plus className="w-4 h-4" /> New job
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
        {STATUS_FILTERS.map((f) => {
          const active = filter === f.key;
          const href = f.key === "all" ? "/admin/jobs" : `/admin/jobs?status=${f.key}`;
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

      {jobs.length === 0 ? (
        <Card className="p-10 text-center text-slate-500">
          No jobs in this view.{" "}
          <Link href="/admin/jobs/new" className="text-ecrn-green hover:underline">
            Create one →
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => (
            <Card key={j.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/admin/jobs/${j.id}/edit`}
                        className="text-[15px] font-semibold text-ecrn-ink hover:text-ecrn-green"
                      >
                        {j.title}
                      </Link>
                      <Badge variant={STATUS_VARIANT[j.status]}>{j.status}</Badge>
                      {j.isPublic && j.status === "open" && (
                        <span className="text-[10px] uppercase tracking-wide text-emerald-700 font-semibold">
                          Public
                        </span>
                      )}
                      {j.urgency === "critical" && <Badge variant="red">Urgent</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {j.companyName ?? "Confidential client"} ·{" "}
                      {[j.locationCity, j.locationState].filter(Boolean).join(", ")} ·{" "}
                      {j.compensationDisplay ?? "—"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Payout: {j.referralPayoutDisplay ?? "—"} · Created{" "}
                      {j.createdAt.slice(0, 10)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <form action={updateJobStatusAction}>
                      <input type="hidden" name="jobId" value={j.id} />
                      <select
                        name="status"
                        defaultValue={j.status}
                        className="h-9 px-3 rounded-xl bg-white border border-slate-200 text-xs text-ecrn-ink focus:outline-none focus:border-ecrn-green focus:ring-2 focus:ring-ecrn-green/20"
                        // submit on change
                        onChange={undefined}
                      >
                        <option value="draft">Draft</option>
                        <option value="open">Open</option>
                        <option value="paused">Paused</option>
                        <option value="filled">Filled</option>
                        <option value="archived">Archived</option>
                      </select>
                      <button type="submit" className="ml-1 text-xs text-slate-500 hover:text-ecrn-ink">
                        Save
                      </button>
                    </form>
                    <Link href={`/admin/jobs/${j.id}/edit`}>
                      <Button size="sm" variant="secondary">
                        Edit
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
