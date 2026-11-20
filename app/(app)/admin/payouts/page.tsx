import Link from "next/link";
import { Download } from "lucide-react";
import {
  AdminHeader,
  AdminPage,
  DataTable,
  EmptyState,
  FilterTabs,
  Panel,
  Pill,
  StatCard,
  fmtDate,
  fmtMoney,
  fmtNum,
  tdClass,
} from "@/components/admin/ui";
import { Donut, KeyValues } from "@/components/admin/charts";
import { Button } from "@/components/ui/Button";
import { PayoutStatusBadge } from "@/components/referrals/StatusBadge";
import { requireAdmin } from "@/lib/auth/session";
import { listAllPayoutsEnriched, PAYOUT_STATUS_LABEL, type AdminPayoutEnriched } from "@/lib/data/repository";
import type { PayoutStatus, Profile } from "@/types";
import { updatePayoutStatusAction } from "../actions";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

const STATUSES: PayoutStatus[] = ["pending", "approved", "paid", "denied", "disputed"];

const STATUS_COLOR: Record<PayoutStatus, string> = {
  pending: "#F59E0B",
  approved: "#0655CE",
  paid: "#16C172",
  denied: "#EF4444",
  disputed: "#94A3B8",
};

const fieldClass =
  "h-9 rounded-[10px] bg-white border border-ecrn-line text-[13px] text-ecrn-ink placeholder:text-ecrn-secondary/60 focus:outline-none focus:border-ecrn-green focus:ring-2 focus:ring-ecrn-green/20";

const cents = (rows: AdminPayoutEnriched[]) => rows.reduce((n, r) => n + r.payout.amountCents, 0);

