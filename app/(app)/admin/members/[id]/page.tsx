import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Lock } from "lucide-react";
import {
  AdminHeader,
  AdminPage,
  DataTable,
  EmptyState,
  Notice,
  Panel,
  Pill,
  StatCard,
  fmtDate,
  fmtMoney,
  fmtNum,
  relTime,
  tdClass,
  titleCase,
} from "@/components/admin/ui";
import { ActivityTable } from "@/components/admin/members/ActivityTable";
import { Field, Select, fmtStamp, linkButtonClass } from "@/components/admin/members/controls";
import { ActivePill, MemberStatusPill } from "@/components/admin/members/pills";
import { ResumeView } from "@/components/profile/ResumeView";
import { ApplicationStatusBadge, PayoutStatusBadge, ReferralStatusBadge } from "@/components/referrals/StatusBadge";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import {
  INTENT_LABEL,
  PLATFORM_LABEL,
  RELOCATION_LABEL,
  SOURCE_LABEL,
  getMemberDetail,
  memberName,
  safeUrl,
} from "@/lib/admin/members";
import { STAFF_ROLE_LABEL, listStaff, staffName } from "@/lib/admin/staff";
import { requireAdmin } from "@/lib/auth/session";
import type { Staff } from "@/types";
import { setMemberActiveAction, setMemberRecruiterAction } from "../actions";

export const metadata = { title: "Member" };

/** A table that sits flush inside a Panel. */
const flush = "border-0 border-t rounded-none rounded-b-[16px]";

const ROUTED_BECAUSE: Record<string, string> = {
  job_owner: "Job owner",
  recruiter_attribution: "Recruiter who signed them up",
  territory: "Territory match",
  manual: "Assigned by hand",
  bullhorn: "From Bullhorn",
};

const CANDIDATE_SOURCE: Record<string, string> = {
  referred: "Referred by a member",
  direct_application: "Applied directly",
  self_signup: "Joined the app",
  company_submission: "Sent by a company",
  admin_import: "Added by an admin",
};

const DUPLICATE_LABEL: Record<string, string> = {
  pending_review: "Duplicate, under review",
  confirmed_duplicate: "Duplicate, no credit",
  overridden_primary: "Credit moved to them",
  unique: "No credit",
};

