import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Page, PageTitle, NavyPanel, EmptyState } from "@/components/ui/Page";
import { getCurrentProfile } from "@/lib/auth/session";
import { listPayoutsByReferrerEnriched, PAYOUT_STATUS_LABEL } from "@/lib/data/repository";
import { formatCents } from "@/lib/jobs";
import type { PayoutStatus } from "@/types";

const PAYOUT_BADGE: Record<PayoutStatus, "blue" | "cobalt" | "amber" | "red"> = {
  pending: "amber",
  approved: "blue",
  paid: "cobalt",
  denied: "red",
  disputed: "red",
};

export default async function EarningsPage() {
  const profile = (await getCurrentProfile())!;
  const payouts = await listPayoutsByReferrerEnriched(profile.id);

  const total = (s: PayoutStatus) =>
    payouts.filter((p) => p.payout.status === s).reduce((n, p) => n + p.payout.amountCents, 0);
  const paid = total("paid");
  const approved = total("approved");
  const pending = total("pending");
  const lifetime = paid + approved;
  const placements = payouts.filter((p) => p.payout.status !== "denied").length;
  const paidPct = lifetime > 0 ? Math.round((paid / lifetime) * 100) : 0;

  return (
    <Page>
      <PageTitle
        eyebrow="Referral partner"
        title="Earnings"
        subtitle={`${placements} placement${placements === 1 ? "" : "s"} in your network`}
      />

      <div>
        <NavyPanel>
          <p className="t-eyebrow !text-[#C5DEFF]">Lifetime rewards</p>
          <p className="t-money mt-1 text-[52px] leading-none font-medium text-ecrn-reward-dark">{formatCents(lifetime)}</p>
          <div className="mt-5 flex gap-1.5">
            <div className="h-1 rounded-full bg-white/85" style={{ width: `${Math.max(paidPct, lifetime ? 4 : 0)}%` }} />
            <div className="h-1 rounded-full bg-[#5BA8FF] flex-1" />
          </div>
          <div className="mt-3 grid grid-cols-2 text-[13px]">
            <div>
              <div className="flex items-center gap-1.5 text-white/75">
                <span className="w-1.5 h-1.5 rounded-full bg-white" /> Paid
              </div>
              <div className="t-money mt-0.5 text-[16px] text-white">{formatCents(paid)}</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-white/75">
                <span className="w-1.5 h-1.5 rounded-sm bg-[#5BA8FF]" /> Approved
              </div>
              <div className="t-money mt-0.5 text-[16px] text-white">{formatCents(approved)}</div>
            </div>
          </div>
        </NavyPanel>
        <div className="flex items-center justify-between px-1 pt-3 text-[13.5px]">
          <span className="text-ecrn-secondary">Pending approval</span>
          <span className="t-money font-medium text-cobalt">{formatCents(pending)}</span>
        </div>
      </div>

      <section>
        <div className="flex items-center justify-between mb-1">
          <h2 className="t-section">Placements</h2>
          <span className="t-eyebrow">{payouts.length} total</span>
        </div>
        {payouts.length === 0 ? (
          <EmptyState
            title="No payouts yet"
            body="When Delta places one of your referrals, the payout shows up here."
            action={
              <Link href="/referrals/new">
                <Button size="sm">Add a referral</Button>
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-ecrn-line border-b border-ecrn-line">
            {payouts.map(({ payout, candidate, job }) => (
              <li key={payout.id} className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-[17px] font-semibold text-ecrn-ink">
                      {candidate ? `${candidate.firstName} ${candidate.lastName}` : "Placement"}
                    </h3>
                    <p className="text-[14px] text-ecrn-secondary truncate">
                      {job?.title ?? candidate?.currentJobTitle ?? "—"}
                    </p>
                  </div>
                  <span className="t-money text-[17px] font-semibold text-cobalt">{formatCents(payout.amountCents)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="t-eyebrow">
                    {new Date(payout.placementDate ?? payout.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                  <Badge variant={PAYOUT_BADGE[payout.status]}>
                    {payout.status === "paid" ? "Paid" : PAYOUT_STATUS_LABEL[payout.status]}
                  </Badge>
                </div>
                {payout.notes && <p className="mt-1.5 text-[12.5px] text-ecrn-secondary">{payout.notes}</p>}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-[12px] text-ecrn-secondary">
          Payout tracking is informational. Delta contacts you to arrange payment for approved payouts.
        </p>
      </section>
    </Page>
  );
}
