import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Page, BackLink } from "@/components/ui/Page";
import { Button } from "@/components/ui/Button";
import { ReferralStatusBadge } from "@/components/referrals/StatusBadge";
import { getCurrentProfile } from "@/lib/auth/session";
import {
  getReferralWithCandidate,
  listReferralTimeline,
  listJobReferralsByCandidate,
  listPayoutsByReferrer,
  STATUS_LABEL,
} from "@/lib/data/repository";
import { ArrowUpRight } from "lucide-react";
import type { ReferralStatus } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ welcome?: string; duplicate?: string }>;
}

export default async function ReferralDetailPage(props: PageProps) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const profile = (await getCurrentProfile())!;
  const data = await getReferralWithCandidate(params.id);
  if (!data) notFound();
  const { referral, candidate } = data;

  // Only the original referrer (or admin) should see this
  if (referral.referrerUserId !== profile.id && profile.role !== "admin") {
    redirect("/referrals");
  }

  const [activity, jobReferrals, allPayouts] = await Promise.all([
    listReferralTimeline(referral, candidate.id),
    listJobReferralsByCandidate(candidate.id),
    listPayoutsByReferrer(profile.id),
  ]);
  const payouts = allPayouts.filter((p) => p.candidateId === candidate.id);

  const yrs = candidate.yearsExperience != null ? `${candidate.yearsExperience} years of experience` : null;
  const rows: [string, string | null][] = [
    ["Email", candidate.email],
    ["Phone", candidate.phone],
    ["Company", candidate.currentCompany],
    ["Location", [candidate.locationCity, candidate.locationState].filter(Boolean).join(", ") || null],
    ["Trade", candidate.trade?.replace(/_/g, " ") ?? null],
  ];

  return (
    <Page>
      {searchParams?.welcome && !searchParams?.duplicate && (
        <Banner variant="success">Referral sent to Delta. We&apos;ll update you as they move through the pipeline.</Banner>
      )}
      {searchParams?.duplicate && (
        <Banner variant="amber">This person may already be in the ECRN network. Delta&apos;s team will review it.</Banner>
      )}

      <div>
        <BackLink href="/referrals" label="My referrals" />
        <h1 className="t-page mt-3">
          {candidate.firstName} {candidate.lastName}
        </h1>
        <p className="mt-1.5 text-[14.5px] text-ecrn-secondary">
          {[candidate.currentJobTitle, yrs].filter(Boolean).join(" · ") || "Referred contact"}
          {!referral.isPrimary && <span className="ml-2 text-amber-700 font-medium">Under review</span>}
        </p>
      </div>

      <section>
        <h2 className="t-section !text-[20px] mb-1">Contact details</h2>
        <dl className="divide-y divide-ecrn-line border-b border-ecrn-line">
          {rows
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k} className="flex gap-4 py-3 text-[14.5px]">
                <dt className="w-[84px] shrink-0 text-ecrn-secondary">{k}</dt>
                <dd className="text-ecrn-ink min-w-0 break-words ">{v}</dd>
              </div>
            ))}
          {candidate.linkedinUrl && (
            <div className="flex gap-4 py-3 text-[14.5px]">
              <dt className="w-[84px] shrink-0 text-ecrn-secondary">LinkedIn</dt>
              <dd className="min-w-0 truncate">
                <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-ecrn-green-text">
                  {candidate.linkedinUrl.replace(/^https?:\/\/(www\.)?/, "")}
                </a>
              </dd>
            </div>
          )}
        </dl>
        <Link href="/jobs" className="block mt-4">
          <Button fullWidth>
            Refer to an open job <ArrowUpRight className="w-4 h-4" />
          </Button>
        </Link>
      </section>

      {referral.notes && (
        <section>
          <h2 className="font-display text-[17px] font-semibold text-ecrn-ink">Your notes</h2>
          <p className="mt-1 text-[14.5px] text-ecrn-secondary whitespace-pre-line">{referral.notes}</p>
        </section>
      )}

      <PipelineCard status={candidate.status} />

      {payouts.length > 0 && (
        <section>
          <h2 className="t-section !text-[20px] mb-1">Payouts</h2>
          <ul className="divide-y divide-ecrn-line border-b border-ecrn-line">
            {payouts.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3">
                <span className="t-money text-[17px] font-semibold text-cobalt">
                  ${(p.amountCents / 100).toLocaleString("en-US")}
                </span>
                <span className="text-[12.5px] font-medium text-ecrn-secondary capitalize">{p.status}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {jobReferrals.length > 0 && (
        <section>
          <h2 className="t-section !text-[20px] mb-1">Referred to</h2>
          <ul className="divide-y divide-ecrn-line border-b border-ecrn-line">
            {jobReferrals.map((jr) => (
              <li key={jr.id}>
                <Link href={`/jobs/${jr.jobId}`} className="flex items-center justify-between py-3 text-[14.5px]">
                  <span className="text-ecrn-green-text font-medium">View role</span>
                  <ReferralStatusBadge status={jr.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="border-t border-ecrn-line pt-5">
        <h2 className="t-section !text-[20px]">Activity</h2>
        {activity.length === 0 ? (
          <p className="mt-2 text-[14.5px] text-ecrn-secondary">No activity logged yet.</p>
        ) : (
          <ol className="mt-3 relative border-l border-ecrn-line ml-1.5 space-y-4 pl-5">
            {activity.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -left-[1.5rem] top-1.5 w-2.5 h-2.5 rounded-full bg-ecrn-green ring-4 ring-ecrn-paper" />
                <div className="text-[14.5px] font-medium text-ecrn-ink">{humanizeAction(a.action)}</div>
                <div className="t-meta">{formatDate(a.createdAt)}</div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </Page>
  );
}

// ─── helpers / sub-components ────────────────────────────────────────

const PIPELINE_STEPS: { key: ReferralStatus; label: string }[] = [
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "qualified", label: "Qualified" },
  { key: "submitted_to_job", label: "Submitted" },
  { key: "interviewing", label: "Interviewing" },
  { key: "offer_stage", label: "Offer" },
  { key: "placed", label: "Placed" },
];

function PipelineCard({ status }: { status: ReferralStatus }) {
  const idx = PIPELINE_STEPS.findIndex((s) => s.key === status);
  const placedish = ["payout_pending", "payout_approved", "payout_paid"].includes(status);
  const current = placedish ? PIPELINE_STEPS.length - 1 : idx;
  const negative = ["rejected", "not_qualified", "inactive"].includes(status);
  return (
    <section className="border-t border-ecrn-line pt-5">
      <div className="flex items-center justify-between">
        <h2 className="t-section !text-[20px]">Pipeline</h2>
        {!negative && current >= 0 && (
          <span className="t-eyebrow">
            Stage {current + 1} of {PIPELINE_STEPS.length}
          </span>
        )}
      </div>
      {!negative && (
        <div className="mt-3 grid grid-cols-7 gap-1.5" aria-hidden>
          {PIPELINE_STEPS.map((s, i) => (
            <span key={s.key} className={`h-1 rounded-full ${i <= current ? "bg-ecrn-green-text" : "bg-ecrn-line"}`} />
          ))}
        </div>
      )}
      <p className="mt-3 text-[13.5px] text-ecrn-secondary">
        Current stage <span className="ml-1 font-semibold text-ecrn-ink">{STATUS_LABEL[status]}</span>
      </p>
    </section>
  );
}

function Banner({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "success" | "amber";
}) {
  const styles =
    variant === "success" ? "bg-ecrn-action-surface text-ecrn-green-text" : "bg-amber-50 text-amber-900";
  return <div className={`px-4 py-3 rounded-[14px] text-[14px] leading-relaxed ${styles}`}>{children}</div>;
}

function humanizeAction(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
