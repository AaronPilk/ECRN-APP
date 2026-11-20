import Link from "next/link";
import { Download, Search } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { listStaff, staffName } from "@/lib/admin/staff";
import {
  CANDIDATES_PER_PAGE,
  CANDIDATE_SOURCES,
  CANDIDATE_STATUSES,
  firstParam,
  isUuid,
  refName,
  searchCandidatesWithOwners,
} from "@/lib/admin/routing";
import { AdminHeader, AdminPage, DataTable, EmptyState, FilterTabs, Pill, fmtDate, fmtNum, tdClass } from "@/components/admin/ui";
import { ReferralStatusBadge } from "@/components/referrals/StatusBadge";
import { getAssignOptions } from "@/components/admin/assign/AssignControl";
import { StaffNameCell } from "@/components/admin/assign/OwnerCell";
import { Pager } from "@/components/admin/assign/Pager";
import type { CandidateSource, ReferralStatus } from "@/types";

export const metadata = { title: "Candidates" };

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

interface Filters {
  q: string;
  status: ReferralStatus | null;
  source: CandidateSource | null;
  trade: string | null;
  /** Staff id, or "none" for people nobody owns. */
  am: string | null;
  /** Staff id, or "none" for people with no recruiter. */
  rec: string | null;
}

const STATUS_FILTERS: { key: ReferralStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "qualified", label: "Qualified" },
  { key: "interviewing", label: "Interviewing" },
  { key: "placed", label: "Placed" },
  { key: "duplicate_review", label: "Duplicate review" },
];

const SOURCE_FILTERS: { key: CandidateSource | "all"; label: string }[] = [
  { key: "all", label: "All sources" },
  { key: "referred", label: "Referred" },
  { key: "self_signup", label: "Joined app" },
  { key: "direct_application", label: "Direct apply" },
  { key: "company_submission", label: "Company sub" },
  { key: "admin_import", label: "Admin import" },
];

function hrefFor(f: Filters, over: Partial<Filters> & { page?: number } = {}): string {
  const next = { ...f, ...over };
  const p = new URLSearchParams();
  if (next.q) p.set("q", next.q);
  if (next.status) p.set("status", next.status);
  if (next.source) p.set("source", next.source);
  if (next.trade) p.set("trade", next.trade);
  if (next.am) p.set("am", next.am);
  if (next.rec) p.set("rec", next.rec);
  if (over.page && over.page > 1) p.set("page", String(over.page));
  const qs = p.toString();
  return qs ? `/admin/candidates?${qs}` : "/admin/candidates";
}

const fieldClass =
  "h-10 rounded-[12px] border border-ecrn-line bg-white px-3 text-[14px] text-ecrn-ink " +
  "focus:outline-none focus:border-ecrn-green focus:ring-2 focus:ring-ecrn-green/20";