export default async function AdminMemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const [detail, staff] = await Promise.all([getMemberDetail(id), listStaff()]);
  if (!detail) notFound();

  const { profile: p, onboardingAnswers: answers } = detail;
  const staffById = new Map(staff.map((s) => [s.id, s]));
  const isAdminAccount = p.role === "admin";
  const recruiter = p.recruitedByStaffId ? staffById.get(p.recruitedByStaffId) : undefined;
  const linkedin = safeUrl(p.linkedinUrl);
  const signupPlatform = p.signupPlatform ? PLATFORM_LABEL[p.signupPlatform] ?? p.signupPlatform : null;
  const lastPlatform = p.lastPlatform ? PLATFORM_LABEL[p.lastPlatform] ?? p.lastPlatform : null;

  const credited = detail.referrals.filter((r) => r.isPrimary).length;
  const duplicates = detail.referrals.length - credited;
  const paidCents = detail.payouts.filter((x) => x.status === "paid").reduce((sum, x) => sum + x.amountCents, 0);
  const owedCents = detail.payouts.filter((x) => x.status === "pending" || x.status === "approved").reduce((sum, x) => sum + x.amountCents, 0);
  const connection = typeof answers.connection === "string" ? answers.connection : null;
  const resumeChoice = typeof answers.resume_choice === "string" ? answers.resume_choice : null;
  const hasAnswers = Object.keys(answers).length > 0;
  const hasBuilderAnswers = Object.keys(detail.resumeBuilderAnswers).length > 0;
  const hasMetadata = Object.keys(p.metadata).length > 0;

  return (
    <AdminPage>
      <Link href="/admin/members" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ecrn-secondary hover:text-ecrn-ink">
        <ArrowLeft className="h-4 w-4" /> Members
      </Link>

      <AdminHeader
        eyebrow={isAdminAccount ? "Admin account" : "Member"}
        title={memberName(p)}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <a href={`mailto:${p.email}`} className="hover:text-ecrn-ink break-all">
              {p.email}
            </a>
            {p.phone && (
              <a href={`tel:${p.phone.replace(/[^\d+]/g, "")}`} className="hover:text-ecrn-ink">
                {p.phone}
              </a>
            )}
            <span>Joined {fmtDate(p.createdAt)}</span>
            <span>{p.lastSeenAt ? `Last seen ${relTime(p.lastSeenAt)}` : "Not seen since sign-up"}</span>
            {(lastPlatform ?? signupPlatform) && <span>On {lastPlatform ?? signupPlatform}</span>}
            <span>{p.onboarded ? "Onboarding finished" : "Onboarding not finished"}</span>
            <span>{p.tourCompletedAt ? "Tour done" : "Tour not done"}</span>
          </span>
        }
        actions={
          <>
            {!isAdminAccount && <MemberStatusPill member={p} />}
            <ActivePill active={p.isActive} />
            {!p.onboarded && !isAdminAccount && <Pill tone="amber">Not onboarded</Pill>}
          </>
        }
      />

      <FormMessage error={sp.error} message={sp.message} />
      {isAdminAccount && <Notice tone="amber">This is an admin account. It is not listed in the members directory and cannot be changed from here.</Notice>}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard label="Referrals sent" value={fmtNum(detail.referrals.length)} hint={`${fmtNum(credited)} with credit`} />
        <StatCard label="Placements" value={fmtNum(detail.placements)} tone={detail.placements > 0 ? "green" : "default"} />
        <StatCard label="Applications" value={fmtNum(detail.applications.length)} />
        <StatCard
          label="Payouts paid"
          value={fmtMoney(paidCents)}
          hint={owedCents > 0 ? `${fmtMoney(owedCents)} pending or approved` : undefined}
          tone={paidCents > 0 ? "green" : "default"}
        />
        <StatCard label="People invited" value={fmtNum(detail.invitedTotal)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        <div className="space-y-6 lg:col-span-2 min-w-0">
          <Panel title="Profile and onboarding answers" subtitle={p.onboardingCompletedAt ? `Answered ${fmtStamp(p.onboardingCompletedAt)}` : "Onboarding quiz not finished"}>
            <Facts
              rows={[
                { label: "Here to", value: p.intent ? INTENT_LABEL[p.intent] ?? p.intent : <Muted>Not answered</Muted> },
                { label: "Career status", value: <MemberStatusPill member={p} /> },
                { label: "Discipline", value: p.discipline ?? <Muted>Not answered</Muted> },
                { label: "Experience", value: p.yearsExperience ? `${p.yearsExperience} years` : <Muted>Not answered</Muted> },
                {
                  label: "Location",
                  value: [p.locationCity, p.locationState].filter(Boolean).join(", ") || <Muted>Not answered</Muted>,
                },
                { label: "Relocation", value: p.relocation ? RELOCATION_LABEL[p.relocation] ?? p.relocation : <Muted>Not answered</Muted> },
                {
                  label: "Would move for",
                  value:
                    p.moveMotivators.length > 0 ? (
                      <span className="flex flex-wrap gap-1.5">
                        {p.moveMotivators.map((m) => (
                          <Pill key={m}>{m}</Pill>
                        ))}
                      </span>
                    ) : (
                      <Muted>Not answered</Muted>
                    ),
                },
                {
                  label: "Current employer",
                  value: p.currentEmployer ? (
                    <span className="flex flex-wrap items-center gap-2">
                      <span>{p.currentEmployer}</span>
                      <Pill tone="blue">
                        <Lock className="h-3 w-3" aria-hidden /> Confidential, do not contact
                      </Pill>
                    </span>
                  ) : (
                    <Muted>Not given</Muted>
                  ),
                },
                {
                  label: "LinkedIn",
                  value: linkedin ? (
                    <a href={linkedin} target="_blank" rel="noopener noreferrer" className="text-ecrn-green-text hover:underline break-all">
                      {p.linkedinUrl}
                    </a>
                  ) : (
                    p.linkedinUrl ?? <Muted>Not given</Muted>
                  ),
                },
                ...(p.companyName ? [{ label: "Company", value: p.companyName }] : []),
                ...(connection ? [{ label: "Tie to the trade", value: connection }] : []),
                ...(resumeChoice ? [{ label: "Resume at sign-up", value: titleCase(resumeChoice) }] : []),
              ]}
            />
            <RawJson summary="Raw onboarding answers" value={answers} emptyNote={hasAnswers ? undefined : "No answers saved."} />
            {hasMetadata && <RawJson summary="Other saved data" value={p.metadata} />}
          </Panel>

          <Panel
            title="Resume"
            subtitle={p.resumePath && p.resumeUploadedAt ? `Uploaded ${fmtStamp(p.resumeUploadedAt)}` : undefined}
            action={
              detail.resumeUrl ? (
                <a href={detail.resumeUrl} target="_blank" rel="noopener noreferrer" className={linkButtonClass()}>
                  <Download className="h-4 w-4" /> Download file
                </a>
              ) : undefined
            }
          >
            {!p.resumePath && !detail.builtResume ? (
              <EmptyState title="No resume yet" body="They have not uploaded a file or built one in the app." />
            ) : (
              <div className="space-y-4">
                {detail.resumeUrl && (
                  <p className="text-[13px] text-ecrn-secondary">The download link works for 10 minutes. Reload this page for a fresh one.</p>
                )}
                {p.resumePath && !detail.resumeUrl && (
                  <Notice tone="amber">A resume file is on record, but a download link could not be created. The file may have been removed.</Notice>
                )}
                {detail.builtResume && (
                  <div>
                    <p className="t-eyebrow mb-2">Built in ECRN</p>
                    <ResumeView r={detail.builtResume} />
                  </div>
                )}
                {hasBuilderAnswers && <RawJson summary="Raw resume builder answers" value={detail.resumeBuilderAnswers} />}
              </div>
            )}
          </Panel>

          <Panel
            title="Applications"
            subtitle={detail.applications.length ? `${fmtNum(detail.applications.length)} submitted` : undefined}
            bodyClassName={detail.applications.length ? "px-0 pb-0" : undefined}
          >
            {detail.applications.length === 0 ? (
              <EmptyState title="No applications" body="They have not applied to a job yet." />
            ) : (
              <DataTable head={["Job", "Status", "Owner", "Applied"]} className={flush}>
                {detail.applications.map((a) => (
                  <tr key={a.id}>
                    <td className={tdClass}>
                      <Link href={`/admin/jobs/${a.jobId}/edit`} className="font-medium text-ecrn-ink hover:text-ecrn-green-text">
                        {a.jobTitle}
                      </Link>
                      {a.jobPlace && <div className="text-[12.5px] text-ecrn-secondary">{a.jobPlace}</div>}
                    </td>
                    <td className={tdClass}>
                      <ApplicationStatusBadge status={a.status} />
                    </td>
                    <td className={tdClass}>
                      <Owners accountManager={staffById.get(a.accountManagerId ?? "")} recruiter={staffById.get(a.recruiterId ?? "")} />
                    </td>
                    <td className={`${tdClass} whitespace-nowrap`}>{fmtDate(a.createdAt)}</td>
                  </tr>
                ))}
              </DataTable>
            )}
          </Panel>

          <Panel
            title="Referrals they submitted"
            subtitle={
              detail.referrals.length
                ? `${fmtNum(detail.referrals.length)} sent · ${fmtNum(credited)} with credit · ${fmtNum(detail.placements)} placed · ${fmtNum(duplicates)} without credit`
                : undefined
            }
            bodyClassName={detail.referrals.length ? "px-0 pb-0" : undefined}
          >
            {detail.referrals.length === 0 ? (
              <EmptyState title="No referrals" body="They have not referred anyone yet." />
            ) : (
              <DataTable head={["Person", "Status", "Credit", "For", "Sent"]} className={flush}>
                {detail.referrals.map((r) => (
                  <tr key={r.id}>
                    <td className={tdClass}>
                      <Link href={`/admin/candidates/${r.candidateId}`} className="font-medium text-ecrn-ink hover:text-ecrn-green-text">
                        {r.candidateName}
                      </Link>
                      {r.source && <div className="text-[12.5px] text-ecrn-secondary">Via {titleCase(r.source).toLowerCase()}</div>}
                    </td>
                    <td className={tdClass}>
                      <ReferralStatusBadge status={r.status} />
                    </td>
                    <td className={tdClass}>
                      {r.isPrimary ? <Pill tone="green">Primary</Pill> : <Pill tone="amber">{DUPLICATE_LABEL[r.duplicateStatus] ?? titleCase(r.duplicateStatus)}</Pill>}
                    </td>
                    <td className={tdClass}>
                      {r.jobs.length === 0 ? (
                        <Muted>General referral</Muted>
                      ) : (
                        r.jobs.map((j) => (
                          <Link key={j.id} href={`/admin/jobs/${j.id}/edit`} className="block text-ecrn-ink hover:text-ecrn-green-text">
                            {j.title}
                          </Link>
                        ))
                      )}
                    </td>
                    <td className={`${tdClass} whitespace-nowrap`}>{fmtDate(r.createdAt)}</td>
                  </tr>
                ))}
              </DataTable>
            )}
          </Panel>

          <Panel
            title="Payouts"
            subtitle={detail.payouts.length ? `${fmtMoney(paidCents)} paid · ${fmtMoney(owedCents)} pending or approved` : undefined}
            bodyClassName={detail.payouts.length ? "px-0 pb-0" : undefined}
          >
            {detail.payouts.length === 0 ? (
              <EmptyState title="No payouts" body="A payout appears here when someone they referred is placed." />
            ) : (
              <DataTable head={["Amount", "Status", "For", "Placed", "Paid"]} className={flush}>
                {detail.payouts.map((x) => (
                  <tr key={x.id}>
                    <td className={`${tdClass} font-display font-semibold tabular-nums`}>{fmtMoney(x.amountCents)}</td>
                    <td className={tdClass}>
                      <PayoutStatusBadge status={x.status} />
                    </td>
                    <td className={tdClass}>
                      <div className="text-ecrn-ink">{x.candidateName ?? <Muted>Unknown</Muted>}</div>
                      {x.jobTitle && <div className="text-[12.5px] text-ecrn-secondary">{x.jobTitle}</div>}
                    </td>
                    <td className={`${tdClass} whitespace-nowrap`}>{fmtDate(x.placementDate)}</td>
                    <td className={`${tdClass} whitespace-nowrap`}>{fmtDate(x.paidAt)}</td>
                  </tr>
                ))}
              </DataTable>
            )}
          </Panel>

          <Panel
            title="People they invited"
            subtitle={
              detail.invitedTotal > detail.invited.length
                ? `Latest ${fmtNum(detail.invited.length)} of ${fmtNum(detail.invitedTotal)}`
                : detail.invitedTotal
                  ? `${fmtNum(detail.invitedTotal)} joined through their link`
                  : undefined
            }
            bodyClassName={detail.invited.length ? "px-0 pb-0" : undefined}
          >
            {detail.invited.length === 0 ? (
              <EmptyState title="Nobody yet" body="Members who sign up through this person's invite link show up here." />
            ) : (
              <DataTable head={["Member", "Onboarding", "Joined"]} className={flush}>
                {detail.invited.map((m) => (
                  <tr key={m.id}>
                    <td className={tdClass}>
                      <Link href={`/admin/members/${m.id}`} className="font-medium text-ecrn-ink hover:text-ecrn-green-text">
                        {m.name}
                      </Link>
                      {m.email && m.email !== m.name && <div className="text-[12.5px] text-ecrn-secondary break-all">{m.email}</div>}
                    </td>
                    <td className={tdClass}>{m.onboarded ? <Pill tone="green">Finished</Pill> : <Pill tone="amber">Not finished</Pill>}</td>
                    <td className={`${tdClass} whitespace-nowrap`}>{fmtDate(m.createdAt)}</td>
                  </tr>
                ))}
              </DataTable>
            )}
          </Panel>
        </div>

        <div className="space-y-6 min-w-0">
          <Panel title="Account">
            <Facts
              compact
              rows={[
                { label: "Joined", value: fmtStamp(p.createdAt) },
                { label: "Last seen", value: p.lastSeenAt ? `${relTime(p.lastSeenAt)} (${fmtStamp(p.lastSeenAt)})` : <Muted>Never</Muted> },
                {
                  label: "Platform",
                  value:
                    signupPlatform || lastPlatform ? (
                      [signupPlatform && `Signed up on ${signupPlatform}`, lastPlatform && `last used ${lastPlatform}`].filter(Boolean).join(", ")
                    ) : (
                      <Muted>Unknown</Muted>
                    ),
                },
                {
                  label: "Onboarding",
                  value: p.onboarded ? (
                    <span>Finished{p.onboardingCompletedAt ? ` ${fmtDate(p.onboardingCompletedAt)}` : ""}</span>
                  ) : (
                    <Pill tone="amber">Not finished</Pill>
                  ),
                },
                { label: "Product tour", value: p.tourCompletedAt ? `Done ${fmtDate(p.tourCompletedAt)}` : <Muted>Not done</Muted> },
                { label: "Account", value: <ActivePill active={p.isActive} /> },
                ...(p.externalCrmId ? [{ label: "Bullhorn ID", value: <span className="font-mono text-[12.5px]">{p.externalCrmId}</span> }] : []),
                { label: "Member ID", value: <span className="font-mono text-[12px] break-all">{p.id}</span> },
              ]}
            />
            {!isAdminAccount && (
              <form action={setMemberActiveAction} className="mt-4 space-y-2">
                <input type="hidden" name="memberId" value={p.id} />
                <input type="hidden" name="active" value={p.isActive ? "false" : "true"} />
                <Button type="submit" variant={p.isActive ? "secondary" : "deep"} size="sm">
                  {p.isActive ? "Deactivate account" : "Reactivate account"}
                </Button>
                <p className="text-[12.5px] leading-relaxed text-ecrn-secondary">
                  {p.isActive
                    ? "Flags the account as inactive in admin and hides their name on their invite link. Nothing is deleted. They are signed out of the app and see a notice until you reactivate them."
                    : "This account is flagged inactive. Reactivating restores it exactly as it was."}
                </p>
              </form>
            )}
          </Panel>

          <section id="attribution" className="scroll-mt-6">
            <Panel title="Attribution" subtitle="Who gets credit for this sign-up">
              <Facts
                compact
                rows={[
                  { label: "Source", value: SOURCE_LABEL[p.signupSource] ?? p.signupSource },
                  {
                    label: "Recruiter",
                    value: recruiter ? (
                      <StaffLink staff={recruiter} />
                    ) : p.recruitedByStaffId ? (
                      <Muted>Former team member</Muted>
                    ) : (
                      <Muted>None</Muted>
                    ),
                  },
                  {
                    label: "Invited by",
                    value: detail.inviter ? (
                      detail.inviter.isAdmin ? (
                        `${detail.inviter.name} (admin)`
                      ) : (
                        <Link href={`/admin/members/${detail.inviter.id}`} className="text-ecrn-green-text hover:underline">
                          {detail.inviter.name}
                        </Link>
                      )
                    ) : p.invitedBy ? (
                      <Muted>A member who has since left</Muted>
                    ) : (
                      <Muted>Nobody</Muted>
                    ),
                  },
                ]}
              />
              {!isAdminAccount && (
                <form action={setMemberRecruiterAction} className="mt-4 space-y-3 border-t border-ecrn-line pt-4">
                  <input type="hidden" name="memberId" value={p.id} />
                  <Field label="Recruiter">
                    <Select
                      name="staffId"
                      value={p.recruitedByStaffId ?? ""}
                      placeholder="No recruiter"
                      options={staff
                        .filter((s) => s.isActive || s.id === p.recruitedByStaffId)
                        .map((s) => ({ value: s.id, label: `${staffName(s)} (${STAFF_ROLE_LABEL[s.staffRole]}${s.isActive ? "" : ", inactive"})` }))}
                    />
                  </Field>
                  <Field label="How they came in">
                    <Select
                      name="source"
                      value={p.signupSource}
                      options={[
                        { value: "recruiter", label: "Directly, through the recruiter's code" },
                        { value: "member_invite", label: "Invited by a member (network credit)" },
                        { value: "organic", label: "On their own (organic)" },
                      ]}
                    />
                  </Field>
                  <Button type="submit" variant="dark" size="sm">
                    Save attribution
                  </Button>
                  <p className="text-[12.5px] leading-relaxed text-ecrn-secondary">
                    Changes who is credited with this sign-up and is written to the activity log. Records that are already routed stay with their
                    current owner; reassign those from Routing.
                  </p>
                </form>
              )}
            </Panel>
          </section>

          <Panel title="Their candidate record" subtitle="How recruiters see this person in the pipeline">
            {detail.candidates.length === 0 ? (
              <EmptyState title="No candidate record" body="Members who only refer people do not get one until they apply or say they are open to work." />
            ) : (
              <div className="space-y-4">
                {detail.candidates.map((c) => (
                  <div key={c.id} className="space-y-2">
                    <Facts
                      compact
                      rows={[
                        { label: "Status", value: <ReferralStatusBadge status={c.status} /> },
                        { label: "Owner", value: <StaffLink staff={staffById.get(c.accountManagerId ?? "")} fallback="Unassigned" /> },
                        { label: "Recruiter", value: <StaffLink staff={staffById.get(c.recruiterId ?? "")} fallback="Unassigned" /> },
                        {
                          label: "Routed",
                          value: c.routingReason ? (
                            `${ROUTED_BECAUSE[c.routingReason] ?? titleCase(c.routingReason)}${c.routedAt ? `, ${fmtDate(c.routedAt)}` : ""}`
                          ) : (
                            <Muted>Not routed yet</Muted>
                          ),
                        },
                        { label: "Came in as", value: CANDIDATE_SOURCE[c.sourceType] ?? (titleCase(c.sourceType) || <Muted>Unknown</Muted>) },
                        ...(c.externalCrmId ? [{ label: "Bullhorn ID", value: <span className="font-mono text-[12.5px]">{c.externalCrmId}</span> }] : []),
                      ]}
                    />
                    <Link href={`/admin/candidates/${c.id}`} className={linkButtonClass()}>
                      Open candidate record
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Devices and notifications">
            {detail.devices.length === 0 && detail.notifications.length === 0 ? (
              <EmptyState title="Nothing yet" body="Phones registered for push and messages sent to this member show up here." />
            ) : (
              <div className="space-y-4 text-[13.5px]">
                {detail.devices.length > 0 && (
                  <div>
                    <p className="t-eyebrow mb-1.5">Registered devices</p>
                    <ul className="divide-y divide-ecrn-line">
                      {detail.devices.map((d) => (
                        <li key={d.id} className="flex items-center justify-between gap-3 py-2">
                          <span className="font-medium text-ecrn-ink">{PLATFORM_LABEL[d.platform] ?? (d.platform || "Unknown")}</span>
                          <span className="text-ecrn-secondary">{d.lastSeenAt ? `Seen ${relTime(d.lastSeenAt)}` : `Added ${fmtDate(d.createdAt)}`}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {detail.notifications.length > 0 && (
                  <div>
                    <p className="t-eyebrow mb-1.5">Latest notifications</p>
                    <ul className="divide-y divide-ecrn-line">
                      {detail.notifications.map((n) => (
                        <li key={n.id} className="py-2">
                          <div className="flex items-center justify-between gap-3">
                            <span className="font-medium text-ecrn-ink">{titleCase(n.eventType)}</span>
                            <Pill tone={n.status === "failed" ? "red" : n.status === "sent" || n.status === "delivered" ? "green" : "neutral"}>
                              {titleCase(n.status)}
                            </Pill>
                          </div>
                          <div className="text-[12.5px] text-ecrn-secondary">
                            {titleCase(n.channel)} · {fmtStamp(n.createdAt)}
                            {n.error ? ` · ${n.error}` : ""}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </Panel>
        </div>
      </div>

      <Panel
        title="Activity"
        subtitle="The latest 50 things this member did, or that were done to their account"
        action={
          <Link href={`/admin/activity?actor=${encodeURIComponent(p.email)}`} className="font-medium text-ecrn-green-text hover:underline">
            Everything they did
          </Link>
        }
        bodyClassName={detail.activity.length ? "px-0 pb-0" : undefined}
      >
        {detail.activity.length === 0 ? (
          <EmptyState title="No activity recorded" body="Sign-up, onboarding, referrals and applications are logged here as they happen." />
        ) : (
          <ActivityTable logs={detail.activity} lookups={detail.lookups} subjectId={p.id} />
        )}
      </Panel>
    </AdminPage>
  );
}

function Muted({ children }: { children: ReactNode }) {
  return <span className="text-ecrn-secondary">{children}</span>;
}

/** Label on the left, answer on the right. `compact` is for the narrow side column. */
function Facts({ rows, compact }: { rows: { label: string; value: ReactNode }[]; compact?: boolean }) {
  return (
    <dl className="divide-y divide-ecrn-line text-[13.5px]">
      {rows.map((r) => (
        <div key={r.label} className={compact ? "grid grid-cols-[104px_1fr] gap-3 py-2" : "grid grid-cols-[112px_1fr] sm:grid-cols-[160px_1fr] gap-3 py-2"}>
          <dt className="text-ecrn-secondary">{r.label}</dt>
          <dd className="min-w-0 break-words text-ecrn-ink">{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function RawJson({ summary, value, emptyNote }: { summary: string; value: unknown; emptyNote?: string }) {
  return (
    <details className="mt-4 rounded-[12px] border border-ecrn-line bg-ecrn-paper px-3 py-2">
      <summary className="cursor-pointer select-none text-[12.5px] font-medium text-ecrn-secondary">{summary}</summary>
      {emptyNote ? (
        <p className="mt-2 text-[12.5px] text-ecrn-secondary">{emptyNote}</p>
      ) : (
        <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words font-mono text-[11.5px] leading-[17px] text-ecrn-ink">
          {JSON.stringify(value, null, 2)}
        </pre>
      )}
    </details>
  );
}

function StaffLink({ staff, fallback = "None" }: { staff?: Staff; fallback?: string }) {
  if (!staff) return <Muted>{fallback}</Muted>;
  return (
    <Link href={`/admin/team/${staff.id}`} className="text-ecrn-green-text hover:underline">
      {staffName(staff)}
    </Link>
  );
}

function Owners({ accountManager, recruiter }: { accountManager?: Staff; recruiter?: Staff }) {
  if (!accountManager && !recruiter) return <Muted>Unassigned</Muted>;
  return (
    <div className="space-y-0.5">
      {accountManager && <StaffLink staff={accountManager} />}
      {recruiter && (
        <div className="text-[12.5px] text-ecrn-secondary">
          Recruiter: <StaffLink staff={recruiter} />
        </div>
      )}
    </div>
  );
}
