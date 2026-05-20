import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ReferralStatusBadge } from "@/components/referrals/StatusBadge";
import { getCurrentProfile } from "@/lib/auth/mock";
import {
  getReferralWithCandidate,
  listActivityForEntity,
  listJobReferralsByCandidate,
  listPayoutsByReferrer,
  STATUS_LABEL,
} from "@/lib/data/repository";
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Linkedin,
  StickyNote,
} from "lucide-react";
import type { ReferralStatus } from "@/types";

interface PageProps {
  params: { id: string };
  searchParams?: { welcome?: string; duplicate?: string };
}

export default async function ReferralDetailPage({ params, searchParams }: PageProps) {
  const profile = (await getCurrentProfile())!;
  const data = await getReferralWithCandidate(params.id);
  if (!data) notFound();
  const { referral, candidate } = data;

  // Only the original referrer (or admin) should see this
  if (referral.referrerUserId !== profile.id && profile.role !== "admin") {
    redirect("/referrals");
  }

  const activity = await listActivityForEntity("referral", referral.id);
  const jobReferrals = await listJobReferralsByCandidate(candidate.id);
  const allPayouts = await listPayoutsByReferrer(profile.id);
  const payouts = allPayouts.filter((p) => p.candidateId === candidate.id);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      {/* Banner messages */}
      {searchParams?.welcome && !searchParams?.duplicate && (
        <Banner variant="success">
          Referral submitted. We&apos;ll update you as the candidate moves through the pipeline.
        </Banner>
      )}
      {searchParams?.duplicate && (
        <Banner variant="amber">
          This contact may already be in our network. Your submission is logged as a duplicate
          attempt — the original referrer keeps ownership unless our team reassigns it.
        </Banner>
      )}

      {/* Back link */}
      <Link href="/referrals" className="text-sm text-slate-500 hover:text-ecrn-ink">
        ← My referrals
      </Link>

      {/* Header card */}
      <Card className="overflow-hidden">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-ecrn-ink">
                  {candidate.firstName} {candidate.lastName}
                </h1>
                <ReferralStatusBadge status={candidate.status} />
                {!referral.isPrimary && (
                  <span className="text-[10px] uppercase tracking-wide text-amber-700 font-medium px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                    Duplicate attempt
                  </span>
                )}
              </div>
              {candidate.currentJobTitle && (
                <p className="mt-1 text-slate-600">
                  {candidate.currentJobTitle}
                  {candidate.yearsExperience !== null &&
                    ` · ${candidate.yearsExperience} yrs experience`}
                </p>
              )}
            </div>
          </div>

          {/* Quick facts */}
          <div className="mt-5 grid sm:grid-cols-2 gap-3">
            {candidate.email && (
              <Fact icon={<Mail className="w-4 h-4" />} label="Email" value={candidate.email} />
            )}
            {candidate.phone && (
              <Fact icon={<Phone className="w-4 h-4" />} label="Phone" value={candidate.phone} />
            )}
            {(candidate.locationCity || candidate.locationState) && (
              <Fact
                icon={<MapPin className="w-4 h-4" />}
                label="Location"
                value={[candidate.locationCity, candidate.locationState].filter(Boolean).join(", ")}
              />
            )}
            {candidate.trade && (
              <Fact
                icon={<Briefcase className="w-4 h-4" />}
                label="Trade"
                value={candidate.trade.replace(/_/g, " ")}
              />
            )}
            {candidate.linkedinUrl && (
              <a
                href={candidate.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="sm:col-span-2"
              >
                <Fact
                  icon={<Linkedin className="w-4 h-4" />}
                  label="LinkedIn"
                  value={candidate.linkedinUrl.replace(/^https?:\/\/(www\.)?/, "")}
                  isLink
                />
              </a>
            )}
          </div>

          {referral.notes && (
            <div className="mt-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500 font-medium">
                <StickyNote className="w-3.5 h-3.5" />
                Your notes
              </div>
              <p className="mt-1.5 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {referral.notes}
              </p>
            </div>
          )}

          <div className="mt-5 pt-5 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
            <Link href={`/referrals/new?candidateId=${candidate.id}`}>
              <Button size="sm" variant="primary">
                Refer to a job
              </Button>
            </Link>
            <Link href="/jobs">
              <Button size="sm" variant="secondary">
                Browse open jobs
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline */}
      <PipelineCard status={candidate.status} />

      {/* Payouts tied to this candidate */}
      {payouts.length > 0 && (
        <Card>
          <CardContent className="py-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
              Payouts on this referral
            </h2>
            <div className="space-y-2">
              {payouts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60"
                >
                  <div>
                    <div className="text-sm font-semibold text-ecrn-ink">
                      ${(p.amountCents / 100).toLocaleString("en-US")}
                    </div>
                    {p.notes && (
                      <div className="text-xs text-slate-500 mt-0.5">{p.notes}</div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job referrals */}
      {jobReferrals.length > 0 && (
        <Card>
          <CardContent className="py-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
              Jobs you&apos;ve referred them to
            </h2>
            <div className="space-y-2">
              {jobReferrals.map((jr) => (
                <Link key={jr.id} href={`/jobs/${jr.jobId}`}>
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 transition-colors">
                    <div className="text-sm font-medium text-ecrn-ink">View role →</div>
                    <ReferralStatusBadge status={jr.status} />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity timeline */}
      <Card>
        <CardContent className="py-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Activity
          </h2>
          <ol className="relative border-l border-slate-200 ml-2 space-y-4 pl-5">
            {activity.length === 0 ? (
              <li className="text-sm text-slate-500">No activity logged yet.</li>
            ) : (
              activity.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[1.45rem] top-1.5 w-2.5 h-2.5 rounded-full bg-ecrn-green ring-4 ring-white" />
                  <div className="text-sm font-medium text-ecrn-ink">
                    {humanizeAction(a.action)}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{formatDate(a.createdAt)}</div>
                </li>
              ))
            )}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── helpers / sub-components ────────────────────────────────────────

function Fact({
  icon,
  label,
  value,
  isLink,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isLink?: boolean;
}) {
  return (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
      <div className="w-7 h-7 shrink-0 rounded-lg bg-white border border-slate-200 grid place-items-center text-slate-500">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">
          {label}
        </div>
        <div
          className={`text-sm font-medium truncate ${
            isLink ? "text-ecrn-green hover:underline" : "text-ecrn-ink"
          }`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

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
  const negative = ["rejected", "not_qualified", "inactive"].includes(status);
  return (
    <Card>
      <CardContent className="py-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">
          Pipeline
        </h2>
        {negative ? (
          <div className="text-sm text-slate-600">
            Current status: <ReferralStatusBadge status={status} />
          </div>
        ) : (
          <ol className="grid grid-cols-7 gap-1">
            {PIPELINE_STEPS.map((s, i) => {
              const done = idx >= i && idx !== -1;
              const current = idx === i;
              return (
                <li key={s.key} className="text-center">
                  <div
                    className={`mx-auto w-6 h-6 rounded-full grid place-items-center text-[10px] font-bold ${
                      current
                        ? "bg-ecrn-green text-ecrn-black ring-4 ring-ecrn-green/20"
                        : done
                          ? "bg-ecrn-green text-ecrn-black"
                          : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div
                    className={`mt-1.5 text-[10px] uppercase tracking-wide font-medium ${
                      done ? "text-ecrn-ink" : "text-slate-400"
                    }`}
                  >
                    {s.label}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {!negative && (
          <p className="mt-4 text-xs text-slate-500">
            Current stage:{" "}
            <span className="text-ecrn-ink font-medium">{STATUS_LABEL[status]}</span>
          </p>
        )}
      </CardContent>
    </Card>
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
    variant === "success"
      ? "bg-emerald-50 border-emerald-200/60 text-emerald-900"
      : "bg-amber-50 border-amber-200/60 text-amber-900";
  return (
    <div className={`p-3.5 rounded-xl text-sm border leading-relaxed ${styles}`}>{children}</div>
  );
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