export default async function AdminCandidatesPage({ searchParams }: PageProps) {
  await requireAdmin();
  const sp = await searchParams;

  const statusParam = firstParam(sp.status);
  const sourceParam = firstParam(sp.source);
  const tradeParam = firstParam(sp.trade);
  const amParam = firstParam(sp.am);
  const recParam = firstParam(sp.rec);
  const filters: Filters = {
    q: (firstParam(sp.q) ?? "").trim().slice(0, 100),
    status: CANDIDATE_STATUSES.includes(statusParam as ReferralStatus) ? (statusParam as ReferralStatus) : null,
    source: CANDIDATE_SOURCES.includes(sourceParam as CandidateSource) ? (sourceParam as CandidateSource) : null,
    trade: tradeParam && tradeParam !== "all" ? tradeParam.slice(0, 80) : null,
    am: amParam === "none" || isUuid(amParam) ? amParam : null,
    rec: recParam === "none" || isUuid(recParam) ? recParam : null,
  };
  const pageParam = Number(firstParam(sp.page));

  const [list, options, staff] = await Promise.all([
    searchCandidatesWithOwners({
      search: filters.q,
      status: filters.status ?? undefined,
      source: filters.source ?? undefined,
      trade: filters.trade ?? undefined,
      am: filters.am ?? undefined,
      rec: filters.rec ?? undefined,
      page: Number.isFinite(pageParam) ? pageParam : 1,
    }),
    getAssignOptions(),
    listStaff(),
  ]);

  // Keep a filter on someone who has since gone inactive selectable.
  const pickedManager = filters.am && filters.am !== "none" ? staff.find((s) => s.id === filters.am) : undefined;
  const extraManager = pickedManager && !options.accountManagers.some((m) => m.id === pickedManager.id) ? pickedManager : null;
  const pickedRecruiter = filters.rec && filters.rec !== "none" ? staff.find((s) => s.id === filters.rec) : undefined;
  const extraRecruiter =
    pickedRecruiter && !options.groups.some((g) => g.options.some((o) => o.id === pickedRecruiter.id)) ? pickedRecruiter : null;

  const narrowed = Boolean(filters.q || filters.status || filters.source || filters.trade || filters.am || filters.rec);

  return (
    <AdminPage>
      <AdminHeader
        eyebrow="People"
        title="All candidates"
        subtitle={`${fmtNum(list.total)} candidate${list.total === 1 ? "" : "s"} ${narrowed ? "match these filters" : "in the network"}.`}
        actions={
          <Link
            href="/admin/export/candidates"
            className="inline-flex h-[42px] items-center gap-2 rounded-[12px] border border-ecrn-line bg-white px-4 text-[14px] font-medium text-ecrn-ink hover:bg-ecrn-paper"
          >
            <Download className="h-4 w-4" /> Export CSV
          </Link>
        }
      />

      {/* Search + ownership filters (one form, so they combine) */}
      <form method="get" action="/admin/candidates" className="flex flex-wrap items-center gap-2.5">
        {filters.status && <input type="hidden" name="status" value={filters.status} />}
        {filters.source && <input type="hidden" name="source" value={filters.source} />}
        {filters.trade && <input type="hidden" name="trade" value={filters.trade} />}
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ecrn-secondary" />
          <input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder="Search name, email, phone, title, city…"
            aria-label="Search candidates"
            className={`${fieldClass} w-full pl-9`}
          />
        </div>
        <select name="am" defaultValue={filters.am ?? ""} aria-label="Owner (account manager)" className={`${fieldClass} max-w-full`}>
          <option value="">Any owner</option>
          <option value="none">Unassigned</option>
          {options.accountManagers.map((m) => (
            <option key={m.id} value={m.id}>
              {staffName(m)}
            </option>
          ))}
          {extraManager && <option value={extraManager.id}>{staffName(extraManager)}</option>}
        </select>
        <select name="rec" defaultValue={filters.rec ?? ""} aria-label="Recruiter" className={`${fieldClass} max-w-full`}>
          <option value="">Any recruiter</option>
          <option value="none">No recruiter</option>
          {options.groups.map((g) => (
            <optgroup key={g.key} label={g.label}>
              {g.options.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </optgroup>
          ))}
          {extraRecruiter && <option value={extraRecruiter.id}>{staffName(extraRecruiter)}</option>}
        </select>
        <button
          type="submit"
          className="inline-flex h-10 items-center rounded-[12px] bg-ecrn-black px-4 text-[14px] font-medium text-white hover:bg-ecrn-ink"
        >
          Search
        </button>
        {narrowed && (
          <Link href="/admin/candidates" className="text-[13.5px] font-medium text-ecrn-green-text hover:underline">
            Clear all
          </Link>
        )}
      </form>

      {/* Status and source chips */}
      <div className="space-y-2">
        <FilterTabs
          tabs={STATUS_FILTERS.map((f) => ({
            label: f.label,
            href: hrefFor(filters, { status: f.key === "all" ? null : f.key }),
            active: (filters.status ?? "all") === f.key,
          }))}
        />
        <FilterTabs
          tabs={SOURCE_FILTERS.map((f) => ({
            label: f.label,
            href: hrefFor(filters, { source: f.key === "all" ? null : f.key }),
            active: (filters.source ?? "all") === f.key,
          }))}
        />
      </div>

      {list.rows.length === 0 ? (
        <div className="rounded-[16px] border border-ecrn-line bg-white">
          {narrowed ? (
            <EmptyState
              title="No candidates match these filters"
              body="Try a different search, status, source or owner."
              action={
                <Link href="/admin/candidates" className="text-[13.5px] font-medium text-ecrn-green-text hover:underline">
                  Show all candidates
                </Link>
              }
            />
          ) : (
            <EmptyState
              title="No candidates yet"
              body="People appear here when they join the app, apply to a job, or are referred by a member."
            />
          )}
        </div>
      ) : (
        <DataTable head={["Name", "Status", "Title", "Location", "Referrer", "Owner", "Recruiter", "Added"]}>
          {list.rows.map(({ candidate: c, accountManager, recruiter, referrer }) => (
            <tr key={c.id} className="hover:bg-ecrn-paper/60">
              <td className={tdClass}>
                <Link href={`/admin/candidates/${c.id}`} className="font-medium text-ecrn-ink hover:text-ecrn-green-text">
                  {c.firstName} {c.lastName}
                </Link>
                {c.careerStatus === "open_to_offers" && (
                  <span className="ml-2 align-middle">
                    <Pill tone="blue">Open to move · confidential</Pill>
                  </span>
                )}
                <div className="mt-0.5 text-[12.5px] text-ecrn-secondary">{c.email ?? c.phone ?? "No contact details"}</div>
              </td>
              <td className={tdClass}>
                <ReferralStatusBadge status={c.status} />
              </td>
              <td className={`${tdClass} text-ecrn-ink`}>{c.currentJobTitle ?? <Muted>Not given</Muted>}</td>
              <td className={`${tdClass} text-ecrn-ink`}>
                {[c.locationCity, c.locationState].filter(Boolean).join(", ") || <Muted>Not given</Muted>}
              </td>
              <td className={`${tdClass} text-ecrn-ink`}>
                {referrer ? (
                  referrer.name
                ) : c.sourceType === "direct_application" ? (
                  "Direct"
                ) : c.sourceType === "self_signup" ? (
                  "Joined app"
                ) : (
                  <Muted>None</Muted>
                )}
              </td>
              <td className={tdClass}>
                {accountManager ? (
                  <StaffNameCell name={refName(accountManager)} missing="Unassigned" />
                ) : (
                  <Link href="/admin/routing" title="Open the routing queue">
                    <Pill tone="amber">Unassigned</Pill>
                  </Link>
                )}
              </td>
              <td className={tdClass}>
                <StaffNameCell name={refName(recruiter)} missing="None yet" />
              </td>
              <td className={`${tdClass} whitespace-nowrap text-[12.5px] text-ecrn-secondary`}>{fmtDate(c.createdAt)}</td>
            </tr>
          ))}
        </DataTable>
      )}

      <Pager
        page={list.page}
        pageCount={list.pageCount}
        total={list.total}
        perPage={CANDIDATES_PER_PAGE}
        noun={list.total === 1 ? "candidate" : "candidates"}
        hrefFor={(p) => hrefFor(filters, { page: p })}
      />
    </AdminPage>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return <span className="text-[12.5px] text-ecrn-secondary">{children}</span>;
}