function memberName(p: Profile | null): string {
  if (!p) return "Unknown member";
  return `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || p.email;
}

export default async function AdminPayoutsPage(props: PageProps) {
  await requireAdmin();
  const sp = await props.searchParams;
  const all = await listAllPayoutsEnriched();

  const filter: PayoutStatus | "all" = STATUSES.includes(sp.status as PayoutStatus) ? (sp.status as PayoutStatus) : "all";
  const rows = filter === "all" ? all : all.filter((r) => r.payout.status === filter);

  const by = Object.fromEntries(STATUSES.map((s) => [s, all.filter((r) => r.payout.status === s)])) as Record<
    PayoutStatus,
    AdminPayoutEnriched[]
  >;

  const now = new Date();
  const monthStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  const monthName = now.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
  const paidThisMonth = by.paid.filter((r) => new Date(r.payout.paidAt ?? r.payout.updatedAt).getTime() >= monthStart);
  const needsAmount = all.filter(
    (r) => r.payout.amountCents === 0 && (r.payout.status === "pending" || r.payout.status === "approved")
  ).length;

  return (
    <AdminPage>
      <AdminHeader
        eyebrow="Pipeline"
        title="Payouts"
        subtitle="Referral rewards owed to members. A payout is created when a referred person is placed; approve it, then mark it paid once the money has gone out."
        actions={
          <a
            href="/admin/export/payouts"
            className="inline-flex items-center gap-2 h-9 px-3.5 rounded-[12px] border border-ecrn-line bg-white text-sm font-medium text-ecrn-ink hover:bg-ecrn-paper"
          >
            <Download className="w-4 h-4" /> Export CSV
          </a>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Pending"
          value={fmtMoney(cents(by.pending))}
          hint={`${fmtNum(by.pending.length)} waiting for approval`}
          tone={by.pending.length > 0 ? "amber" : "default"}
          href="/admin/payouts?status=pending"
        />
        <StatCard
          label="Approved"
          value={fmtMoney(cents(by.approved))}
          hint={`${fmtNum(by.approved.length)} ready to pay`}
          tone="cobalt"
          href="/admin/payouts?status=approved"
        />
        <StatCard
          label="Paid this month"
          value={fmtMoney(cents(paidThisMonth))}
          hint={`${fmtNum(paidThisMonth.length)} paid in ${monthName}`}
          tone="green"
        />
        <StatCard
          label="Lifetime paid"
          value={fmtMoney(cents(by.paid))}
          hint={`${fmtNum(by.paid.length)} ${by.paid.length === 1 ? "payout" : "payouts"} in total`}
          href="/admin/payouts?status=paid"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Panel title="Payouts by status" subtitle="Number of payouts in each state">
          <Donut
            data={STATUSES.map((s) => ({ label: PAYOUT_STATUS_LABEL[s], value: by[s].length, color: STATUS_COLOR[s] }))}
            centerLabel={all.length === 1 ? "payout" : "payouts"}
            emptyLabel="No payouts yet. The first one appears when a referred person is placed."
          />
        </Panel>
        <Panel title="Amounts" subtitle="Dollar totals in each state">
          <KeyValues
            rows={[
              ...STATUSES.map((s) => ({ label: PAYOUT_STATUS_LABEL[s], value: fmtMoney(cents(by[s])) })),
              { label: "Still owed (pending + approved)", value: fmtMoney(cents(by.pending) + cents(by.approved)) },
            ]}
          />
          {needsAmount > 0 && (
            <p className="mt-3 text-[12.5px] text-amber-800">
              {needsAmount === 1 ? "1 open payout has" : `${fmtNum(needsAmount)} open payouts have`} no amount yet. Set it in the list below.
            </p>
          )}
        </Panel>
      </div>

      <FilterTabs
        tabs={[
          { label: "All", href: "/admin/payouts", active: filter === "all", count: all.length },
          ...STATUSES.map((s) => ({
            label: PAYOUT_STATUS_LABEL[s],
            href: `/admin/payouts?status=${s}`,
            active: filter === s,
            count: by[s].length,
          })),
        ]}
      />

      <DataTable
        head={["Amount", "Status", "Candidate", "Referred by", "Role", "Dates", "Update"]}
        empty={
          rows.length === 0 ? (
            all.length === 0 ? (
              <EmptyState
                title="No payouts yet"
                body="When a referred person is marked placed, a pending payout is created here for the member who referred them."
              />
            ) : (
              <EmptyState
                title="Nothing in this view"
                body={`No payout is ${PAYOUT_STATUS_LABEL[filter as PayoutStatus].toLowerCase()} right now.`}
                action={
                  <Link href="/admin/payouts" className="text-[13.5px] font-medium text-ecrn-green-text hover:underline">
                    Show all payouts
                  </Link>
                }
              />
            )
          ) : undefined
        }
      >
        {rows.map(({ payout, candidate, referrer, job }) => (
          <tr key={payout.id} className="hover:bg-ecrn-paper/60">
            <td className={tdClass}>
              <div className="font-display text-[17px] font-semibold tabular-nums text-ecrn-ink">{fmtMoney(payout.amountCents)}</div>
              {payout.amountCents === 0 && (payout.status === "pending" || payout.status === "approved") && (
                <div className="mt-1">
                  <Pill tone="amber">Amount not set</Pill>
                </div>
              )}
            </td>
            <td className={tdClass}>
              <PayoutStatusBadge status={payout.status} />
            </td>
            <td className={tdClass}>
              {candidate ? (
                <Link href={`/admin/candidates/${candidate.id}`} className="font-medium text-ecrn-ink hover:text-ecrn-green-text">
                  {candidate.firstName} {candidate.lastName}
                </Link>
              ) : (
                <span className="text-ecrn-secondary">Unknown candidate</span>
              )}
              {payout.notes && <div className="mt-0.5 text-[12px] text-ecrn-secondary max-w-[260px]">{payout.notes}</div>}
            </td>
            <td className={tdClass}>
              <div className="text-ecrn-ink">{memberName(referrer)}</div>
              {referrer?.email && memberName(referrer) !== referrer.email && (
                <div className="text-[12px] text-ecrn-secondary truncate max-w-[220px]">{referrer.email}</div>
              )}
            </td>
            <td className={tdClass}>
              {job ? (
                <>
                  <Link href={`/admin/jobs/${job.id}/edit`} className="text-ecrn-ink hover:text-ecrn-green-text">
                    {job.title}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12px] text-ecrn-secondary">
                    <span>{job.companyName ?? "No client on file"}</span>
                    {job.companyName && !job.isCompanyPublic && <Pill>Confidential</Pill>}
                  </div>
                </>
              ) : (
                <span className="text-ecrn-secondary/70">No role linked</span>
              )}
            </td>
            <td className={`${tdClass} whitespace-nowrap text-[12.5px] text-ecrn-secondary`}>
              <div>Placed {fmtDate(payout.placementDate ?? payout.createdAt)}</div>
              {payout.approvedAt && <div>Approved {fmtDate(payout.approvedAt)}</div>}
              {payout.paidAt && <div>Paid {fmtDate(payout.paidAt)}</div>}
            </td>
            <td className={tdClass}>
              <form action={updatePayoutStatusAction} className="flex flex-wrap items-center gap-2 min-w-[300px]">
                <input type="hidden" name="payoutId" value={payout.id} />
                <select
                  name="status"
                  defaultValue={payout.status}
                  aria-label="Payout status"
                  className={`${fieldClass} px-2.5`}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {PAYOUT_STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
                <div className="relative w-[112px]">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[13px] text-ecrn-secondary">$</span>
                  <input
                    name="amountDollars"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    defaultValue={payout.amountCents / 100}
                    aria-label="Payout amount in dollars"
                    className={`${fieldClass} w-full pl-6 pr-2 tabular-nums`}
                  />
                </div>
                <input
                  name="notes"
                  placeholder="Note, e.g. how it was paid"
                  aria-label="Note"
                  className={`${fieldClass} flex-1 min-w-[150px] px-2.5`}
                />
                <Button type="submit" variant="dark" size="sm">
                  Update
                </Button>
              </form>
            </td>
          </tr>
        ))}
      </DataTable>

      <p className="text-[12.5px] text-ecrn-secondary">
        Update saves the status and the amount together. A new note replaces the one shown under the candidate; leave it blank to keep the current note. The member who referred the person sees the amount, status and note on their Earnings screen.
      </p>
    </AdminPage>
  );
}
