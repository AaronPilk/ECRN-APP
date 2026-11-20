import Link from "next/link";
import { Search } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { listStaff, splitStaff, staffName } from "@/lib/admin/staff";
import {
  APPLICATIONS_PER_PAGE,
  APPLICATION_STATUSES,
  firstParam,
  isUuid,
  listApplications,
  refName,
} from "@/lib/admin/routing";
import { APPLICATION_STATUS_LABEL } from "@/lib/data/repository";
import {
  AdminHeader,
  AdminPage,
  DataTable,
  EmptyState,
  FilterTabs,
  Notice,
  Pill,
  fmtDate,
  relTime,
  tdClass,
} from "@/components/admin/ui";
import { ApplicationStatusBadge } from "@/components/referrals/StatusBadge";
import { AssignControl } from "@/components/admin/assign/AssignControl";
import { SubmitButton } from "@/components/admin/assign/AssignClient";
import { AssignResult } from "@/components/admin/assign/AssignResult";
import { OwnerCell } from "@/components/admin/assign/OwnerCell";
import { Pager } from "@/components/admin/assign/Pager";
import { setApplicationStatusAction } from "../routing/actions";
import type { ApplicationStatus } from "@/types";

export const metadata = { title: "Applications" };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

interface Filters {
  q: string;
  status: ApplicationStatus | null;
  am: string | null;
  unassigned: boolean;
}

function hrefFor(f: Filters, over: { status?: ApplicationStatus | null; page?: number } = {}): string {
  const p = new URLSearchParams();
  const status = over.status !== undefined ? over.status : f.status;
  if (f.q) p.set("q", f.q);
  if (status) p.set("status", status);
  if (f.am) p.set("am", f.am);
  if (f.unassigned) p.set("unassigned", "1");
  if (over.page && over.page > 1) p.set("page", String(over.page));
  const qs = p.toString();
  return qs ? `/admin/applications?${qs}` : "/admin/applications";
}

const fieldClass =
  "h-10 rounded-[12px] border border-ecrn-line bg-white px-3 text-[14px] text-ecrn-ink " +
  "focus:outline-none focus:border-ecrn-green focus:ring-2 focus:ring-ecrn-green/20";

