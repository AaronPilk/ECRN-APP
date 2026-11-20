import Link from "next/link";
import { DataTable, EmptyState, Pill, fmtDateTime, relTime, tdClass } from "@/components/admin/ui";
import { listRecentlyRouted } from "@/lib/admin/routing";

/** The last 50 hand-offs: who went where, why, and whether a rule or a person did it. */
export async function RecentlyRouted() {
  const events = await listRecentlyRouted(50);

  if (events.length === 0) {
    return (
      <div className="rounded-[16px] border border-ecrn-line bg-white">
        <EmptyState
          title="Nothing routed yet"
          body="As people sign up, apply and get referred, each hand-off is listed here with the reason."
        />
      </div>
    );
  }

  return (
    <DataTable head={["When", "Person", "What", "Went to", "Why", "By"]}>
      {events.map((e) => (
        <tr key={e.id}>
          <td className={`${tdClass} whitespace-nowrap text-ecrn-secondary`} title={fmtDateTime(e.at)}>
            {relTime(e.at)}
          </td>
          <td className={tdClass}>
            {e.candidateId && e.candidateName ? (
              <Link href={`/admin/candidates/${e.candidateId}`} className="whitespace-nowrap font-medium text-ecrn-ink hover:text-ecrn-green-text">
                {e.candidateName}
              </Link>
            ) : (
              <span className="text-ecrn-secondary">No longer in ECRN</span>
            )}
          </td>
          <td className={`${tdClass} text-ecrn-ink`}>{e.what}</td>
          <td className={tdClass}>
            {e.accountManagerName || e.recruiterName ? (
              <>
                <div className="font-medium text-ecrn-ink">{e.accountManagerName ?? "No account manager"}</div>
                <div className="mt-0.5 text-[12.5px] text-ecrn-secondary">{e.recruiterName ?? "No recruiter yet"}</div>
              </>
            ) : (
              <span className="text-ecrn-secondary">Sent back to the queue</span>
            )}
          </td>
          <td className={tdClass}>
            <Pill tone={e.action === "routed" ? "green" : "blue"}>{e.reason}</Pill>
            {e.detail && <div className="mt-1 text-[12.5px] text-ecrn-secondary">{e.detail}</div>}
          </td>
          <td className={`${tdClass} whitespace-nowrap text-ecrn-secondary`}>{e.by}</td>
        </tr>
      ))}
    </DataTable>
  );
}
