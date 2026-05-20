import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PayoutStatusBadge } from "@/components/referrals/StatusBadge";
import { getCurrentProfile } from "@/lib/auth/mock";
import { listAllPayoutsEnriched } from "@/lib/data/repository";
import { updatePayoutStatusAction } from "../actions";
import type { PayoutStatus } from "@/types";
import { Download } from "lucide-react";

interface PageProps {
  searchParams?: { status?: PayoutStatus | "all" };
}

const FILTERS: { key: PayoutStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "paid", label: "Paid" },
  { key: "denied", label: "Denied" },
  { key: "disputed", label: "Disputed" },
];

export default async function AdminPayoutsPage({ searchParams }: PageProps) {
  const profile = (await getCurrentProfile())!;
  if (profile.role !== "admin") redirect("/dashboard");

  const all = await listAllPayoutsEnriched();
  const filter = (searchParams?.status as PayoutStatus | "all") ?? "all";
  const rows = filter === "all" ? all : all.filter((r) => r.payout.status === filter);

  const totals = {
    pending: sum(all, "pending"),
    approved: sum(all, "approved"),
    paid: sum(all, "paid"),
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ecrn-ink">
            Payouts
          </h1>
          <p className="mt-1 text-slate-500">
            {all.length} total · ${(totals.pending / 100).toLocaleString()} pending · $
            {(totals.approved / 100).toLocaleString()} approved · $
            {(totals.paid / 100).toLocaleString()} paid
          </p>
        </div>
        <Link href="/admin/export/payouts">
          <Button variant="secondary" size="sm">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const href = f.key === "all" ? "/admin/payouts" : `/admin/payouts?status=${f.key}`;
          return (
            <Link
              key={f.key}
              href={href}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? "bg-ecrn-black text-white border-ecrn-black"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <Card className="p-10 text-center text-slate-500">No payouts in this view.</Card>
      ) : (
        <div className="space-y-3">
          {rows.map(({ payout, candidate, referrer, job }) => (
            <Card key={payout.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-bold text-ecrn-ink tabular-nums">
                        ${(payout.amountCents / 100).toLocaleString("en-US")}
                      </span>
                      <PayoutStatusBadge status={payout.status} />
                    </div>
                    <p className="mt-1 text-sm text-slate-700">
                      {candidate ? (
                        <Link
                          href={`/admin/candidates/${candidate.id}`}
                          className="text-ecrn-ink hover:text-ecrn-green font-semibold"
                        >
                          {candidate.firstName} {candidate.lastName}
                        </Link>
                      ) : (
                        "Unknown candidate"
                      )}
                      {" · "}
                      Referred by{" "}
                      <span className="text-ecrn-ink">
                        {referrer
                          ? `${referrer.firstName ?? ""} ${referrer.lastName ?? ""}`.trim() ||
                            referrer.email
                          : "Unknown"}
                      </span>
                    </p>
                    {job && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        Role: {job.title} · {job.companyName ?? "—"}
                      </p>
                    )}
                    {payout.notes && (
                      <p className="mt-1 text-xs text-slate-500">{payout.notes}</p>
                    )}
                  </div>
                </div>

                {/* Status changer */}
                <form
                  action={updatePayoutStatusAction}
                  className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2"
                >
                  <input type="hidden" name="payoutId" value={payout.id} />
                  <select
                    name="status"
                    defaultValue={payout.status}
                    className="h-9 px-3 rounded-xl bg-white border border-slate-200 text-xs text-ecrn-ink focus:outline-none focus:border-ecrn-green focus:ring-2 focus:ring-ecrn-green/20"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="paid">Paid</option>
                    <option value="denied">Denied</option>
                    <option value="disputed">Disputed</option>
                  </select>
                  <Input
                    name="notes"
                    placeholder="Optional note (e.g. payment method)"
                    className="sm:flex-1 h-9 text-sm"
                  />
                  <Button type="submit" variant="dark" size="sm">
                    Update
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function sum(
  rows: { payout: { status: PayoutStatus; amountCents: number } }[],
  status: PayoutStatus
): number {
  return rows
    .filter((r) => r.payout.status === status)
    .reduce((acc, r) => acc + r.payout.amountCents, 0);
}
