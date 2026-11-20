import { Fragment } from "react";
import Link from "next/link";
import { AssignControl } from "@/components/admin/assign/AssignControl";
import { DataTable, EmptyState, FilterTabs, fmtDateTime, fmtNum, relTime, tdClass } from "@/components/admin/ui";
import { listNeedsRecruiter } from "@/lib/admin/routing";

/**
 * The account manager's hand-off list: people (and their applications and job
 * referrals) who reached an account manager but have no recruiter yet.
 * One row per person per account manager; one save hands over everything listed.
 */
export async function NeedsRecruiter({ am, returnTo }: { am: string | null; returnTo: string }) {
  const groups = await listNeedsRecruiter();
  const total = groups.reduce((n, g) => n + g.rows.length, 0);

  if (total === 0) {
    return (
      <div className="rounded-[16px] border border-ecrn-line bg-white">
        <EmptyState
          title="No hand-offs waiting"
          body="When an account manager gets someone new, they show here until a recruiter is picked."
        />
      </div>
    );
  }

  const shown = am ? groups.filter((g) => g.accountManagerId === am) : groups;

  return (
    <div className="space-y-4">
      <FilterTabs
        tabs={[
          { label: "All account managers", href: "/admin/routing?tab=recruiter", active: !am, count: total },
          ...groups.map((g) => ({
            label: g.accountManagerName,
            href: `/admin/routing?tab=recruiter&am=${g.accountManagerId}`,
            active: am === g.accountManagerId,
            count: g.rows.length,
          })),
        ]}
      />

      {shown.length === 0 ? (
        <div className="rounded-[16px] border border-ecrn-line bg-white">
          <EmptyState
            title="Nothing waiting for this account manager"
            body="Everyone routed to them already has a recruiter."
            action={
              <Link href="/admin/routing?tab=recruiter" className="text-[13.5px] font-medium text-ecrn-green-text hover:underline">
                Show all account managers
              </Link>
            }
          />
        </div>
      ) : (
        <DataTable head={["Person", "Waiting on a recruiter", "With them since", "Hand to"]}>
          {shown.map((g) => (
            <Fragment key={g.accountManagerId}>
              <tr className="bg-ecrn-paper/70">
                <th colSpan={4} scope="colgroup" className="px-4 py-2.5 text-left font-normal">
                  <span className="font-display text-[14.5px] font-semibold text-ecrn-ink">{g.accountManagerName}</span>
                  <span className="ml-2 text-[12.5px] text-ecrn-secondary">
                    {fmtNum(g.rows.length)} waiting for a recruiter
                  </span>
                </th>
              </tr>
              {g.rows.map((r) => {
                const [first, ...rest] = r.items;
                return (
                  <tr key={r.key}>
                    <td className={tdClass}>
                      <Link
                        href={`/admin/candidates/${r.candidateId}`}
                        className="whitespace-nowrap font-medium text-ecrn-ink hover:text-ecrn-green-text"
                      >
                        {r.name}
                      </Link>
                      <div className="mt-0.5 text-[12.5px] text-ecrn-secondary">
                        {[r.title, r.location].filter(Boolean).join(" · ") || r.email || "No details yet"}
                      </div>
                    </td>
                    <td className={tdClass}>
                      <ul className="space-y-0.5">
                        {r.items.map((item) => (
                          <li key={`${item.entity}:${item.id}`} className="text-ecrn-ink">
                            {item.jobId ? (
                              <Link href={`/admin/jobs/${item.jobId}/edit`} className="hover:text-ecrn-green-text hover:underline">
                                {item.label}
                              </Link>
                            ) : (
                              item.label
                            )}
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className={`${tdClass} whitespace-nowrap text-ecrn-secondary`} title={fmtDateTime(r.since)}>
                      {relTime(r.since)}
                    </td>
                    <td className={`${tdClass} w-[222px]`}>
                      <AssignControl
                        entity={first.entity}
                        id={first.id}
                        also={rest.map((i) => ({ entity: i.entity, id: i.id }))}
                        accountManagerId={g.accountManagerId}
                        returnTo={returnTo}
                        subject={r.name}
                      />
                      {rest.length > 0 && (
                        <p className="mt-1 text-[12px] leading-snug text-ecrn-secondary">
                          One save hands over all {r.items.length} items listed.
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </Fragment>
          ))}
        </DataTable>
      )}
    </div>
  );
}
