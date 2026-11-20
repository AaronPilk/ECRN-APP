import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { STAFF_ROLE_LABEL, inviteUrl, listStaff, staffName } from "@/lib/admin/staff";
import {
  getRequestOrigin,
  getTeamStats,
  listStaffCandidates,
  listStaffJobs,
  listStaffSignups,
  statsFor,
  sumStats,
  weekLabel,
} from "@/lib/admin/team";
import { AdminHeader, AdminPage, DataTable, EmptyState, Notice, Panel, Pill, StatCard, fmtDate, fmtNum, fmtPct, relTime, tdClass, titleCase } from "@/components/admin/ui";
import { ColumnChart, KeyValues } from "@/components/admin/charts";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { ReferralStatusBadge } from "@/components/referrals/StatusBadge";
import { ActivePill, LinkButton, StaffTable } from "@/components/admin/team/parts";
import { SignupLinkCard } from "@/components/admin/team/SignupLinkCard";
import { UUID_RE } from "@/components/admin/team/shared";
import { setStaffActiveAction } from "../actions";

/** One team member: their sign-up link, their numbers, and everyone tied to them. Owners only. */

const INTENT_LABEL: Record<string, string> = {
  job: "Looking for work",
  open: "Open to the right move",
  refer: "Referring people",
  both: "Looking and referring",
};

const ROUTING_LABEL: Record<string, string> = {
  job_owner: "Job owner",
  recruiter_attribution: "Their sign-up",
  territory: "Territory",
  manual: "Assigned by hand",
  bullhorn: "Bullhorn",
};

const JOB_STATUS_TONE: Record<string, "green" | "amber" | "blue" | "neutral"> = {
  open: "green",
  paused: "amber",
  filled: "blue",
  draft: "neutral",
  archived: "neutral",
};

const place = (city: string | null, state: string | null) => [city, state].filter(Boolean).join(", ") || "—";
const LIST_LIMIT = 200;

