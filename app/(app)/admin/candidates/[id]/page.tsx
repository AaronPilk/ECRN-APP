import Link from "next/link";
import { notFound } from "next/navigation";
import { Briefcase, ExternalLink, Linkedin, Mail, MapPin, Phone } from "lucide-react";
import { CareerSignals } from "@/components/admin/CareerSignals";
import { AssignControl } from "@/components/admin/assign/AssignControl";
import { AssignResult } from "@/components/admin/assign/AssignResult";
import { KeyValues } from "@/components/admin/charts";
import { AdminPage, Panel, Pill, fmtDate, fmtDateTime, fmtMoney, titleCase } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  ApplicationStatusBadge,
  PayoutStatusBadge,
  ReferralStatusBadge,
} from "@/components/referrals/StatusBadge";
import { requireAdmin } from "@/lib/auth/session";
import { getStaffMap, staffName } from "@/lib/admin/staff";
import {
  SOURCE_LABEL,
  firstParam,
  listRoutingHistory,
  routingReasonLabel,
  type RoutingEvent,
} from "@/lib/admin/routing";
import { getCandidateFullContext, STATUS_LABEL } from "@/lib/data/repository";
import {
  appendCandidateNoteAction,
  reassignPrimaryReferrerAction,
  updateCandidateStatusAction,
} from "../../actions";
import type { ActivityLog, ReferralStatus, Staff } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
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

const selectClass =
  "h-11 px-3.5 rounded-[12px] bg-white border border-ecrn-line text-[15px] text-ecrn-ink " +
  "focus:outline-none focus:border-ecrn-green focus:ring-2 focus:ring-ecrn-green/20";

