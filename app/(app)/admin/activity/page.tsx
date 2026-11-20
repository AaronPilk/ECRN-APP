import Link from "next/link";
import { Download } from "lucide-react";
import { AdminHeader, AdminPage, EmptyState, fmtNum } from "@/components/admin/ui";
import { ActivityTable } from "@/components/admin/members/ActivityTable";
import { Field, Pagination, Select, fieldClass, linkButtonClass } from "@/components/admin/members/controls";
import { ACTIVITY_ACTIONS, ACTIVITY_ENTITY_TYPES, actionLabel, entityLabel } from "@/lib/admin/activity-labels";
import { ACTIVITY_PAGE_SIZE, activityFilterParams, activityFiltersActive, listActivity, parseActivityFilters } from "@/lib/admin/members";
import { requireAdmin } from "@/lib/auth/session";

export const metadata = { title: "Activity" };

const BASE = "/admin/activity";

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const filters = parseActivityFilters(await searchParams);
  const { logs, total, pastEnd, lookups } = await listActivity(filters);
  const filtered = activityFiltersActive(filters);
  const params = activityFilterParams(filters);
  const qs = params.toString();

  // Keep an unfamiliar value from the URL selectable instead of silently dropping it.
  const actions: string[] = [...ACTIVITY_ACTIONS];
  if (filters.action && !actions.includes(filters.action)) actions.push(filters.action);
  const entities: string[] = [...ACTIVITY_ENTITY_TYPES];
  if (filters.entity && !entities.includes(filters.entity)) entities.push(filters.entity);

  return (
    <AdminPage>
      <AdminHeader
        eyebrow="Overview"
        title="Activity"
        subtitle="The full audit trail: every sign-up, referral, application, status change and assignment, newest first."
        actions={
          <a href={`/admin/export/activity${qs ? `?${qs}` : ""}`} className={linkButtonClass()}>
            <Download className="h-4 w-4" /> Export CSV
          </a>
        }
      />

      <form method="get" action={BASE} className="rounded-[16px] border border-ecrn-line bg-white p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 items-end">
          <Field label="What happened">
            <Select
              name="action"
              value={filters.action}
              placeholder="Anything"
              options={actions.map((a) => ({ value: a, label: actionLabel(a) }))}
            />
          </Field>
          <Field label="Record type">
            <Select
              name="entity_type"
              value={filters.entity}
              placeholder="Any record"
              options={entities.map((e) => ({ value: e, label: entityLabel(e) }))}
            />
          </Field>
          <Field label="From">
            <input type="date" name="from" defaultValue={filters.from} max={filters.to || undefined} className={fieldClass} />
          </Field>
          <Field label="To">
            <input type="date" name="to" defaultValue={filters.to} min={filters.from || undefined} className={fieldClass} />
          </Field>
          <Field label="Done by (email)">
            <input type="search" name="actor" defaultValue={filters.actor} placeholder="name@example.com" className={fieldClass} />
          </Field>
          <div className="flex gap-2">
            <button type="submit" className={linkButtonClass("dark")}>
              Apply
            </button>
            {filtered && (
              <Link href={BASE} className={linkButtonClass("ghost")}>
                Clear
              </Link>
            )}
          </div>
        </div>
      </form>

      <p className="text-[13px] text-ecrn-secondary">
        {pastEnd ? "" : `${fmtNum(total)} ${total === 1 ? "entry" : "entries"}${filtered ? (total === 1 ? " matches these filters" : " match these filters") : ""}. `}
        Date filters use UTC.
        {filters.actor ? " Filtering by email hides entries made by the system." : ""}
      </p>

      <ActivityTable
        logs={logs}
        lookups={lookups}
        empty={
          pastEnd ? (
            <EmptyState
              title="Nothing on this page"
              body="There are fewer entries than this page number."
              action={
                <Link href={qs ? `${BASE}?${qs}` : BASE} className={linkButtonClass()}>
                  Back to the first page
                </Link>
              }
            />
          ) : filtered ? (
            <EmptyState
              title="Nothing matches these filters"
              body="Try a wider date range or remove a filter."
              action={
                <Link href={BASE} className={linkButtonClass()}>
                  Clear filters
                </Link>
              }
            />
          ) : (
            <EmptyState title="No activity yet" body="Entries appear as people sign up, refer, apply, and as the team works the pipeline." />
          )
        }
      />

      <Pagination basePath={BASE} params={params} page={filters.page} pageSize={ACTIVITY_PAGE_SIZE} total={total} noun="entries" />
    </AdminPage>
  );
}
