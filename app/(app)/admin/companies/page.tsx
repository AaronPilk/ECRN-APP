import Link from "next/link";
import { Download } from "lucide-react";
import {
  AdminHeader,
  AdminPage,
  DataTable,
  EmptyState,
  FilterTabs,
  Pill,
  StatCard,
  fmtDate,
  fmtNum,
  fmtPct,
  relTime,
  tdClass,
} from "@/components/admin/ui";
import { requireAdmin } from "@/lib/auth/session";
import { listCompanyLeads } from "@/lib/data/repository";
import type { CompanyLeadStatus } from "@/types";
import { LEAD_STATUSES, LEAD_STATUS_LABEL, LEAD_STATUS_TONE, UrgencyPill } from "./lead-ui";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

/** Statuses that get a headline card (archived leads stay in the filter row). */
const CARD_STATUSES: CompanyLeadStatus[] = ["new", "contacted", "qualified", "engaged", "won", "lost"];

const CARD_HINT: Record<CompanyLeadStatus, string> = {
  new: "Not contacted yet",
  contacted: "Waiting on a reply",
  qualified: "A real need, confirmed",
  engaged: "Working the search",
  won: "Signed as a client",
  lost: "Did not move forward",
  archived: "Filed away",
};

export default async function AdminCompaniesPage(props: PageProps) {
  await requireAdmin();
  const sp = await props.searchParams;
  const all = await listCompanyLeads();

  const filter: CompanyLeadStatus | "all" = LEAD_STATUSES.includes(sp.status as CompanyLeadStatus)
    ? (sp.status as CompanyLeadStatus)
    : "all";
  const leads = filter === "all" ? all : all.filter((l) => l.status === filter);

  const count = (s: CompanyLeadStatus) => all.filter((l) => l.status === s).length;
  const won = count("won");
  const lost = count("lost");

  return (
    <AdminPage>
      <AdminHeader
        eyebrow="Pipeline"
        title="Company leads"
        subtitle="Companies that asked Delta for help hiring through the public hiring form. Work each one from new to won."
        actions={
          <a
            href="/admin/export/companies"
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-[12px] border border-ecrn-line bg-white text-sm font-medium text-ecrn-ink hover:bg-ecrn-paper"
          >
            <Download className="w-4 h-4" /> Export CSV
          </a>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {CARD_STATUSES.map((s) => {
          const n = count(s);
          return (
            <StatCard
              key={s}
              label={LEAD_STATUS_LABEL[s]}
              value={fmtNum(n)}
              hint={s === "won" && won + lost > 0 ? `${fmtPct(won, won + lost)} of closed leads` : CARD_HINT[s]}
              tone={s === "new" && n > 0 ? "amber" : s === "won" ? "green" : "default"}
              href={`/admin/companies?status=${s}`}
            />
          );
        })}
      </div>

      <FilterTabs
        tabs={[
          { label: "All", href: "/admin/companies", active: filter === "all", count: all.length },
          ...LEAD_STATUSES.map((s) => ({
            label: LEAD_STATUS_LABEL[s],
            href: `/admin/companies?status=${s}`,
            active: filter === s,
            count: count(s),
          })),
        ]}
      />

      <DataTable
        head={["Company", "Contact", "Hiring need", "Location", "Status", "Received", ""]}
        empty={
          leads.length === 0 ? (
            all.length === 0 ? (
              <EmptyState
                title="No company leads yet"
                body={
                  <>
                    When a company fills in the hiring form at{" "}
                    <Link href="/hire" className="font-medium text-ecrn-green-text hover:underline">
                      /hire
                    </Link>
                    , it lands here as a new lead.
                  </>
                }
              />
            ) : (
              <EmptyState
                title="Nothing in this view"
                body={`No lead is marked ${LEAD_STATUS_LABEL[filter as CompanyLeadStatus].toLowerCase()} right now.`}
                action={
                  <Link href="/admin/companies" className="text-[13.5px] font-medium text-ecrn-green-text hover:underline">
                    Show all leads
                  </Link>
                }
              />
            )
          ) : undefined
        }
      >
        {leads.map((l) => {
          const need = [
            l.roleNeeded,
            l.numberOfCandidates ? `${l.numberOfCandidates} needed` : null,
            l.compensationRange,
          ].filter(Boolean);
          return (
            <tr key={l.id} className="hover:bg-ecrn-paper/60">
              <td className={tdClass}>
                <Link href={`/admin/companies/${l.id}`} className="font-medium text-ecrn-ink hover:text-ecrn-green-text">
                  {l.companyName}
                </Link>
                {l.urgency !== "normal" && (
                  <div className="mt-1">
                    <UrgencyPill urgency={l.urgency} />
                  </div>
                )}
              </td>
              <td className={tdClass}>
                <div className="text-ecrn-ink">{l.contactName}</div>
                <div className="text-[12px] text-ecrn-secondary truncate max-w-[240px]">
                  {[l.email, l.phone].filter(Boolean).join(" · ")}
                </div>
              </td>
              <td className={tdClass}>
                <div className="max-w-[300px] text-ecrn-ink">{need.length ? need.join(" · ") : <span className="text-ecrn-secondary/70">Not specified</span>}</div>
              </td>
              <td className={`${tdClass} text-ecrn-secondary`}>{l.location ?? "—"}</td>
              <td className={tdClass}>
                <Pill tone={LEAD_STATUS_TONE[l.status]}>{LEAD_STATUS_LABEL[l.status]}</Pill>
              </td>
              <td className={`${tdClass} whitespace-nowrap text-ecrn-secondary`} title={fmtDate(l.createdAt)}>
                {relTime(l.createdAt)}
              </td>
              <td className={`${tdClass} whitespace-nowrap text-right`}>
                <Link href={`/admin/companies/${l.id}`} className="text-[13px] font-medium text-ecrn-green-text hover:underline">
                  Open
                </Link>
              </td>
            </tr>
          );
        })}
      </DataTable>
    </AdminPage>
  );
}