export default async function AdminCandidateDetail({ params, searchParams }: PageProps) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;

  const ctx = await getCandidateFullContext(id);
  if (!ctx) notFound();
  const { candidate, primaryReferrer, referrals, jobReferrals, applications, payouts, internalNotes, activity } = ctx;

  const [staffMap, history] = await Promise.all([
    getStaffMap(),
    listRoutingHistory(candidate.id, [
      ...applications.map((a) => a.application.id),
      ...jobReferrals.map((j) => j.jobReferral.id),
    ]),
  ]);

  const duplicateAttempts = referrals.filter((r) => !r.referral.isPrimary);
  const here = `/admin/candidates/${candidate.id}`;
  const fullName = `${candidate.firstName} ${candidate.lastName}`.trim();
  const nameOf = (staffId: string | null) => (staffId && staffMap.has(staffId) ? staffName(staffMap.get(staffId)) : null);
  const accountManager = nameOf(candidate.accountManagerId);
  const recruiter = nameOf(candidate.recruiterId);
  const owned = Boolean(candidate.accountManagerId || candidate.recruiterId);

  // A hand-off to a recruiter is stored as "manual". If a rule picked the current
  // account manager first, say so instead of hiding it behind "Assigned by admin".
  const placedByRule =
    candidate.routingReason === "manual" && candidate.accountManagerId
      ? history.find(
          (e) => e.action === "routed" && e.entity === "candidate" && e.accountManagerId === candidate.accountManagerId
        )
      : undefined;
  const howTheyGotHere = placedByRule
    ? `${placedByRule.reason}, then handed off by an admin`
    : candidate.routingReason
      ? routingReasonLabel(candidate.routingReason)
      : owned
        ? "Not recorded"
        : "Not routed yet";

  return (
    <AdminPage className="max-w-[1100px] space-y-5">
      <Link href="/admin/candidates" className="text-[13.5px] text-ecrn-secondary hover:text-ecrn-ink">
        ← All candidates
      </Link>

      {/* Header */}
      <Panel bodyClassName="pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-[26px] font-semibold leading-tight tracking-[-0.03em] text-ecrn-ink">{fullName}</h1>
          <ReferralStatusBadge status={candidate.status} />
          <Pill>{SOURCE_LABEL[candidate.sourceType] ?? titleCase(candidate.sourceType)}</Pill>
        </div>
        {candidate.currentJobTitle && (
          <p className="mt-1 text-[14.5px] text-ecrn-secondary">
            {candidate.currentJobTitle}
            {candidate.yearsExperience !== null && ` · ${candidate.yearsExperience} yrs exp`}
            {candidate.trade && ` · ${candidate.trade.replace(/_/g, " ")}`}
          </p>
        )}

        {/* Contact facts grid */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {candidate.email && (
            <Fact icon={<Mail className="h-4 w-4" />} label="Email" value={candidate.email} href={`mailto:${candidate.email}`} />
          )}
          {candidate.phone && (
            <Fact icon={<Phone className="h-4 w-4" />} label="Phone" value={candidate.phone} href={`tel:${candidate.phone}`} />
          )}
          {(candidate.locationCity || candidate.locationState) && (
            <Fact
              icon={<MapPin className="h-4 w-4" />}
              label="Location"
              value={[candidate.locationCity, candidate.locationState].filter(Boolean).join(", ")}
            />
          )}
          {candidate.linkedinUrl && (
            <Fact
              icon={<Linkedin className="h-4 w-4" />}
              label="LinkedIn"
              value={candidate.linkedinUrl.replace(/^https?:\/\/(www\.)?/, "")}
              href={candidate.linkedinUrl}
              external
            />
          )}
          {candidate.resumeUrl && (
            <Fact
              icon={<ExternalLink className="h-4 w-4" />}
              label="Resume"
              value="View resume"
              href={candidate.resumeUrl}
              external
            />
          )}
          <Fact
            icon={<Briefcase className="h-4 w-4" />}
            label="Primary referrer"
            value={
              primaryReferrer
                ? `${primaryReferrer.firstName ?? ""} ${primaryReferrer.lastName ?? ""}`.trim() || primaryReferrer.email
                : candidate.sourceType === "direct_application"
                  ? "Direct application"
                  : candidate.sourceType === "self_signup"
                    ? "Joined ECRN themselves"
                    : "Unassigned"
            }
            href={primaryReferrer ? `/admin/members?q=${encodeURIComponent(primaryReferrer.email)}` : undefined}
          />
        </div>
      </Panel>

      <AssignResult assigned={firstParam(sp.assigned)} error={firstParam(sp.error)} />

      {/* Ownership */}
      <Panel
        title="Ownership"
        subtitle="Which account manager and recruiter at Delta have this person, and how they got there."
        className={candidate.accountManagerId ? undefined : "border-amber-300"}
        action={
          <Link href="/admin/routing" className="font-medium text-ecrn-green-text hover:underline">
            Routing queue
          </Link>
        }
      >
        <div className="grid gap-x-8 gap-y-6 lg:grid-cols-2">
          <div>
            <KeyValues
              rows={[
                { label: "Account manager", value: accountManager ?? <Pill tone="amber">None yet</Pill> },
                { label: "Recruiter", value: recruiter ?? <Pill tone="amber">None yet</Pill> },
                { label: "How they got here", value: howTheyGotHere },
                { label: "Routed", value: candidate.routedAt ? fmtDateTime(candidate.routedAt) : "Not yet" },
              ]}
            />
            <div className="mt-4">
              <p className="t-eyebrow mb-2">{owned ? "Change owner" : "Assign an owner"}</p>
              <AssignControl
                entity="candidate"
                id={candidate.id}
                accountManagerId={candidate.accountManagerId}
                recruiterId={candidate.recruiterId}
                returnTo={here}
                subject={fullName}
                layout="row"
              />
              {staffMap.size > 0 && (
                <p className="mt-2 text-[12.5px] leading-relaxed text-ecrn-secondary">
                  Picking a recruiter also sets their account manager. An assignment you make here is never changed by automatic
                  routing.
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="t-eyebrow mb-2">Routing history</p>
            {history.length === 0 ? (
              <p className="text-[13.5px] text-ecrn-secondary">
                Nothing yet. Each time this person, one of their applications or a job referral is routed or reassigned, it is
                listed here.
              </p>
            ) : (
              <ol className="space-y-3">
                {history.map((e) => (
                  <li key={e.id} className="border-l-2 border-ecrn-line pl-3">
                    <div className="text-[13.5px] text-ecrn-ink">
                      <span className="font-medium">{e.what}</span> {describeDestination(e)}
                    </div>
                    <div className="mt-0.5 text-[12.5px] text-ecrn-secondary">
                      {e.reason}
                      {e.detail ? ` (${e.detail})` : ""} · {e.by} · {fmtDateTime(e.at)}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </Panel>

      <CareerSignals candidateId={candidate.id} />

      {/* Status changer */}
      <Panel title="Change status">
        <form action={updateCandidateStatusAction} className="flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="candidateId" value={candidate.id} />
          <select
            name="status"
            defaultValue={candidate.status}
            aria-label="Candidate status"
            className={`${selectClass} sm:flex-1`}
          >
            {/* A status outside the usual list (e.g. under review) still has to show as selected. */}
            {!STATUS_OPTIONS.includes(candidate.status) && (
              <option value={candidate.status}>{STATUS_LABEL[candidate.status]}</option>
            )}
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <Input name="notes" placeholder="Optional note about this status change" className="h-11 text-[15px] sm:flex-1" />
          <Button type="submit" variant="dark" size="md" className="h-11 sm:w-auto">
            Update
          </Button>
        </form>
      </Panel>

      {/* Duplicate attempts */}
      {duplicateAttempts.length > 0 && (
        <Panel title={`Duplicate referral attempts (${duplicateAttempts.length})`} className="border-amber-300 bg-amber-50/40">
          <div className="space-y-2">
            {duplicateAttempts.map(({ referral, referrer }) => (
              <div
                key={referral.id}
                className="flex items-center justify-between gap-3 rounded-[12px] border border-amber-200 bg-white p-3"
              >
                <div className="min-w-0">
                  <div className="text-[14px] font-medium text-ecrn-ink">
                    {referrer
                      ? `${referrer.firstName ?? ""} ${referrer.lastName ?? ""}`.trim() || referrer.email
                      : "Unknown referrer"}
                  </div>
                  <div className="text-[12.5px] text-ecrn-secondary">
                    Attempted {fmtDate(referral.createdAt)} · reason:{" "}
                    {String(referral.metadata.duplicate_reason ?? "not recorded").replace("_", " + ")}
                  </div>
                </div>
                <form action={reassignPrimaryReferrerAction} className="shrink-0">
                  <input type="hidden" name="candidateId" value={candidate.id} />
                  <input type="hidden" name="referrerProfileId" value={referral.referrerUserId} />
                  <Button type="submit" size="sm" variant="secondary">
                    Make primary
                  </Button>
                </form>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Job submissions */}
      {jobReferrals.length > 0 && (
        <Panel title="Submitted to roles">
          <div className="space-y-2">
            {jobReferrals.map(({ jobReferral, job }) => (
              <ItemRow
                key={jobReferral.id}
                title={job?.title ?? "Job"}
                href={job ? `/admin/jobs/${job.id}/edit` : undefined}
                meta={`Referred ${fmtDate(jobReferral.createdAt)}`}
                owner={ownerLine(jobReferral.accountManagerId, jobReferral.recruiterId, staffMap)}
                badge={<ReferralStatusBadge status={jobReferral.status} />}
                assign={
                  <AssignControl
                    entity="job_referral"
                    id={jobReferral.id}
                    accountManagerId={jobReferral.accountManagerId}
                    recruiterId={jobReferral.recruiterId}
                    returnTo={here}
                    subject={`the referral to ${job?.title ?? "this job"}`}
                    layout="row"
                  />
                }
              />
            ))}
          </div>
        </Panel>
      )}

      {/* Direct applications */}
      {applications.length > 0 && (
        <Panel
          title="Direct applications"
          action={
            <Link href="/admin/applications" className="font-medium text-ecrn-green-text hover:underline">
              All applications
            </Link>
          }
        >
          <div className="space-y-2">
            {applications.map(({ application, job }) => (
              <ItemRow
                key={application.id}
                title={job?.title ?? "Role"}
                href={job ? `/admin/jobs/${job.id}/edit` : undefined}
                meta={`Applied ${fmtDate(application.createdAt)}`}
                owner={ownerLine(application.accountManagerId, application.recruiterId, staffMap)}
                badge={<ApplicationStatusBadge status={application.status} />}
                assign={
                  <AssignControl
                    entity="job_application"
                    id={application.id}
                    accountManagerId={application.accountManagerId}
                    recruiterId={application.recruiterId}
                    returnTo={here}
                    subject={`the application to ${job?.title ?? "this job"}`}
                    layout="row"
                  />
                }
              />
            ))}
          </div>
        </Panel>
      )}

      {/* Payouts */}
      {payouts.length > 0 && (
        <Panel title="Payouts">
          <div className="space-y-2">
            {payouts.map((p) => (
              <Link
                key={p.id}
                href="/admin/payouts"
                className="flex items-center justify-between gap-3 rounded-[12px] border border-ecrn-line bg-ecrn-paper p-3 transition-colors hover:border-ecrn-green"
              >
                <div className="min-w-0">
                  <div className="font-display text-[15px] font-semibold tabular-nums text-ecrn-ink">{fmtMoney(p.amountCents)}</div>
                  {p.notes && <div className="text-[12.5px] text-ecrn-secondary">{p.notes}</div>}
                </div>
                <PayoutStatusBadge status={p.status} />
              </Link>
            ))}
          </div>
        </Panel>
      )}

      {/* Notes + add new */}
      <Panel title="Internal notes (Delta only)">
        {candidate.notes && (
          <div className="mb-4 rounded-[12px] border border-amber-200 bg-amber-50/60 p-3.5">
            <div className="text-[11px] font-medium uppercase tracking-wide text-amber-800">From the referrer</div>
            <p className="mt-1 whitespace-pre-line text-[14px] leading-relaxed text-ecrn-ink">{candidate.notes}</p>
          </div>
        )}
        {internalNotes.length > 0 && (
          <ul className="mb-4 space-y-2">
            {internalNotes.map((n) => (
              <li key={n.id} className="rounded-[12px] border border-ecrn-line bg-ecrn-paper p-3.5">
                <p className="whitespace-pre-line text-[14px] leading-relaxed text-ecrn-ink">{n.body}</p>
                <p className="mt-1 text-[11.5px] text-ecrn-secondary">{fmtDateTime(n.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
        <form action={appendCandidateNoteAction} className="space-y-2">
          <input type="hidden" name="candidateId" value={candidate.id} />
          <Label htmlFor="note">Add a note</Label>
          <Textarea id="note" name="note" rows={3} placeholder="What's the latest with this candidate?" className="text-[15px]" />
          <Button type="submit" variant="dark" size="sm">
            Add note
          </Button>
        </form>
      </Panel>

      {/* Activity */}
      <Panel title={`Activity (${activity.length})`}>
        {activity.length === 0 ? (
          <p className="text-[13.5px] text-ecrn-secondary">No activity logged yet.</p>
        ) : (
          <ol className="relative ml-2 space-y-3 border-l border-ecrn-line pl-5">
            {activity.map((a) => {
              const details = describeActivity(a, staffMap);
              return (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[1.45rem] top-1.5 h-2.5 w-2.5 rounded-full bg-ecrn-green ring-4 ring-white" />
                  <div className="text-[14px] text-ecrn-ink">
                    <span className="font-medium">{titleCase(a.action)}</span>
                    <span className="text-ecrn-secondary"> on {a.entityType.replace(/_/g, " ")}</span>
                  </div>
                  {details && <div className="mt-0.5 text-[12.5px] text-ecrn-secondary">{details}</div>}
                  <div className="mt-0.5 text-[11.5px] text-ecrn-secondary/80">{fmtDateTime(a.createdAt)}</div>
                </li>
              );
            })}
          </ol>
        )}
      </Panel>
    </AdminPage>
  );
}

/** "went to Mike Smith, recruiter Sam Lee" for the routing history. */
function describeDestination(e: RoutingEvent): string {
  if (!e.accountManagerName && !e.recruiterName) return "was sent back to the queue";
  if (!e.accountManagerName) return `went to recruiter ${e.recruiterName} (no account manager)`;
  return `went to ${e.accountManagerName}, ${e.recruiterName ? `recruiter ${e.recruiterName}` : "no recruiter yet"}`;
}

/** "Mike Smith · Sam Lee" for an application or job referral. */
function ownerLine(accountManagerId: string | null, recruiterId: string | null, staffMap: Map<string, Staff>): string {
  if (!accountManagerId && !recruiterId) return "No owner yet";
  const name = (staffId: string | null, missing: string) =>
    staffId ? (staffMap.has(staffId) ? staffName(staffMap.get(staffId)) : "Former team member") : missing;
  return `${name(accountManagerId, "No account manager")} · ${name(recruiterId, "no recruiter yet")}`;
}

/** One readable line per activity entry. Routing entries show names, not ids. */
function describeActivity(a: ActivityLog, staffMap: Map<string, Staff>): string | null {
  const meta = a.metadata ?? {};
  if (a.action === "routed" || a.action === "assigned") {
    const name = (v: unknown) => (typeof v === "string" && staffMap.has(v) ? staffName(staffMap.get(v)) : null);
    const parts = [
      `Account manager: ${name(meta.account_manager_id) ?? "none"}`,
      `Recruiter: ${name(meta.recruiter_id) ?? "none"}`,
      a.action === "routed" && typeof meta.reason === "string" ? routingReasonLabel(meta.reason) : null,
      a.action === "assigned" ? routingReasonLabel("manual") : null,
    ];
    return parts.filter(Boolean).join(" · ");
  }
  const text = Object.entries(meta)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(([k, v]) => `${k.replace(/_/g, " ")}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
    .join(" · ");
  return text || null;
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
    <div className="flex items-start gap-2.5 rounded-[12px] border border-ecrn-line bg-ecrn-paper p-3 transition-colors hover:border-ecrn-green">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] border border-ecrn-line bg-white text-ecrn-secondary">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-medium uppercase tracking-wide text-ecrn-secondary">{label}</div>
        <div className={`truncate text-[14px] font-medium ${href ? "text-ecrn-green-text hover:underline" : "text-ecrn-ink"}`}>
          {value}
        </div>
      </div>
    </div>
  );
  if (!href) return inner;
  if (!external && href.startsWith("/")) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }
  return (
    <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className="block">
      {inner}
    </a>
  );
}

/** A job referral or application: title, status, who has it, and a reassign drawer. */
function ItemRow({
  title,
  href,
  meta,
  owner,
  badge,
  assign,
}: {
  title: string;
  href?: string;
  meta: string;
  owner: string;
  badge: React.ReactNode;
  assign: React.ReactNode;
}) {
  return (
    <div className="rounded-[12px] border border-ecrn-line bg-ecrn-paper p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          {href ? (
            <Link href={href} className="text-[14px] font-medium text-ecrn-ink hover:text-ecrn-green-text">
              {title}
            </Link>
          ) : (
            <div className="text-[14px] font-medium text-ecrn-ink">{title}</div>
          )}
          <div className="text-[12.5px] text-ecrn-secondary">
            {meta} · {owner}
          </div>
        </div>
        <div className="shrink-0">{badge}</div>
      </div>
      <details className="mt-2">
        <summary className="cursor-pointer list-none text-[12.5px] font-medium text-ecrn-green-text hover:underline [&::-webkit-details-marker]:hidden">
          Change who has this
        </summary>
        <div className="mt-2">{assign}</div>
      </details>
    </div>
  );
}
