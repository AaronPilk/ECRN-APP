import Link from "next/link";
import { BookUser, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Page, PageTitle, EmptyState } from "@/components/ui/Page";
import { ReferralStatusBadge } from "@/components/referrals/StatusBadge";
import { getCurrentProfile } from "@/lib/auth/session";
import { listReferralsByReferrerEnriched } from "@/lib/data/repository";
import { cn } from "@/lib/utils/cn";

interface PageProps {
  searchParams: Promise<{ status?: string; imported?: string; review?: string }>;
}

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "in_process", label: "In process" },
  { key: "placed", label: "Placed" },
] as const;

const AVATAR_TINTS = ["bg-[#E6ECE7]", "bg-[#EEE9DF]", "bg-[#E3EAF3]", "bg-[#ECE6EE]", "bg-[#E2F1E7]"];

export default async function ReferralsPage(props: PageProps) {
  const sp = await props.searchParams;
  const profile = (await getCurrentProfile())!;
  const items = await listReferralsByReferrerEnriched(profile.id);
  const filterKey = (sp?.status as (typeof FILTERS)[number]["key"]) ?? "all";

  const filtered = items.filter(({ candidate }) => {
    const s = candidate.status;
    if (filterKey === "active") return !["rejected", "inactive", "not_qualified"].includes(s);
    if (filterKey === "in_process")
      return ["contacted", "qualified", "submitted_to_job", "interviewing", "offer_stage"].includes(s);
    if (filterKey === "placed") return ["placed", "payout_pending", "payout_approved", "payout_paid"].includes(s);
    return true;
  });

  return (
    <Page>
      <PageTitle eyebrow={profile.role === "candidate" ? "Your network" : "Referral partner"} title="My referrals" />

      {sp.imported && (
        <div className="rounded-[14px] bg-ecrn-action-surface text-ecrn-green-text text-[14px] px-4 py-3">
          {sp.imported} contact{sp.imported === "1" ? "" : "s"} sent to Delta
          {sp.review && Number(sp.review) > 0 ? ` · ${sp.review} already in the network, under review` : ""}.
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        <Link href="/referrals/new">
          <Button fullWidth>
            <Plus className="w-4 h-4" /> Add referral
          </Button>
        </Link>
        <Link href="/referrals/import">
          <Button variant="soft" fullWidth>
            <BookUser className="w-4 h-4" /> From contacts
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-1 p-1 rounded-[14px] bg-[#E9EDE8]">
        {FILTERS.map((f) => {
          const active = filterKey === f.key;
          return (
            <Link
              key={f.key}
              href={f.key === "all" ? "/referrals" : `/referrals?status=${f.key}`}
              className={cn(
                "text-center py-2 rounded-[11px] text-[13.5px] font-medium transition-colors",
                active ? "bg-ecrn-green-text text-white" : "text-ecrn-secondary"
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <section>
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-[18px] font-semibold text-ecrn-ink">Your network</h2>
          <span className="t-eyebrow">
            {items.length} {items.length === 1 ? "person" : "people"}
          </span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title={items.length === 0 ? "No referrals yet" : "Nobody in this filter"}
            body={
              items.length === 0
                ? "Add people you know in construction. We'll track them through to placement."
                : "Try another filter."
            }
          />
        ) : (
          <ul className="divide-y divide-ecrn-line">
            {filtered.map(({ referral, candidate }, i) => {
              const initials = `${candidate.firstName?.[0] ?? ""}${candidate.lastName?.[0] ?? ""}`.toUpperCase();
              return (
                <li key={referral.id}>
                  <Link href={`/referrals/${referral.id}`} className="flex items-center gap-3 py-3">
                    <span
                      className={cn(
                        "w-10 h-10 shrink-0 rounded-full grid place-items-center font-mono text-[12px] text-ecrn-secondary",
                        AVATAR_TINTS[i % AVATAR_TINTS.length]
                      )}
                    >
                      {initials || "?"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-[16px] font-semibold text-ecrn-ink truncate">
                          {candidate.firstName} {candidate.lastName}
                        </h3>
                        {referral.isPrimary ? (
                          <ReferralStatusBadge status={candidate.status} />
                        ) : (
                          <span className="text-[11.5px] font-medium text-amber-700">Under review</span>
                        )}
                      </div>
                      <p className="text-[12.5px] text-ecrn-secondary truncate">
                        {[candidate.currentJobTitle, candidate.currentCompany, candidate.locationCity].filter(Boolean).join(" · ") ||
                          candidate.phone ||
                          "—"}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </Page>
  );
}
