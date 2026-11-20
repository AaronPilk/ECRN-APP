import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  AdminHeader,
  AdminPage,
  DataTable,
  EmptyState,
  FilterTabs,
  Notice,
  Pill,
  StatCard,
  fmtDate,
  fmtMoney,
  fmtNum,
  tdClass,
} from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/session";
import { listJobsAdmin, type AdminJobRow } from "@/lib/admin/jobs";
import { listStaff, splitStaff, staffName } from "@/lib/admin/staff";
import { setJobOwnerAction, updateJobStatusAction } from "../actions";
import type { JobStatus } from "@/types";

interface PageProps {
  /** `id` narrows the list to one job (other admin screens link here with it). */
  searchParams: Promise<{ status?: string; owner?: string; q?: string; id?: string; saved?: string }>;
}

const STATUSES: { key: JobStatus; label: string; dot: string }[] = [
  { key: "draft", label: "Draft", dot: "bg-slate-300" },
  { key: "open", label: "Open", dot: "bg-ecrn-green" },
  { key: "paused", label: "Paused", dot: "bg-amber-400" },
  { key: "filled", label: "Filled", dot: "bg-cobalt" },
  { key: "archived", label: "Archived", dot: "bg-slate-300" },
];

const controlClass =
  "h-[34px] rounded-[10px] border border-ecrn-line bg-white text-[13px] text-ecrn-ink focus:outline-none focus:border-ecrn-green focus:ring-2 focus:ring-ecrn-green/20";

/** URL params can repeat; take the first value. */
const first = (v: string | string[] | undefined): string => (Array.isArray(v) ? v[0] : v) ?? "";

