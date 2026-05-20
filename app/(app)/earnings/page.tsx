import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PayoutStatusBadge } from "@/components/referrals/StatusBadge";
import { getCurrentProfile } from "@/lib/auth/mock";
import { listPayoutsByReferrerEnriched } from "@/lib/data/repository";
import { DollarSign, Clock, CheckCircle2 } from "lucide-react";

export default async function EarningsPage() {
  const profile = (await getCurrentProfile())!;
  const payouts = await listPayoutsByReferrerEnriched(profile.id);

  const pending = payouts.filter((p) => p.payout.status === "pending");
  const approved = payouts.filter((p) => p.payout.status === "approved");
  const paid = payouts.filter((p) => p.payout.status === "paid");
  const denied = payouts.filter(
    (p) => p.payout.status === "denied" || p.payout.status === "disputed"
  );

  const totalPending = sum(pending.map((p) => p.payout.amountCents));
  const totalApproved = sum(approved.map((p) => p.payout.amountCents));
  const totalPaid = sum(paid.map((p) => p.payout.amountCents));
  const lifetimeEarned = totalApproved + totalPaid;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ecrn-ink">
          Earnings
        </h1>
        <p className="mt-1 text-slate-500">
          Track every referral payout from placement to your bank.
        </p>
      </div>

      {/* Hero stat */}
      <Card className="bg-ecrn-black text-white border-ecrn-black p-6">
        <div className="text-xs uppercase tracking-[0.18em] text-ecrn-green font-semibold">
          Lifetime earned
        </div>
        <div className="mt-2 text-5xl font-bold tabular-nums">
          {formatMoney(lifetimeEarned)}
        </div>
        <div className="mt-1 text-sm text-white/60">
          {paid.length + approved.length} placement{paid.length + approved.length === 1 ? "" : "s"} ·{" "}
          {formatMoney(totalPaid)} paid · {formatMoney(totalApproved)} approved
        </div>
      </Card>

      {/* Status breakdown */}
      <div className="grid sm:grid-cols-3 gap-3">
        <StatusCard
          icon={<Clock className="w-5 h-5" />}
          label="Pending"
          amount={totalPending}
          count={pending.length}
          tone="amber"
        />
        <StatusCard
          icon={<CheckCircle2 className="w-5 h-5" />}
          label="Approved"
          amount={totalApproved}
          count={approved.length}
          tone="blue"
        />
        <StatusCard
          icon={<DollarSign className="w-5 h-5" />}
          label="Paid"
          amount={totalPaid}
          count={paid.length}
          tone="green"
        />
      </div>

      {/* Per-placement breakdown */}
      <section>
        <h2 className="text-lg font-semibold tracking-tight text-ecrn-ink mb-3">
          Placements
        </h2>
        {payouts.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-slate-500 max-w-sm mx-auto">
              No payouts yet. When Delta places one of your referrals, the payout will show up here.
            </p>
            <Link href="/referrals/new" className="inline-block mt-4">
              <Button variant="dark" size="sm">
                Add a referral
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {payouts.map(({ payout, candidate, job }) => (
              <Card key={payout.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[15px] font-semibold text-ecrn-ink">
                          {candidate?.firstName} {candidate?.lastName}
                        </h3>
                        <PayoutStatusBadge status={payout.status} />
                      </div>
                      {job && (
                        <p className="mt-1 text-sm text-slate-500 truncate">
                          Placed at <span className="text-ecrn-ink">{job.title}</span>
                          {job.companyName && <> · {job.companyName}</>}
                        </p>
                      )}
                      {payout.notes && (
                        <p className="mt-1.5 text-xs text-slate-500">{payout.notes}</p>
                      )}
                      <p className="mt-1 text-xs text-slate-400">
                        {payout.placementDate
                          ? `Placed ${payout.placementDate}`
                          : `Created ${payout.createdAt.slice(0, 10)}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-ecrn-ink tabular-nums">
                        {formatMoney(payout.amountCents)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        {denied.length > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            {denied.length} payout{denied.length === 1 ? " was" : "s were"} denied or disputed —
            tap the placement to see why.
          </p>
        )}
      </section>

      {/* How it works */}
      <Card>
        <CardContent className="py-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            How payouts work
          </h2>
          <ol className="space-y-2.5 text-sm text-slate-700">
            <Step n={1}>
              You refer someone. They become <strong>yours</strong> in our network — anyone else
              who tries to refer the same person gets logged as a duplicate attempt.
            </Step>
            <Step n={2}>
              Delta works the relationship. You can track every status change in real time on the
              referral detail page.
            </Step>
            <Step n={3}>
              When Delta <strong>places</strong> them, your payout moves from pending → approved
              after our standard guarantee window.
            </Step>
            <Step n={4}>
              Once approved, payout amounts range{" "}
              <span className="text-ecrn-ink font-semibold">$1,000–$10,000</span> depending on the
              role. We&apos;ll reach out with payment details when you have a payable balance.
            </Step>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusCard({
  icon,
  label,
  amount,
  count,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  amount: number;
  count: number;
  tone: "amber" | "blue" | "green";
}) {
  const toneStyles: Record<typeof tone, string> = {
    amber: "bg-amber-50 text-amber-700 border-amber-200/60",
    blue: "bg-blue-50 text-blue-700 border-blue-200/60",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  };
  return (
    <Card className="p-5">
      <div
        className={`w-10 h-10 rounded-xl border grid place-items-center ${toneStyles[tone]}`}
      >
        {icon}
      </div>
      <div className="mt-3 text-xs uppercase tracking-[0.14em] text-slate-500 font-medium">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold text-ecrn-ink tabular-nums">
        {formatMoney(amount)}
      </div>
      <div className="text-xs text-slate-500 mt-0.5">
        {count} placement{count === 1 ? "" : "s"}
      </div>
    </Card>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 leading-relaxed">
      <span className="shrink-0 w-6 h-6 rounded-full bg-ecrn-green text-ecrn-black grid place-items-center text-xs font-bold">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

function sum(nums: number[]): number {
  return nums.reduce((acc, n) => acc + n, 0);
}

function formatMoney(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