export default async function TeamMemberPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  if (!UUID_RE.test(id)) notFound();

  const [staff, stats, origin] = await Promise.all([listStaff(), getTeamStats(), getRequestOrigin()]);
  const person = staff.find((s) => s.id === id);
  if (!person) notFound();

  // Each list loads on its own so one failing query doesn't take the page down.
  const [signups, candidates, jobs] = await Promise.all([
    listStaffSignups(id, LIST_LIMIT).catch(() => null),
    listStaffCandidates(id, LIST_LIMIT).catch(() => null),
    listStaffJobs(id).catch(() => null),
  ]);

  const name = staffName(person);
  const isRecruiter = person.staffRole === "recruiter";
  const manager = person.managerId ? staff.find((s) => s.id === person.managerId) ?? null : null;
  const reports = staff
    .filter((s) => s.managerId === person.id && s.id !== person.id)
    .sort((a, b) => statsFor(stats, b.id).signups - statsFor(stats, a.id).signups || staffName(a).localeCompare(staffName(b)));
  const own = statsFor(stats, person.id);
  const reportsTotal = sumStats(person.id, reports.map((r) => statsFor(stats, r.id)));
  const link = inviteUrl(person.inviteCode, origin);
  const activeReports = reports.filter((r) => r.isActive).length;

  const extra = (n: number, label: string) => (n > 0 ? `Plus ${fmtNum(n)} ${label}` : undefined);

  return (
    <AdminPage>
      <Link href="/admin/team" className="inline-block text-[13px] text-ecrn-secondary hover:text-ecrn-ink">
        ← Team
      </Link>

      <AdminHeader
        eyebrow={STAFF_ROLE_LABEL[person.staffRole]}
        title={name}
        subtitle={
          <span className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <ActivePill active={person.isActive} />
            {person.title && <span>{person.title}</span>}
            {manager && (
              <span>
                {person.title ? "· " : ""}Reports to{" "}
                <Link href={`/admin/team/${manager.id}`} className="font-medium text-ecrn-green-text hover:underline">
                  {staffName(manager)}
                </Link>
              </span>
            )}
            {isRecruiter && !manager && <span>{person.title ? "· " : ""}No account manager yet</span>}
          </span>
        }
        actions={
          <>
            <form action={setStaffActiveAction}>
              <input type="hidden" name="staffId" value={person.id} />
              <input type="hidden" name="active" value={person.isActive ? "0" : "1"} />
              <Button type="submit" size="sm" variant="secondary">
                {person.isActive ? "Deactivate" : "Reactivate"}
              </Button>
            </form>
            <LinkButton href={`/admin/team/${person.id}/edit`} variant="deep">
              <Pencil className="w-4 h-4" /> Edit
            </LinkButton>
          </>
        }
      />

      <FormMessage error={sp.error} message={sp.message} />
      {stats.error && <Notice tone="amber">The numbers could not be loaded right now, so the counts on this page show as zero.</Notice>}
      {!person.isActive && activeReports > 0 && (
        <Notice tone="amber">
          {name} is inactive but {fmtNum(activeReports)} active {activeReports === 1 ? "recruiter still reports" : "recruiters still report"} to them. Move those recruiters to another account
          manager so new people keep landing with someone.
        </Notice>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] gap-4 items-start">
        <Panel title="Profile" className="min-w-0">
          <KeyValues
            rows={[
              { label: "Role", value: STAFF_ROLE_LABEL[person.staffRole] },
              ...(isRecruiter || manager
                ? [
                    {
                      label: "Account manager",
                      value: manager ? (
                        <Link href={`/admin/team/${manager.id}`} className="text-ecrn-green-text hover:underline">
                          {staffName(manager)}
                        </Link>
                      ) : (
                        "None"
                      ),
                    },
                  ]
                : []),
              {
                label: "Email",
                value: person.email ? (
                  <a href={`mailto:${person.email}`} className="text-ecrn-green-text hover:underline break-all">
                    {person.email}
                  </a>
                ) : (
                  "—"
                ),
              },
              {
                label: "Phone",
                value: person.phone ? (
                  <a href={`tel:${person.phone}`} className="text-ecrn-green-text hover:underline">
                    {person.phone}
                  </a>
                ) : (
                  "—"
                ),
              },
              { label: "Bullhorn user ID", value: person.externalCrmId ? <span className="font-mono text-[12.5px]">{person.externalCrmId}</span> : "Not linked" },
              { label: "Specialties", value: person.specialties.length ? person.specialties.join(", ") : "—" },
              { label: "Territories", value: person.territories.length ? person.territories.join(", ") : "—" },
              { label: "Status", value: person.isActive ? "Active" : "Inactive" },
              { label: "Added", value: fmtDate(person.createdAt) },
            ]}
          />
        </Panel>

        <SignupLinkCard name={name} link={link} code={person.inviteCode} active={person.isActive} />
      </div>

      {/* Sign-ups */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Sign-ups" value={fmtNum(own.signups)} tone="green" hint={own.lastSignupAt ? `Latest ${relTime(own.lastSignupAt)}` : "None yet"} />
        <StatCard label="Direct" value={fmtNum(own.directSignups)} hint="Their link or code" />
        <StatCard label="Network" value={fmtNum(own.networkSignups)} hint="Invited by their members" />
        <StatCard label="Last 7 days" value={fmtNum(own.signups7d)} />
        <StatCard label="Last 30 days" value={fmtNum(own.signups30d)} />
        <StatCard label="Finished onboarding" value={fmtNum(own.onboarded)} hint={own.signups > 0 ? `${fmtPct(own.onboarded, own.signups)} of their sign-ups` : undefined} />
      </div>

      {/* Workload */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {isRecruiter ? (
          <>
            <StatCard label="Candidates assigned" value={fmtNum(own.candidatesAssigned)} hint={extra(own.candidatesOwned, "owned")} />
            <StatCard label="Applications assigned" value={fmtNum(own.applicationsAssigned)} hint={extra(own.applicationsOwned, "owned")} />
            <StatCard label="Job referrals assigned" value={fmtNum(own.jobReferralsAssigned)} hint={extra(own.jobReferralsOwned, "owned")} />
            <StatCard label="Jobs assigned" value={fmtNum(own.jobsAssigned)} hint={extra(own.jobsOwned, "owned")} />
            <StatCard label="Placements" value={fmtNum(own.placements)} tone="cobalt" />
          </>
        ) : (
          <>
            <StatCard label="Candidates owned" value={fmtNum(own.candidatesOwned)} hint={extra(own.candidatesAssigned, "as recruiter")} />
            <StatCard label="Applications owned" value={fmtNum(own.applicationsOwned)} hint={extra(own.applicationsAssigned, "as recruiter")} />
            <StatCard label="Job referrals owned" value={fmtNum(own.jobReferralsOwned)} hint={extra(own.jobReferralsAssigned, "as recruiter")} />
            <StatCard label="Jobs owned" value={fmtNum(own.jobsOwned)} hint={extra(own.jobsAssigned, "as recruiter")} />
            <StatCard label="Placements" value={fmtNum(own.placements)} tone="cobalt" />
            <StatCard
              label="Recruiters"
              value={fmtNum(reports.length)}
              hint={reports.length ? `${fmtNum(reportsTotal.signups)} sign-ups between them` : undefined}
            />
          </>
        )}
      </div>

      <Panel
        title="Sign-ups by week"
        subtitle={reports.length ? "Last 12 weeks. Their own sign-ups, with their recruiters stacked on top." : "Last 12 weeks. The last bar is the current week so far."}
      >
        <ColumnChart
          data={stats.weekStarts.map((w, i) => ({
            label: weekLabel(w),
            value: own.weekly[i] ?? 0,
            ...(reports.length ? { value2: reportsTotal.weekly[i] ?? 0 } : {}),
          }))}
          series={reports.length ? [name, "Their recruiters"] : undefined}
          emptyLabel="No sign-ups in the last 12 weeks"
        />
      </Panel>

      {reports.length > 0 && (
        <section className="space-y-3">
          <SectionTitle title="Their recruiters" count={reports.length} />
          <StaffTable rows={reports} statsOf={(sid) => statsFor(stats, sid)} showRole={reports.some((r) => r.staffRole !== "recruiter")} />
        </section>
      )}

      {/* Members they brought in */}
      <section className="space-y-3">
        <SectionTitle
          title="Members they brought in"
          count={signups?.total ?? own.signups}
          action={
            (signups?.total ?? 0) > 0 ? (
              <Link href={`/admin/members?recruiter=${person.id}`} className="text-[13px] font-medium text-ecrn-green-text hover:underline">
                Open in Members
              </Link>
            ) : undefined
          }
        />
        {signups === null ? (
          <Notice tone="amber">This list could not be loaded. Refresh to try again.</Notice>
        ) : (
          <DataTable
            head={["Member", "Joined", "Source", "Intent", "Discipline", "Location", "Résumé", ""]}
            empty={
              signups.rows.length === 0 ? (
                <EmptyState
                  title="No sign-ups yet"
                  body={`When someone joins with ${name}'s link or types ${person.inviteCode} at sign-up, they show up here. So do the people those members invite.`}
                />
              ) : undefined
            }
          >
            {signups.rows.map((m) => (
              <tr key={m.id} className="hover:bg-ecrn-paper/60">
                <td className={tdClass}>
                  <Link href={`/admin/members/${m.id}`} className="font-medium text-ecrn-ink hover:text-ecrn-green-text hover:underline">
                    {m.name}
                  </Link>
                  {m.email && m.email !== m.name && <div className="text-[12.5px] text-ecrn-secondary break-all">{m.email}</div>}
                  {!m.onboarded && <div className="text-[12px] text-amber-800">Onboarding not finished</div>}
                </td>
                <td className={`${tdClass} whitespace-nowrap`}>{fmtDate(m.joinedAt)}</td>
                <td className={tdClass}>
                  {m.source === "direct" ? <Pill tone="green">Direct</Pill> : <Pill tone="blue">Network</Pill>}
                  {m.source === "network" && m.invitedByName && <div className="mt-0.5 text-[12px] text-ecrn-secondary">Invited by {m.invitedByName}</div>}
                </td>
                <td className={tdClass}>{m.intent ? INTENT_LABEL[m.intent] ?? titleCase(m.intent) : "—"}</td>
                <td className={tdClass}>{m.discipline ?? "—"}</td>
                <td className={`${tdClass} whitespace-nowrap`}>{place(m.locationCity, m.locationState)}</td>
                <td className={tdClass}>{m.hasResume ? <Pill tone="green">Yes</Pill> : <Pill>No</Pill>}</td>
                <td className={`${tdClass} text-right`}>
                  <Link href={`/admin/members/${m.id}`} className="text-[13px] font-medium text-ecrn-green-text hover:underline whitespace-nowrap">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
        {signups && signups.total > signups.rows.length && (
          <p className="text-[12.5px] text-ecrn-secondary">
            Showing the latest {fmtNum(signups.rows.length)} of {fmtNum(signups.total)}.
          </p>
        )}
      </section>

      {/* Candidates */}
      <section className="space-y-3">
        <SectionTitle title={isRecruiter ? "Candidates assigned to them" : "Candidates they own"} count={candidates?.total ?? 0} />
        {candidates === null ? (
          <Notice tone="amber">This list could not be loaded. Refresh to try again.</Notice>
        ) : (
          <DataTable
            head={["Candidate", "Status", "Their part", "Title", "Location", "How they got here", "Added"]}
            empty={
              candidates.rows.length === 0 ? (
                <EmptyState
                  title="No candidates yet"
                  body={
                    isRecruiter
                      ? "People are assigned here when they sign up through this recruiter, or when an account manager hands them over."
                      : "People land here when they apply or are referred to a job this person owns, sign up through their team, or live in their territory."
                  }
                />
              ) : undefined
            }
          >
            {candidates.rows.map((c) => (
              <tr key={c.id} className="hover:bg-ecrn-paper/60">
                <td className={tdClass}>
                  <Link href={`/admin/candidates/${c.id}`} className="font-medium text-ecrn-ink hover:text-ecrn-green-text hover:underline">
                    {c.name}
                  </Link>
                </td>
                <td className={tdClass}>
                  <ReferralStatusBadge status={c.status} />
                </td>
                <td className={`${tdClass} whitespace-nowrap`}>
                  {c.isRecruiter && c.isAccountManager ? "Account manager and recruiter" : c.isRecruiter ? "Recruiter" : "Account manager"}
                </td>
                <td className={tdClass}>{c.jobTitle ?? (c.trade ? titleCase(c.trade) : "—")}</td>
                <td className={`${tdClass} whitespace-nowrap`}>{place(c.locationCity, c.locationState)}</td>
                <td className={`${tdClass} whitespace-nowrap`}>{c.routingReason ? ROUTING_LABEL[c.routingReason] ?? titleCase(c.routingReason) : "—"}</td>
                <td className={`${tdClass} whitespace-nowrap`}>{fmtDate(c.createdAt)}</td>
              </tr>
            ))}
          </DataTable>
        )}
        {candidates && candidates.total > candidates.rows.length && (
          <p className="text-[12.5px] text-ecrn-secondary">
            Showing the latest {fmtNum(candidates.rows.length)} of {fmtNum(candidates.total)}.
          </p>
        )}
      </section>

      {/* Jobs */}
      <section className="space-y-3">
        <SectionTitle title={isRecruiter ? "Jobs they work on" : "Jobs they own"} count={jobs?.length ?? 0} />
        {jobs === null ? (
          <Notice tone="amber">This list could not be loaded. Refresh to try again.</Notice>
        ) : (
          <DataTable
            head={["Job", "Company", "Location", "Status", "Their part", "Posted"]}
            empty={
              jobs.length === 0 ? (
                <EmptyState
                  title="No jobs yet"
                  body={
                    isRecruiter
                      ? "Jobs show here when this recruiter is added to a job."
                      : "Set this person as the account manager on a job and its applications and referrals come to them."
                  }
                />
              ) : undefined
            }
          >
            {jobs.map((j) => (
              <tr key={j.id} className="hover:bg-ecrn-paper/60">
                <td className={tdClass}>
                  <Link href={`/admin/jobs/${j.id}/edit`} className="font-medium text-ecrn-ink hover:text-ecrn-green-text hover:underline">
                    {j.title}
                  </Link>
                </td>
                <td className={tdClass}>{j.companyName ?? "Confidential"}</td>
                <td className={`${tdClass} whitespace-nowrap`}>{place(j.locationCity, j.locationState)}</td>
                <td className={tdClass}>
                  <Pill tone={JOB_STATUS_TONE[j.status] ?? "neutral"}>{titleCase(j.status) || "—"}</Pill>
                </td>
                <td className={`${tdClass} whitespace-nowrap`}>{j.isOwner && j.isAssigned ? "Owner and recruiter" : j.isOwner ? "Owner" : "Recruiter"}</td>
                <td className={`${tdClass} whitespace-nowrap`}>{fmtDate(j.createdAt)}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </section>
    </AdminPage>
  );
}

function SectionTitle({ title, count, action }: { title: string; count?: number; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3 pt-2">
      <h2 className="font-display text-[18px] font-semibold tracking-[-0.02em] text-ecrn-ink">
        {title}
        {count != null && <span className="ml-2 text-[14px] font-medium tabular-nums text-ecrn-secondary">{fmtNum(count)}</span>}
      </h2>
      {action}
    </div>
  );
}
