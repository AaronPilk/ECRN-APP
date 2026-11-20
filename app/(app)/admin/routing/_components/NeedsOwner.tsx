import Link from "next/link";
import { AssignControl } from "@/components/admin/assign/AssignControl";
import { DataTable, EmptyState, Pill, fmtDateTime, fmtNum, relTime, tdClass } from "@/components/admin/ui";
import { NEEDS_OWNER_LIMIT, SOURCE_LABEL, listNeedsOwner } from "@/lib/admin/routing";

/** People nobody owns yet, with the reason the automatic rules passed them by. */
export async function NeedsOwner({ total, returnTo }: { total: number; returnTo: string }) {
  const rows = await listNeedsOwner();

  if (rows.length === 0) {
    return (
      <div className="rounded-[16px] border border-ecrn-line bg-white">
        <EmptyState
          title="Everyone has an owner"
          body="When someone signs up, applies or is referred and the rules cannot place them, they wait here until you pick an account manager."
        />
      </div>
    );
  }

  const ready = rows.filter((r) => r.reason.ready).length;

  return (
    <div className="space-y-3">
      {ready > 0 && (
        <p className="text-[13px] text-ecrn-secondary">
          {fmtNum(ready)} of these can be placed by the rules now. Use Auto-route everyone to send them on.
        </p>
      )}
      <DataTable head={["Person", "How they arrived", "Role and location", "Why unassigned", "Assign"]}>
        {rows.map((r) => (
          <tr key={r.id}>
            <td className={tdClass}>
              <Link href={`/admin/candidates/${r.id}`} className="whitespace-nowrap font-medium text-ecrn-ink hover:text-ecrn-green-text">
                {r.name}
              </Link>
              <div className="mt-0.5 text-[12.5px] text-ecrn-secondary">{r.email ?? r.phone ?? "No contact details"}</div>
            </td>
            <td className={tdClass}>
              <div className="text-ecrn-ink">
                {SOURCE_LABEL[r.sourceType] ?? r.sourceType}
                {r.referrerName && <span className="text-ecrn-secondary"> by {r.referrerName}</span>}
              </div>
              <div className="mt-0.5 text-[12.5px] text-ecrn-secondary" title={fmtDateTime(r.createdAt)}>
                {relTime(r.createdAt)}
              </div>
              {r.job && (
                <div className="mt-0.5 text-[12.5px] text-ecrn-secondary">
                  {r.job.kind === "applied" ? "Applied to " : "Referred to "}
                  <Link href={`/admin/jobs/${r.job.id}/edit`} className="text-ecrn-green-text hover:underline">
                    {r.job.title}
                  </Link>
                </div>
              )}
            </td>
            <td className={tdClass}>
              <div className="text-ecrn-ink">{r.title ?? r.discipline ?? "Role not given"}</div>
              <div className="mt-0.5 text-[12.5px] text-ecrn-secondary">{r.location ?? "No location"}</div>
            </td>
            <td className={`${tdClass} min-w-[200px] max-w-[300px]`}>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-medium text-ecrn-ink">{r.reason.text}</span>
                {r.reason.ready && <Pill tone="green">Ready to auto-route</Pill>}
              </div>
              {r.reason.detail && <p className="mt-0.5 text-[12.5px] leading-snug text-ecrn-secondary">{r.reason.detail}</p>}
              {r.reason.fix && (
                <Link
                  href={r.reason.fix.href}
                  className="mt-1 inline-block text-[12.5px] font-medium text-ecrn-green-text hover:underline"
                >
                  {r.reason.fix.label}
                </Link>
              )}
            </td>
            <td className={`${tdClass} w-[230px] min-w-[230px]`}>
              <AssignControl entity="candidate" id={r.id} recruiterId={r.recruiterId} returnTo={returnTo} subject={r.name} />
            </td>
          </tr>
        ))}
      </DataTable>
      {total > rows.length && (
        <p className="text-[13px] text-ecrn-secondary">
          Showing the newest {fmtNum(Math.min(rows.length, NEEDS_OWNER_LIMIT))} of {fmtNum(total)}. Assign or auto-route these to
          see the rest.
        </p>
      )}
    </div>
  );
}
