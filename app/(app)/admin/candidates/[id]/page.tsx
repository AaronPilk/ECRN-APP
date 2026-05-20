import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { ReferralStatusBadge } from "@/components/referrals/StatusBadge";
import { getCurrentProfile } from "@/lib/auth/mock";
import {
  getCandidateFullContext,
  STATUS_LABEL,
} from "@/lib/data/repository";
import {
  appendCandidateNoteAction,
  updateCandidateStatusAction,
} from "../../actions";
import type { ReferralStatus } from "@/types";
import { Mail, Phone, MapPin, Linkedin, Briefcase, ExternalLink } from "lucide-react";

interface PageProps {
  params: { id: string };
}

const STATUS_OPTIONS: ReferralStatus[] = [
  "new",
  "contacted",
  "qualified",
  "not_qualified",
  "submitted_to_job",
  "interviewing",
  "offer_stage",
  "placed",
  "payout_pending",
  "payout_approved",
  "payout_paid",
  "rejected",
  "inactive",
];

export default async function AdminCandidateDetail({ params }: PageProps) {
  const profile = (await getCurrentProfile())!;
  if (profile.role !== "admin") redirect("/dashboard");

  const ctx = await getCandidateFullContext(params.id);
  if (!ctx) notFound();
  const { candidate, primaryReferrer, referrals, jobReferrals, applications, payouts, activity } =
    ctx;

  const duplicateAttempts = referrals.filter((r) => !r.referral.isPrimary);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <Link
        href="/admin/candidates"
        className="text-sm text-slate-500 hover:text-ecrn-ink"
      >
        ← All candidates
      </Link>

      {/* Header */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight text-ecrn-ink">
                  {candidate.firstName} {candidate.lastName}
                </h1>
                <ReferralStatusBadge status={candidate.status} />
                <span className="text-[10px] uppercase tracking-wide font-medium text-slate-500 px-2 py-0.5 rounded-full bg-slate-100">
                  {candidate.sourceType.replace(/_/g, " ")}
                </span>
              </div>
              {candidate.currentJobTitle && (
                <p className="mt-1 text-slate-600">
                  {candidate.currentJobTitle}
                  {candidate.yearsExperience !== null &&
                    ` · ${candidate.yearsExperience} yrs exp`}
                  {candidate.trade && ` · ${candidate.trade.replace(/_/g, " ")}`}
                </p>
              )}
            </div>
          </div>

          {/* Contact facts grid */}
          <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {candidate.email && (
              <Fact
                icon={<Mail className="w-4 h-4" />}
                label="Email"
                value={candidate.email}
                href={`mailto:${candidate.email}`}
              />
            )}
            {candidate.phone && (
              <Fact
                icon={<Phone className="w-4 h-4" />}
                label="Phone"
                value={candidate.phone}
                href={`tel:${candidate.phone}`}
              />
            )}
            {(candidate.locationCity || candidate.locationState) && (
              <Fact
                icon={<MapPin className="w-4 h-4" />}
                label="Location"
                value={[candidate.locationCity, candidate.locationState]
                  .filter(Boolean)
                  .join(", ")}
              />
            )}
            {candidate.linkedinUrl && (
              <Fact
                icon={<Linkedin className="w-4 h-4" />}
                label="LinkedIn"
                value={candidate.linkedinUrl.replace(/^https?:\/\/(www\.)?/, "")}
                href={candidate.linkedinUrl}
                external
              />
            )}
            {candidate.resumeUrl && (
              <Fact
                icon={<ExternalLink className="w-4 h-4" />}
                label="Resume"
                value="View resume"
                href={candidate.resumeUrl}
                external
              />
            )}
            <Fact
              icon={<Briefcase className="w-4 h-4" />}
              label="Primary referrer"
              value={
                primaryReferrer
                  ? `${primaryReferrer.firstName ?? ""} ${primaryReferrer.lastName ?? ""}`.trim() ||
                    primaryReferrer.email
                  : candidate.sourceType === "direct_application"
                    ? "Direct application"
                    : "Unassigned"
              }
              href={primaryReferrer ? `/admin/users#${primaryReferrer.id}` : undefined}
            />
          </div>
        </CardContent>
      </Card>

      {/* Status changer */}
      <Card>
        <CardContent className="py-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Change status
          </h2>
          <form
            action={updateCandidateStatusAction}
            className="flex flex-col sm:flex-row gap-2"
          >
            <input type="hidden" name="candidateId" value={candidate.id} />
            <select
              name="status"
              defaultValue={candidate.status}
              className="flex-1 h-11 px-3.5 rounded-xl bg-white border border-slate-200 text-[15px] text-ecrn-ink focus:outline-none focus:border-ecrn-green focus:ring-2 focus:ring-ecrn-green/20"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
            <Input
              name="notes"
              placeholder="Optional note about this status change"
              className="sm:flex-1"
            />
            <Button type="submit" variant="dark" size="md" className="sm:w-auto">
              Update
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Duplicate attempts */}
      {duplicateAttempts.length > 0 && (
        <Card className="border-amber-200/60 bg-amber-50/30">
          <CardContent className="py-5">
            <h2 className="text-sm font-semibold text-amber-900 mb-3">
              Duplicate referral attempts ({duplicateAttempts.length})
            </h2>
            <div className="space-y-2">
              {duplicateAttempts.map(({ referral, referrer }) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white border border-amber-200/60"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ecrn-ink">
                      {referrer
                        ? `${referrer.firstName ?? ""} ${referrer.lastName ?? ""}`.trim() ||
                          referrer.email
                        : "Unknown referrer"}
                    </div>
                    <div className="text-xs text-slate-500">
                      Attempted {new Date(referral.createdAt).toLocaleDateString("en-US")}{" "}
                      · reason:{" "}
                      {(referral.metadata as { duplicateReason?: string })
                        ?.duplicateReason ?? "—"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job submissions */}
      {jobReferrals.length > 0 && (
        <Section title="Submitted to roles">
          {jobReferrals.map(({ jobReferral, job }) => (
            <div
              key={jobReferral.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60"
            >
              <div className="min-w-0">
                <Link
                  href={job ? `/admin/jobs?id=${job.id}` : "#"}
                  className="text-sm font-medium text-ecrn-ink hover:text-ecrn-green"
                >
                  {job?.title ?? "Job"}
                </Link>
                <div className="text-xs text-slate-500">
                  {jobReferral.createdAt.slice(0, 10)}
                </div>
              </div>
              <ReferralStatusBadge status={jobReferral.status} />
            </div>
          ))}
        </Section>
      )}

      {/* Direct applications */}
      {applications.length > 0 && (
        <Section title="Direct applications">
          {applications.map(({ application, job }) => (
            <div
              key={application.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200/60"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-ecrn-ink">{job?.title ?? "Role"}</div>
                <div className="text-xs text-slate-500">
                  Applied {application.createdAt.slice(0, 10)}
                </div>
              </div>
              <span className="text-xs font-medium text-slate-700 uppercase tracking-wide">
                {application.status.replace(/_/g, " ")}
              </span>
            </div>
          ))}
        </Section>
      )}

      {/* Payouts */}
      {payouts.length > 0 && (
        <Section title="Payouts">
          {payouts.map((p) => (
            <Link
              key={p.id}
              href="/admin/payouts"
              className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 transition-colors"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-ecrn-ink tabular-nums">
                  ${(p.amountCents / 100).toLocaleString("en-US")}
                </div>
                {p.notes && <div className="text-xs text-slate-500">{p.notes}</div>}
              </div>
              <span className="text-xs font-medium text-slate-700 uppercase tracking-wide">
                {p.status}
              </span>
            </Link>
          ))}
        </Section>
      )}

      {/* Notes + add new */}
      <Card>
        <CardContent className="py-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Internal notes
          </h2>
          {candidate.notes && (
            <div className="mb-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
              {candidate.notes}
            </div>
          )}
          <form action={appendCandidateNoteAction} className="space-y-2">
            <input type="hidden" name="candidateId" value={candidate.id} />
            <Label htmlFor="note">Add a note</Label>
            <Textarea
              id="note"
              name="note"
              rows={3}
              placeholder="What's the latest with this candidate?"
            />
            <Button type="submit" variant="dark" size="sm">
              Add note
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Activity */}
      <Card>
        <CardContent className="py-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
            Activity ({activity.length})
          </h2>
          {activity.length === 0 ? (
            <p className="text-sm text-slate-500">No activity logged yet.</p>
          ) : (
            <ol className="relative border-l border-slate-200 ml-2 space-y-3 pl-5">
              {activity.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[1.45rem] top-1.5 w-2.5 h-2.5 rounded-full bg-ecrn-green ring-4 ring-white" />
                  <div className="text-sm text-ecrn-ink">
                    <span className="font-medium">
                      {a.action.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())}
                    </span>
                    <span className="text-slate-500"> on {a.entityType}</span>
                  </div>
                  {a.metadata && Object.keys(a.metadata).length > 0 && (
                    <div className="text-xs text-slate-500 mt-0.5">
                      {Object.entries(a.metadata)
                        .filter(([, v]) => v !== null && v !== undefined && v !== "")
                        .map(([k, v]) => `${k}: ${String(v)}`)
                        .join(" · ")}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {new Date(a.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Fact({
  icon,
  label,
  value,
  href,
  external,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}) {
  const inner = (
    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60 hover:border-ecrn-green/40 transition-colors">
      <div className="w-7 h-7 shrink-0 rounded-lg bg-white border border-slate-200 grid place-items-center text-slate-500">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wide text-slate-500 font-medium">
          {label}
        </div>
        <div
          className={`text-sm font-medium truncate ${
            href ? "text-ecrn-green hover:underline" : "text-ecrn-ink"
          }`}
        >
          {value}
        </div>
      </div>
    </div>
  );
  if (!href) return inner;
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="block"
    >
      {inner}
    </a>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="py-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
          {title}
        </h2>
        <div className="space-y-2">{children}</div>
      </CardContent>
    </Card>
  );
}
