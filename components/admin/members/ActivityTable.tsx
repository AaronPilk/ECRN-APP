import Link from "next/link";
import { DataTable, Pill, relTime, tdClass } from "@/components/admin/ui";
import { fmtStamp } from "@/components/admin/members/controls";
import { activityEntity, describeActivity, type ActivityLookups } from "@/lib/admin/activity-labels";
import type { ActivityRow } from "@/lib/admin/members";

/**
 * Audit rows as readable sentences: when, who, what happened, and a link to
 * the record. Used by the Activity screen and the member detail screen.
 * `subjectId` is the member whose page we are on, so we don't link them to themselves.
 */
export function ActivityTable({
  logs,
  lookups,
  subjectId,
  empty,
}: {
  logs: ActivityRow[];
  lookups: ActivityLookups;
  subjectId?: string;
  empty?: React.ReactNode;
}) {
  return (
    <DataTable head={["When", "Who", "What happened", "Record"]} empty={logs.length === 0 ? empty : undefined}>
      {logs.map((log) => {
        const entity = activityEntity(log, lookups);
        const isSubject = Boolean(subjectId) && log.entityType === "profile" && log.entityId === subjectId;
        return (
          <tr key={log.id} className="hover:bg-ecrn-paper/60">
            <td className={`${tdClass} whitespace-nowrap`} title={log.createdAt}>
              <div className="text-ecrn-ink">{fmtStamp(log.createdAt)}</div>
              <div className="text-[12px] text-ecrn-secondary">{relTime(log.createdAt)}</div>
            </td>
            <td className={tdClass}>
              {!log.actor ? (
                <span className="text-ecrn-secondary">System</span>
              ) : log.actor.isAdmin ? (
                <span className="inline-flex flex-wrap items-center gap-1.5">
                  <span className="font-medium text-ecrn-ink">{log.actor.name}</span>
                  <Pill tone="dark">Admin</Pill>
                </span>
              ) : log.actor.id === subjectId ? (
                <span className="font-medium text-ecrn-ink">{log.actor.name}</span>
              ) : (
                <Link href={`/admin/members/${log.actor.id}`} className="font-medium text-ecrn-ink hover:text-ecrn-green-text">
                  {log.actor.name}
                </Link>
              )}
              {log.actor?.email && log.actor.email !== log.actor.name && (
                <div className="text-[12px] text-ecrn-secondary break-all">{log.actor.email}</div>
              )}
            </td>
            <td className={`${tdClass} min-w-[240px] text-ecrn-ink`}>{describeActivity(log, lookups)}</td>
            <td className={tdClass}>
              <div className="text-[11.5px] uppercase tracking-wide text-ecrn-secondary">{entity.kind}</div>
              {isSubject ? (
                <span className="text-ecrn-secondary">This member</span>
              ) : entity.href ? (
                <Link href={entity.href} className="font-medium text-ecrn-green-text hover:underline">
                  {entity.name ?? "Open"}
                </Link>
              ) : (
                <span className="text-ecrn-secondary">{entity.name ?? (log.entityType === "profile" ? "Account removed" : "—")}</span>
              )}
            </td>
          </tr>
        );
      })}
    </DataTable>
  );
}
