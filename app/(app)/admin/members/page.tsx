import Link from "next/link";
import { Download, Search } from "lucide-react";
import { AdminHeader, AdminPage, DataTable, EmptyState, Pill, StatCard, fmtDate, fmtNum, fmtPct, relTime, tdClass } from "@/components/admin/ui";
import { Field, Pagination, Select, fieldClass, linkButtonClass } from "@/components/admin/members/controls";
import { MemberStatusPill } from "@/components/admin/members/pills";
import { requireAdmin } from "@/lib/auth/session";
import { STAFF_ROLE_LABEL, listStaff, staffName } from "@/lib/admin/staff";
import {
  INTENT_LABEL,
  MEMBERS_PAGE_SIZE,
  PLATFORM_LABEL,
  SOURCE_LABEL,
  US_STATES,
  getMemberStats,
  listMembers,
  memberFilterParams,
  memberFiltersActive,
  memberName,
  parseMemberFilters,
} from "@/lib/admin/members";

export const metadata = { title: "Members" };

const BASE = "/admin/members";

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const filters = parseMemberFilters(await searchParams);
  const [stats, result, staff] = await Promise.all([getMemberStats(), listMembers(filters), listStaff()]);
  const { members, total, pastEnd } = result;
  const staffById = new Map(staff.map((s) => [s.id, s]));
  const filtered = memberFiltersActive(filters);
  const params = memberFilterParams(filters);
  const exportHref = `/admin/export/members${params.toString() ? `?${params}` : ""}`;

  return (
    <AdminPage>
      <AdminHeader
        eyebrow="People"
        title="Members"
        subtitle="Everyone with an ECRN account: what they told us, how they got here, and when they were last around."
        actions={
          <a href={exportHref} className={linkButtonClass()}>
            <Download className="h-4 w-4" /> Export CSV
          </a>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Total members" value={fmtNum(stats.total)} href={BASE} />
        <StatCard label="Joined last 7 days" value={fmtNum(stats.joined7d)} tone="green" />
        <StatCard
          label="Finished onboarding"
          value={fmtPct(stats.onboarded, stats.total)}
          hint={`${fmtNum(stats.onboarded)} of ${fmtNum(stats.total)}`}
          href={`${BASE}?onboarding=done`}
        />
        <StatCard
          label="Resume on file"
          value={fmtPct(stats.resumeOnFile, stats.total)}
          hint={`${fmtNum(stats.resumeOnFile)} uploaded or built`}
          href={`${BASE}?resume=yes`}
        />
        <StatCard label="Open to a move" value={fmtNum(stats.openToMove)} hint="Employed, keep confidential" tone="cobalt" />
        <StatCard label="Active last 7 days" value={fmtNum(stats.active7d)} href={`${BASE}?sort=last_seen`} />
      </div>

      <form method="get" action={BASE} className="rounded-[16px] border border-ecrn-line bg-white p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ecrn-secondary" aria-hidden />
            <input
              type="search"
              name="q"
              defaultValue={filters.q}
              placeholder="Search name, email, phone or city"
              aria-label="Search members"
              className={`${fieldClass} pl-9`}
            />
          </div>
          <button type="submit" className={linkButtonClass("dark")}>
            Apply
          </button>
          {(filtered || filters.sort !== "newest") && (
            <Link href={BASE} className={linkButtonClass("ghost")}>
              Clear
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
          <Field label="Here to">
            <Select
              name="intent"
              value={filters.intent}
              placeholder="Anything"
              options={Object.entries(INTENT_LABEL).map(([value, label]) => ({ value, label }))}
            />
          </Field>
          <Field label="Source">
            <Select
              name="source"
              value={filters.source}
              placeholder="Any source"
              options={["recruiter", "member_invite", "organic"].map((value) => ({ value, label: SOURCE_LABEL[value] }))}
            />
          </Field>
          <Field label="Recruiter">
            <Select
              name="recruiter"
              value={filters.recruiter}
              placeholder="Anyone"
              options={[
                { value: "none", label: "No recruiter" },
                ...staff.map((s) => ({
                  value: s.id,
                  label: `${staffName(s)} (${STAFF_ROLE_LABEL[s.staffRole]}${s.isActive ? "" : ", inactive"})`,
                })),
              ]}
            />
          </Field>
          <Field label="Resume">
            <Select
              name="resume"
              value={filters.resume}
              placeholder="Either"
              options={[
                { value: "yes", label: "On file" },
                { value: "no", label: "None" },
              ]}
            />
          </Field>
          <Field label="State">
            <Select name="state" value={filters.state} placeholder="Any state" options={US_STATES.map((s) => ({ value: s, label: s }))} />
          </Field>
          <Field label="Onboarding">
            <Select
              name="onboarding"
              value={filters.onboarding}
              placeholder="Either"
              options={[
                { value: "done", label: "Finished" },
                { value: "not_done", label: "Not finished" },
              ]}
            />
          </Field>
          <Field label="Sort by">
            <Select
              name="sort"
              value={filters.sort}
              options={[
                { value: "newest", label: "Newest" },
                { value: "last_seen", label: "Last seen" },
                { value: "name", label: "Name" },
              ]}
            />
          </Field>
        </div>
      </form>

      {!pastEnd && (
        <p className="text-[13px] text-ecrn-secondary">
          {filtered
            ? `${fmtNum(total)} of ${fmtNum(stats.total)} members match these filters.`
            : `${fmtNum(total)} ${total === 1 ? "member" : "members"}.`}
        </p>
      )}

      <DataTable
        head={["Member", "Phone", "What they do", "Location", "Status", "Resume", "Source", "Platform", "Joined", "Last seen"]}
        empty={
          members.length === 0 ? (
            pastEnd ? (
              <EmptyState
                title="Nothing on this page"
                body="There are fewer members than this page number."
                action={
                  <Link href={`${BASE}${params.toString() ? `?${params}` : ""}`} className={linkButtonClass()}>
                    Back to the first page
                  </Link>
                }
              />
            ) : filtered ? (
              <EmptyState
                title="No members match these filters"
                body="Try a shorter search or remove a filter."
                action={
                  <Link href={BASE} className={linkButtonClass()}>
                    Clear filters
                  </Link>
                }
              />
            ) : (
              <EmptyState title="No members yet" body="People show up here the moment they create an account." />
            )
          ) : undefined
        }
      >
        {members.map((m) => {
          const recruiter = m.recruitedByStaffId ? staffById.get(m.recruitedByStaffId) : undefined;
          const platform = m.lastPlatform ?? m.signupPlatform;
          const built = !m.resumePath && m.resumeBuilder?.generated != null;
          return (
            <tr key={m.id} className="hover:bg-ecrn-paper/60">
              <td className={tdClass}>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Link href={`${BASE}/${m.id}`} className="font-medium text-ecrn-ink hover:text-ecrn-green-text">
                    {memberName(m)}
                  </Link>
                  {!m.isActive && <Pill tone="red">Inactive</Pill>}
                  {!m.onboarded && <Pill tone="amber">Not onboarded</Pill>}
                </div>
                <div className="text-[12.5px] text-ecrn-secondary break-all">{m.email}</div>
              </td>
              <td className={`${tdClass} whitespace-nowrap`}>{m.phone ?? <Dash />}</td>
              <td className={tdClass}>
                {m.discipline ? <div className="text-ecrn-ink">{m.discipline}</div> : !m.yearsExperience && <Dash />}
                {m.yearsExperience && <div className="text-[12.5px] text-ecrn-secondary">{m.yearsExperience} years</div>}
              </td>
              <td className={`${tdClass} whitespace-nowrap`}>{[m.locationCity, m.locationState].filter(Boolean).join(", ") || <Dash />}</td>
              <td className={tdClass}>
                <MemberStatusPill member={m} />
              </td>
              <td className={tdClass}>
                {m.resumePath ? <Pill tone="green">Yes</Pill> : built ? <Pill tone="green">Built in app</Pill> : <span className="text-ecrn-secondary">No</span>}
              </td>
              <td className={tdClass}>
                <div className="text-ecrn-ink whitespace-nowrap">{SOURCE_LABEL[m.signupSource] ?? m.signupSource}</div>
                {m.recruitedByStaffId &&
                  (recruiter ? (
                    <Link href={`/admin/team/${recruiter.id}`} className="text-[12.5px] text-ecrn-green-text hover:underline whitespace-nowrap">
                      {staffName(recruiter)}
                    </Link>
                  ) : (
                    <span className="text-[12.5px] text-ecrn-secondary">Former team member</span>
                  ))}
              </td>
              <td className={tdClass}>{platform ? PLATFORM_LABEL[platform] ?? platform : <Dash />}</td>
              <td className={`${tdClass} whitespace-nowrap`}>{fmtDate(m.createdAt)}</td>
              <td className={`${tdClass} whitespace-nowrap`} title={m.lastSeenAt ?? undefined}>
                {m.lastSeenAt ? relTime(m.lastSeenAt) : <span className="text-ecrn-secondary">Never</span>}
              </td>
            </tr>
          );
        })}
      </DataTable>

      <Pagination basePath={BASE} params={params} page={filters.page} pageSize={MEMBERS_PAGE_SIZE} total={total} noun="members" />
    </AdminPage>
  );
}

function Dash() {
  return <span className="text-ecrn-secondary">—</span>;
}