/** Every job application: who applied, to what, where it stands, and who has it. */
export default async function AdminApplicationsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const sp = await searchParams;

  const statusParam = firstParam(sp.status);
  const amParam = firstParam(sp.am);
  const filters: Filters = {
    q: (firstParam(sp.q) ?? "").trim().slice(0, 100),
    status: APPLICATION_STATUSES.includes(statusParam as ApplicationStatus) ? (statusParam as ApplicationStatus) : null,
    am: amParam === "none" || isUuid(amParam) ? amParam : null,
    unassigned: firstParam(sp.unassigned) === "1",
  };
  const pageParam = Number(firstParam(sp.page));

  const [list, staff] = await Promise.all([
    listApplications({
      q: filters.q,
      status: filters.status ?? undefined,
      am: filters.am ?? undefined,
      unassigned: filters.unassigned,
      page: Number.isFinite(pageParam) ? pageParam : 1,
    }),
    listStaff(),
  ]);
  const { accountManagers } = splitStaff(staff);
  const filteredManager = filters.am && filters.am !== "none" ? staff.find((s) => s.id === filters.am) : undefined;
  const extraManager = filteredManager && !accountManagers.some((m) => m.id === filteredManager.id) ? filteredManager : null;

  const here = hrefFor(filters, { page: list.page });
  const narrowed = Boolean(filters.q || filters.am || filters.unassigned);

  return (
    <AdminPage>
      <AdminHeader
        eyebrow="Pipeline"
        title="Applications"
        subtitle="Every job application, where it stands, and which account manager and recruiter have it. New applications go to the account manager who owns the job."
        actions={
          <Link
            href="/admin/routing?tab=recruiter"
            className="inline-flex h-[42px] items-center rounded-[12px] border border-ecrn-line bg-white px-4 text-[14px] font-medium text-ecrn-ink hover:bg-ecrn-paper"
          >
            Open routing queue
          </Link>
        }
      />

      <AssignResult assigned={firstParam(sp.assigned)} error={firstParam(sp.error)} />
      {firstParam(sp.updated) === "status" && <Notice tone="green">Status updated.</Notice>}

      <form method="get" action="/admin/applications" className="flex flex-wrap items-center gap-2.5">
        {filters.status && <input type="hidden" name="status" value={filters.status} />}
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ecrn-secondary" />
          <input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder="Search applicant name or email"
            aria-label="Search applicant name or email"
            className={`${fieldClass} w-full pl-9`}
          />
        </div>
        <select name="am" defaultValue={filters.am ?? ""} aria-label="Account manager" className={`${fieldClass} max-w-full`}>
          <option value="">All account managers</option>
          <option value="none">No account manager</option>
          {accountManagers.map((m) => (
            <option key={m.id} value={m.id}>
              {staffName(m)}
            </option>
          ))}
          {extraManager && <option value={extraManager.id}>{staffName(extraManager)}</option>}
        </select>
        <label
          className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-ecrn-line bg-white px-3 text-[14px] text-ecrn-ink"
          title="Missing an account manager or a recruiter"
        >
          <input
            type="checkbox"
            name="unassigned"
            value="1"
            defaultChecked={filters.unassigned}
            className="h-4 w-4 accent-ecrn-green-text"
          />
          Unassigned only
        </label>
        <button
          type="submit"
          className="inline-flex h-10 items-center rounded-[12px] bg-ecrn-black px-4 text-[14px] font-medium text-white hover:bg-ecrn-ink"
        >
          Apply
        </button>
        {narrowed && (
          <Link
            href={hrefFor({ q: "", status: filters.status, am: null, unassigned: false })}
            className="text-[13.5px] font-medium text-ecrn-green-text hover:underline"
          >
            Clear
          </Link>
        )}
      </form>

      <FilterTabs
        tabs={[
          { label: "All", href: hrefFor(filters, { status: null }), active: !filters.status, count: list.countAll },
          ...APPLICATION_STATUSES.map((s) => ({
            label: APPLICATION_STATUS_LABEL[s],
            href: hrefFor(filters, { status: s }),
            active: filters.status === s,
            count: list.counts[s],
          })),
        ]}
      />

      {list.rows.length === 0 ? (
        <div className="rounded-[16px] border border-ecrn-line bg-white">
          {narrowed || filters.status ? (
            <EmptyState
              title="No applications match"
              body="Try another status, or clear the search and filters."
              action={
                <Link href="/admin/applications" className="text-[13.5px] font-medium text-ecrn-green-text hover:underline">
                  Show all applications
                </Link>
              }
            />
          ) : (
            <EmptyState
              title="No applications yet"
              body="When a member applies to a job it lands here, already routed to the account manager who owns that job."
            />
          )}
        </div>
      ) : (
        <DataTable head={["Applicant", "Job", "Applied", "Status", "Owner and recruiter", "Résumé", "Assign"]}>
          {list.rows.map((r) => (
            <tr key={r.id}>
              <td className={tdClass}>
                <Link href={`/admin/candidates/${r.candidateId}`} className="whitespace-nowrap font-medium text-ecrn-ink hover:text-ecrn-green-text">
                  {r.applicantName}
                </Link>
                <div className="mt-0.5 text-[12.5px] text-ecrn-secondary">{r.applicantEmail ?? "No email on file"}</div>
              </td>
              <td className={tdClass}>
                {r.jobId ? (
                  <Link href={`/admin/jobs/${r.jobId}/edit`} className="font-medium text-ecrn-ink hover:text-ecrn-green-text">
                    {r.jobTitle}
                  </Link>
                ) : (
                  <span className="text-ecrn-secondary">{r.jobTitle}</span>
                )}
                <div className="mt-0.5 text-[12.5px] text-ecrn-secondary">{r.jobLocation ?? "No location"}</div>
                {r.jobId && !r.jobHasOwner && (
                  <Link
                    href={`/admin/jobs/${r.jobId}/edit`}
                    className="mt-0.5 inline-block text-[12.5px] font-medium text-amber-800 hover:underline"
                  >
                    This job has no owner
                  </Link>
                )}
              </td>
              <td className={`${tdClass} whitespace-nowrap`}>
                <div className="text-ecrn-ink">{fmtDate(r.createdAt)}</div>
                {relTime(r.createdAt) !== fmtDate(r.createdAt) && (
                  <div className="mt-0.5 text-[12.5px] text-ecrn-secondary">{relTime(r.createdAt)}</div>
                )}
              </td>
              <td className={tdClass}>
                <ApplicationStatusBadge status={r.status} />
                <form key={r.status} action={setApplicationStatusAction} className="mt-1.5 flex items-center gap-1.5">
                  <input type="hidden" name="applicationId" value={r.id} />
                  <input type="hidden" name="returnTo" value={here} />
                  <select
                    name="status"
                    defaultValue={r.status}
                    aria-label={`Status of the application from ${r.applicantName}`}
                    className="h-9 rounded-[10px] border border-ecrn-line bg-white px-2 text-[13px] text-ecrn-ink focus:outline-none focus:border-ecrn-green focus:ring-2 focus:ring-ecrn-green/20"
                  >
                    {APPLICATION_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {APPLICATION_STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                  <SubmitButton
                    pendingLabel="…"
                    className="border border-ecrn-line bg-white px-2.5 text-ecrn-ink hover:bg-ecrn-paper"
                  >
                    Set
                  </SubmitButton>
                </form>
              </td>
              <td className={tdClass}>
                <OwnerCell accountManager={refName(r.accountManager)} recruiter={refName(r.recruiter)} />
              </td>
              <td className={tdClass}>
                {r.resumeUrl ? (
                  <a href={r.resumeUrl} target="_blank" rel="noopener noreferrer" title="Open the résumé link">
                    <Pill tone="green">On file ↗</Pill>
                  </a>
                ) : r.hasResume ? (
                  <Link href={`/admin/candidates/${r.candidateId}`} title="Open it from their candidate page">
                    <Pill tone="green">On file</Pill>
                  </Link>
                ) : (
                  <span className="text-[12.5px] text-ecrn-secondary">None</span>
                )}
              </td>
              <td className={tdClass}>
                <details open={!r.accountManagerId && !r.recruiterId}>
                  <summary className="cursor-pointer list-none whitespace-nowrap text-[13px] font-medium text-ecrn-green-text hover:underline [&::-webkit-details-marker]:hidden">
                    {r.accountManagerId || r.recruiterId ? "Reassign" : "Assign"}
                  </summary>
                  <div className="mt-2">
                    <AssignControl
                      entity="job_application"
                      id={r.id}
                      accountManagerId={r.accountManagerId}
                      recruiterId={r.recruiterId}
                      returnTo={here}
                      subject={`the application from ${r.applicantName}`}
                    />
                  </div>
                </details>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <Pager
        page={list.page}
        pageCount={list.pageCount}
        total={list.total}
        perPage={APPLICATIONS_PER_PAGE}
        noun={list.total === 1 ? "application" : "applications"}
        hrefFor={(p) => hrefFor(filters, { page: p })}
      />
    </AdminPage>
  );
}