function matchesSearch(row: AdminJobRow, q: string): boolean {
  const j = row.job;
  return [j.title, row.clientCompany, j.companyName, j.locationCity, j.locationState, j.trade, j.jobType, j.externalCrmId, row.ownerName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(q);
}

export default async function AdminJobsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const sp = await searchParams;
  const [rows, staff] = await Promise.all([listJobsAdmin(), listStaff()]);
  const { accountManagers } = splitStaff(staff);

  // ── filters (all state lives in the URL) ──
  const statusParam = first(sp.status);
  const status = STATUSES.some((s) => s.key === statusParam) ? (statusParam as JobStatus) : "all";
  const ownerParam = first(sp.owner);
  const owner = ownerParam === "none" || staff.some((s) => s.id === ownerParam) ? ownerParam : "all";
  const qRaw = first(sp.q).trim();
  const q = qRaw.toLowerCase();
  const savedId = first(sp.saved);
  const onlyId = first(sp.id);

  const href = (next: { status?: string; owner?: string; q?: string }) => {
    const merged = { status, owner, q: qRaw, ...next };
    const params = new URLSearchParams();
    if (merged.status && merged.status !== "all") params.set("status", merged.status);
    if (merged.owner && merged.owner !== "all") params.set("owner", merged.owner);
    if (merged.q) params.set("q", merged.q);
    const qs = params.toString();
    return qs ? `/admin/jobs?${qs}` : "/admin/jobs";
  };

  // Tab counts respect the owner filter and search; the status tab then narrows.
  const scoped = rows.filter(
    (r) =>
      (onlyId === "" || r.job.id === onlyId) &&
      (owner === "all" || (owner === "none" ? !r.ownerId : r.ownerId === owner)) &&
      (q === "" || matchesSearch(r, q))
  );
  const visible = status === "all" ? scoped : scoped.filter((r) => r.job.status === status);
  const filtered = status !== "all" || owner !== "all" || q !== "" || onlyId !== "";

  // ── headline numbers (always the whole board) ──
  const countStatus = (s: JobStatus) => rows.filter((r) => r.job.status === s).length;
  const openNoOwner = rows.filter((r) => r.job.status === "open" && !r.ownerId).length;

  // Owner filter options: everyone who can own a job, plus anyone who still owns one.
  const ownerOptions = [...accountManagers];
  for (const r of rows) {
    if (r.ownerId && !ownerOptions.some((s) => s.id === r.ownerId)) {
      const s = staff.find((x) => x.id === r.ownerId);
      if (s) ownerOptions.push(s);
    }
  }

  return (
    <AdminPage>
      <AdminHeader
        eyebrow="Pipeline"
        title="Jobs"
        subtitle="Every job on the board, who owns it, and what has come in. The owner receives the job's applications and referrals."
        actions={
          <Link href="/admin/jobs/new">
            <Button size="sm" variant="primary">
              <Plus className="w-4 h-4" /> New job
            </Button>
          </Link>
        }
      />

      {savedId && <Notice tone="green">Job saved.</Notice>}

      {openNoOwner > 0 && (
        <Notice tone="amber">
          <span className="font-semibold">
            {fmtNum(openNoOwner)} open {openNoOwner === 1 ? "job has" : "jobs have"} no owner.
          </span>{" "}
          Applications to these jobs sit in the routing queue until someone owns them.{" "}
          <Link href="/admin/jobs?status=open&owner=none" className="font-medium underline">
            Show them
          </Link>
          {accountManagers.length === 0 && (
            <>
              {" "}
              or{" "}
              <Link href="/admin/team" className="font-medium underline">
                add your team
              </Link>{" "}
              first.
            </>
          )}
        </Notice>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Open" value={fmtNum(countStatus("open"))} tone="green" href="/admin/jobs?status=open" />
        <StatCard label="Paused" value={fmtNum(countStatus("paused"))} href="/admin/jobs?status=paused" />
        <StatCard label="Filled" value={fmtNum(countStatus("filled"))} tone="cobalt" href="/admin/jobs?status=filled" />
        <StatCard
          label="No owner"
          value={fmtNum(openNoOwner)}
          tone={openNoOwner > 0 ? "amber" : "default"}
          hint="Open jobs without an account manager"
          href="/admin/jobs?status=open&owner=none"
        />
      </div>

      <div className="space-y-3">
        <FilterTabs
          tabs={[
            { label: "All", href: href({ status: "all" }), active: status === "all", count: scoped.length },
            ...STATUSES.map((s) => ({
              label: s.label,
              href: href({ status: s.key }),
              active: status === s.key,
              count: scoped.filter((r) => r.job.status === s.key).length,
            })),
          ]}
        />

        <form method="get" action="/admin/jobs" className="flex flex-wrap items-center gap-2">
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ecrn-secondary" />
            <input
              type="search"
              name="q"
              defaultValue={qRaw}
              placeholder="Search title, client, city, Bullhorn ID"
              aria-label="Search jobs"
              className={`${controlClass} w-full pl-9 pr-3`}
            />
          </div>
          <select name="owner" defaultValue={owner === "all" ? "" : owner} aria-label="Filter by owner" className={`${controlClass} px-2.5`}>
            <option value="">All owners</option>
            <option value="none">No owner</option>
            {ownerOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {staffName(s)}
                {s.isActive ? "" : " (inactive)"}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" variant="secondary">
            Apply
          </Button>
          {filtered && (
            <Link href="/admin/jobs" className="text-[13px] font-medium text-ecrn-secondary hover:text-ecrn-ink px-1">
              Clear
            </Link>
          )}
        </form>
      </div>

      <DataTable
        head={["Job", "Client", "Status", "Owner", "Recruiters", "Applications", "Referrals", "Payout", "Posted", "Bullhorn ID", ""]}
        empty={
          visible.length === 0 ? (
            rows.length === 0 ? (
              <EmptyState
                title="No jobs yet"
                body="Create the first job and give it an account manager. Members see it once its status is Open and Public is on."
                action={
                  <Link href="/admin/jobs/new">
                    <Button size="sm">Create a job</Button>
                  </Link>
                }
              />
            ) : (
              <EmptyState
                title="No jobs match these filters"
                body="Try a different status, owner, or search."
                action={
                  <Link href="/admin/jobs" className="text-[13.5px] font-medium text-ecrn-green-text hover:underline">
                    Clear filters
                  </Link>
                }
              />
            )
          ) : undefined
        }
      >
        {visible.map((row) => {
          const j = row.job;
          const location = [j.locationCity, j.locationState].filter(Boolean).join(", ");
          const client = row.clientCompany ?? j.companyName;
          const dot = STATUSES.find((s) => s.key === j.status)?.dot ?? "bg-slate-300";
          const payout = j.referralPayoutDisplay ?? (j.referralPayoutAmount != null ? fmtMoney(j.referralPayoutAmount) : null);
          return (
            <tr key={j.id} className={j.id === savedId ? "bg-ecrn-action-surface/50" : "hover:bg-ecrn-paper/60"}>
              <td className={`${tdClass} min-w-[220px]`}>
                <Link href={`/admin/jobs/${j.id}/edit`} className="font-medium text-ecrn-ink hover:text-ecrn-green-text">
                  {j.title}
                </Link>
                <div className="mt-0.5 text-[12.5px] text-ecrn-secondary">{location || "No location"}</div>
                {(j.urgency === "critical" || !j.isPublic) && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {j.urgency === "critical" && <Pill tone="red">Urgent</Pill>}
                    {!j.isPublic && <Pill>Hidden from members</Pill>}
                  </div>
                )}
              </td>

              <td className={`${tdClass} min-w-[170px]`}>
                {client ? (
                  <div className="text-ecrn-ink">{client}</div>
                ) : (
                  <div className="text-ecrn-secondary">No client name</div>
                )}
                {!j.isCompanyPublic && (
                  <div className="mt-1">
                    <Pill tone="blue">Confidential</Pill>
                  </div>
                )}
              </td>

              <td className={tdClass}>
                <form action={updateJobStatusAction} className="flex items-center gap-1.5 whitespace-nowrap">
                  <input type="hidden" name="jobId" value={j.id} />
                  <span aria-hidden className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
                  <select
                    name="status"
                    defaultValue={j.status}
                    aria-label={`Status of ${j.title}`}
                    className={`${controlClass} h-8 px-2 text-[12.5px]`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="text-[12.5px] font-medium text-ecrn-secondary hover:text-ecrn-ink">
                    Save
                  </button>
                </form>
              </td>

              <td className={`${tdClass} min-w-[170px]`}>
                {row.ownerId ? (
                  <>
                    <Link href={href({ owner: row.ownerId })} className="text-ecrn-ink hover:text-ecrn-green-text">
                      {row.ownerName ?? "Unknown"}
                    </Link>
                    {!row.ownerIsActive && (
                      <div className="mt-1">
                        <Pill tone="amber">Inactive</Pill>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <Pill tone="amber">No owner</Pill>
                    {accountManagers.length > 0 && (
                      <form action={setJobOwnerAction} className="mt-1.5 flex items-center gap-1.5 whitespace-nowrap">
                        <input type="hidden" name="jobId" value={j.id} />
                        <select
                          name="accountManagerId"
                          defaultValue=""
                          required
                          aria-label={`Owner of ${j.title}`}
                          className={`${controlClass} h-8 px-2 text-[12.5px] max-w-[150px]`}
                        >
                          <option value="" disabled>
                            Assign to…
                          </option>
                          {accountManagers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {staffName(s)}
                            </option>
                          ))}
                        </select>
                        <button type="submit" className="text-[12.5px] font-medium text-ecrn-green-text hover:underline">
                          Assign
                        </button>
                      </form>
                    )}
                  </>
                )}
              </td>

              <td className={`${tdClass} tabular-nums`}>{fmtNum(row.recruiterCount)}</td>
              <td className={`${tdClass} tabular-nums`}>{fmtNum(row.applicationCount)}</td>
              <td className={`${tdClass} tabular-nums`}>{fmtNum(row.jobReferralCount)}</td>
              <td className={`${tdClass} whitespace-nowrap`}>{payout ?? <span className="text-ecrn-secondary">—</span>}</td>
              <td className={`${tdClass} whitespace-nowrap text-ecrn-secondary`}>{fmtDate(j.createdAt)}</td>

              <td className={tdClass}>
                {j.externalCrmId ? (
                  <span
                    title={`Bullhorn job ID ${j.externalCrmId}`}
                    className="inline-block max-w-[130px] truncate rounded-[6px] bg-delta-surface px-2 py-0.5 align-top font-mono text-[11.5px] text-cobalt"
                  >
                    {j.externalCrmId}
                  </span>
                ) : (
                  <span className="text-[12.5px] text-ecrn-secondary whitespace-nowrap">Not set</span>
                )}
              </td>

              <td className={`${tdClass} text-right`}>
                <Link
                  href={`/admin/jobs/${j.id}/edit`}
                  className="text-[13px] font-medium text-ecrn-green-text hover:underline"
                >
                  Edit
                </Link>
              </td>
            </tr>
          );
        })}
      </DataTable>
    </AdminPage>
  );
}
