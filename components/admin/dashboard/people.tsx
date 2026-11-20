import Link from "next/link";
import { EmptyState, Panel, Pill, fmtNum, fmtPct, relTime } from "@/components/admin/ui";
import { BarList, ColumnChart, Donut, KeyValues, StackedBar } from "@/components/admin/charts";
import type { AdminAnalytics, TeamMemberStats } from "@/lib/admin/analytics";
import {
  ACTION_LABEL,
  BUCKET_PHRASE,
  C,
  CAREER_COLOR,
  CAREER_LABEL,
  INTENT_COLOR,
  INTENT_LABEL,
  PLATFORM_COLOR,
  PLATFORM_LABEL,
  RELOCATION_COLOR,
  RELOCATION_LABEL,
  ROLE_LABEL,
  SOURCE_COLOR,
  SOURCE_LABEL,
  bucketLabel,
  plural,
  sentence,
  toSlices,
  withRest,
  type Scope,
} from "./labels";
import { EmptyNote, MiniStat, Num, PanelLink, PanelTable, SectionHeading, ShareFunnel, StackedColumns, SubHeading, cell, cellNum, span } from "./parts";

/** Dashboard sections about people: growth, the Delta team, and who the members are. */

const DONUT = { size: 104, thickness: 16 } as const;

// ═══ Growth ══════════════════════════════════════════════════════════

export function GrowthPanels({ a, scope }: { a: AdminAnalytics; scope: Scope }) {
  const unit = a.range.bucket;
  const per = BUCKET_PHRASE[unit];
  const signups = a.series.map((p, i) => ({ label: bucketLabel(p.bucket, unit, i), values: [p.recruiter, p.member_invite, p.organic] }));
  const flow = a.series.map((p, i) => ({ label: bucketLabel(p.bucket, unit, i), value: p.referrals, value2: p.applications }));
  const s = a.team.signups;
  const sources = toSlices(a.members.signup_source, { labels: SOURCE_LABEL, colors: SOURCE_COLOR });
  const actions = a.activity.by_action.map((r) => ({ label: ACTION_LABEL[r.key] ?? sentence(r.key), value: r.count }));

  return (
    <>
      <SectionHeading id="growth" title="Growth" note={scope.title} />

      <Panel className={span.wide} title="Sign-ups over time" subtitle={`New members ${per}, by how they found ECRN`} action={<PanelLink href="/admin/members">Members</PanelLink>}>
        <StackedColumns
          data={signups}
          series={[
            { name: SOURCE_LABEL.recruiter, color: SOURCE_COLOR.recruiter },
            { name: SOURCE_LABEL.member_invite, color: SOURCE_COLOR.member_invite },
            { name: SOURCE_LABEL.organic, color: SOURCE_COLOR.organic },
          ]}
          emptyLabel="No sign-ups in this period"
        />
      </Panel>

      <Panel title="Where sign-ups come from" subtitle={`Members who joined ${scope.when}`}>
        <Donut data={sources} {...DONUT} centerLabel="sign-ups" emptyLabel="No sign-ups in this period" />
        <div className="mt-3">
          <KeyValues
            rows={[
              {
                label: "Credited to a Delta recruiter",
                value:
                  s.period.total > 0 ? (
                    <>
                      {fmtPct(s.period.attributed, s.period.total)}
                      <span className="ml-1.5 font-normal text-ecrn-secondary">
                        {fmtNum(s.period.attributed)} of {fmtNum(s.period.total)}
                      </span>
                    </>
                  ) : (
                    "—"
                  ),
              },
              ...(scope.days != null ? [{ label: "Credited to a recruiter, all time", value: fmtPct(s.all.attributed, s.all.total) }] : []),
            ]}
          />
        </div>
      </Panel>

      <Panel title="What happened" subtitle={`Everything logged ${scope.when}`} action={<PanelLink href="/admin/activity">Activity</PanelLink>}>
        <BarList data={actions} limit={8} color={C.cobalt} emptyLabel="Nothing logged in this period" />
      </Panel>

      <Panel className={span.wide} title="Referrals and applications" subtitle={`Submitted ${per}`} action={<PanelLink href="/admin/referrals">Referrals</PanelLink>}>
        <ColumnChart data={flow} series={["Referrals", "Applications"]} height={240} emptyLabel="No referrals or applications in this period" />
      </Panel>
    </>
  );
}

// ═══ Team ════════════════════════════════════════════════════════════

const ROLE_TONE = { owner: "dark", account_manager: "blue", recruiter: "neutral" } as const;

/** Recruiters are measured on what they're assigned; managers and owners on what they own. */
const people = (m: TeamMemberStats) => (m.role === "recruiter" ? m.candidates_assigned : m.candidates_owned);
const applications = (m: TeamMemberStats) => (m.role === "recruiter" ? m.applications_assigned : m.applications_owned);
const placed = (m: TeamMemberStats) => (m.role === "recruiter" ? m.placements : m.placements_owned);

export function TeamPanels({ a, scope }: { a: AdminAnalytics; scope: Scope }) {
  const staff = a.team.members;
  const counts = a.team.staff;
  const s = a.team.signups;

  const topReferrers = a.referrals.top_referrers
    .filter((r) => r.period_referrals > 0)
    .map((r) => ({
      label: r.name,
      value: r.period_referrals,
      sub: r.placements > 0 ? `${fmtNum(r.placements)} placed` : undefined,
      href: `/admin/members/${r.id}`,
    }));
  const referrersPanel = (className?: string) => (
    <Panel className={className} title="Top referrers" subtitle={`Members who referred the most people ${scope.when}`} action={<PanelLink href="/admin/referrals">Referrals</PanelLink>}>
      <BarList data={topReferrers} color={C.green} emptyLabel="No referrals in this period" />
    </Panel>
  );

  if (!staff.length) {
    return (
      <>
        <SectionHeading id="team" title="Team performance" note="Who is bringing people into ECRN" />
        <Panel className={span.wide}>
          <EmptyState
            title="No team members yet"
            body="Add Delta's account managers and recruiters. Each one gets a personal sign-up link, and this is where you will see exactly who is getting people to join."
            action={<PanelLink href="/admin/team/new">Add a team member</PanelLink>}
          />
        </Panel>
        {referrersPanel(span.lgWide)}
      </>
    );
  }

  const topRecruiters = [...staff]
    .filter((m) => m.period_signups > 0)
    .sort((x, y) => y.period_signups - x.period_signups || y.direct_signups - x.direct_signups || x.name.localeCompare(y.name))
    .slice(0, 8)
    .map((m) => {
      const network = m.period_signups - m.period_direct_signups;
      return {
        label: m.name,
        value: m.period_signups,
        sub: network > 0 ? `${fmtNum(m.period_direct_signups)} direct, ${fmtNum(network)} network` : undefined,
        href: `/admin/team/${m.id}`,
      };
    });
  const withSignups = staff.filter((m) => m.is_active && m.period_signups > 0).length;

  const load = (m: TeamMemberStats) => m.candidates_owned + m.applications_owned + m.job_referrals_owned;
  const managers = staff
    .filter((m) => m.is_active && (m.role !== "recruiter" || m.jobs_owned > 0 || m.candidates_owned > 0))
    .sort((x, y) => load(y) - load(x) || y.jobs_owned - x.jobs_owned || x.name.localeCompare(y.name));
  const topLoad = Math.max(1, ...managers.map(load));

  const total = (pick: (m: TeamMemberStats) => number) => staff.reduce((sum, m) => sum + pick(m), 0);

  return (
    <>
      <SectionHeading
        id="team"
        title="Team performance"
        note={`${plural(counts.recruiters, "recruiter")}, ${plural(counts.account_managers, "account manager")}${counts.owners ? `, ${plural(counts.owners, "owner")}` : ""}`}
      />

      <Panel
        title="Top recruiters by sign-ups"
        subtitle={`${fmtNum(withSignups)} of ${fmtNum(counts.active)} team members signed someone up ${scope.when}`}
        action={<PanelLink href="/admin/team">Team</PanelLink>}
      >
        <BarList data={topRecruiters} color={C.cobalt} emptyLabel="No sign-ups credited to the team in this period" />
        <p className="mt-4 border-t border-ecrn-line pt-3 text-[12.5px] text-ecrn-secondary">
          <span className="font-medium text-ecrn-ink">{fmtPct(s.period.attributed, s.period.total)}</span> of sign-ups in this period are credited to a recruiter (
          {fmtNum(s.period.direct)} direct, {fmtNum(s.period.network)} through members they brought in).
        </p>
      </Panel>

      <Panel title="Account manager workload" subtitle="People, applications and job referrals each one owns right now" action={<PanelLink href="/admin/routing">Routing</PanelLink>}>
        {managers.length ? (
          <ul className="space-y-3.5">
            {managers.slice(0, 8).map((m) => (
              <li key={m.id}>
                <Link href={`/admin/team/${m.id}`} className="block hover:opacity-80">
                  <div className="flex items-baseline justify-between gap-3 text-[13px]">
                    <span className="truncate text-ecrn-ink">{m.name}</span>
                    <span className="whitespace-nowrap font-medium tabular-nums text-ecrn-ink">{plural(load(m), "item")}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#E9EDE8]">
                    <div className="h-full rounded-full" style={{ width: `${Math.max((load(m) / topLoad) * 100, load(m) > 0 ? 2 : 0)}%`, background: C.navy }} />
                  </div>
                  <div className="mt-1 text-[12px] text-ecrn-secondary">
                    {plural(m.jobs_owned, "job")} · {plural(m.candidates_owned, "person", "people")} · {plural(m.applications_owned, "application")} · team of {fmtNum(m.team_size)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyNote>No account managers yet. Add one on the Team screen, then give them jobs to own.</EmptyNote>
        )}
      </Panel>

      {referrersPanel(span.lgWide)}

      <Panel
        className={span.full}
        bodyClassName="px-0 pb-2 pt-3"
        title="Everyone on the team"
        subtitle="Direct = joined with their own link. Network = invited by a member they brought in."
        action={<PanelLink href="/admin/team">Manage team</PanelLink>}
      >
        <PanelTable
          minWidth={860}
          head={[
            { label: "Team member" },
            { label: "Role" },
            { label: "Reports to" },
            { label: "Direct", right: true, title: "Sign-ups with their own link, all time" },
            { label: "Network", right: true, title: "Sign-ups invited by members they brought in, all time" },
            { label: scope.title, right: true, title: `Sign-ups credited ${scope.when}` },
            { label: "Last sign-up", right: true },
            { label: "People", right: true, title: "Candidates assigned to them (recruiters) or owned by them (account managers)" },
            { label: "Applications", right: true, title: "Applications assigned to them or owned by them" },
            { label: "Placed", right: true, title: "Placements among their candidates" },
            { label: "Jobs", right: true, title: "Jobs they own (account managers) or work on (recruiters)" },
          ]}
        >
          {staff.map((m) => (
            <tr key={m.id} className={m.is_active ? undefined : "opacity-60"}>
              <td className={cell}>
                <Link href={`/admin/team/${m.id}`} className="font-medium text-ecrn-ink hover:underline">
                  {m.name || "Unnamed"}
                </Link>
                {!m.is_active && (
                  <span className="ml-2">
                    <Pill tone="amber">Inactive</Pill>
                  </span>
                )}
              </td>
              <td className={cell}>
                <Pill tone={ROLE_TONE[m.role] ?? "neutral"}>{ROLE_LABEL[m.role] ?? sentence(m.role)}</Pill>
              </td>
              <td className={`${cell} text-ecrn-secondary`}>{m.manager_name ?? "—"}</td>
              <td className={cellNum}>
                <Num n={m.direct_signups} />
              </td>
              <td className={cellNum}>
                <Num n={m.network_signups} />
              </td>
              <td className={cellNum}>
                <Num n={m.period_signups} strong />
              </td>
              <td className={`${cellNum} text-ecrn-secondary whitespace-nowrap`}>{m.last_signup_at ? relTime(m.last_signup_at) : "—"}</td>
              <td className={cellNum}>
                <Num n={people(m)} />
              </td>
              <td className={cellNum}>
                <Num n={applications(m)} />
              </td>
              <td className={cellNum}>
                <Num n={placed(m)} />
              </td>
              <td className={cellNum}>
                <Num n={m.role === "recruiter" ? m.jobs_assigned : m.jobs_owned} />
              </td>
            </tr>
          ))}
          <tr className="bg-ecrn-paper/60 font-medium">
            <td className={cell} colSpan={3}>
              Whole team
            </td>
            <td className={cellNum}>{fmtNum(total((m) => m.direct_signups))}</td>
            <td className={cellNum}>{fmtNum(total((m) => m.network_signups))}</td>
            <td className={cellNum}>{fmtNum(total((m) => m.period_signups))}</td>
            <td className={cell} colSpan={5} />
          </tr>
        </PanelTable>
      </Panel>
    </>
  );
}

// ═══ Members ═════════════════════════════════════════════════════════

export function MemberPanels({ a, scope }: { a: AdminAnalytics; scope: Scope }) {
  const m = a.members;
  const f = m.funnel;
  const e = a.engagement;
  const none = scope.days == null ? "No members yet" : "Nobody joined in this period";
  const noAnswers = m.count > 0 ? "No answers yet" : none;

  const bars = (rows: { key: string; count: number }[], suffix = "") => rows.map((r) => ({ label: `${r.key}${suffix}`, value: r.count }));

  return (
    <>
      <SectionHeading
        id="members"
        title="Who the members are"
        note={scope.days == null ? `All ${plural(m.count, "member")}` : `${plural(m.count, "member")} who joined ${scope.when}`}
      />

      <Panel className={span.wide} title="Onboarding funnel" subtitle="How far new members get. A placement counts for the member and for whoever referred them." action={<PanelLink href="/admin/members">Members</PanelLink>}>
        <ShareFunnel
          steps={[
            { label: "Created an account", value: f.accounts },
            { label: "Finished onboarding", value: f.onboarded },
            { label: "Added a résumé", value: f.resume },
            { label: "Applied or referred someone", value: f.engaged },
            { label: "Led to a placement", value: f.placed },
          ]}
          emptyLabel={none}
        />
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <MiniStat label="Applied to a job" value={fmtNum(f.applied)} hint={fmtPct(f.applied, f.accounts)} />
          <MiniStat label="Referred someone" value={fmtNum(f.referred)} hint={fmtPct(f.referred, f.accounts)} />
          <MiniStat label="Finished the app tour" value={fmtNum(f.tour_completed)} hint={fmtPct(f.tour_completed, f.accounts)} />
          <MiniStat label="Push notifications on" value={fmtNum(f.push_enabled)} hint={fmtPct(f.push_enabled, f.accounts)} />
        </div>
      </Panel>

      <Panel title="Why they joined" subtitle="Their answer to the first onboarding question">
        <Donut data={withRest(toSlices(m.intent, { labels: INTENT_LABEL, colors: INTENT_COLOR }), m.count, "Not answered")} {...DONUT} centerLabel="members" emptyLabel={none} />
      </Panel>

      <Panel title="Discipline" subtitle="Top 8 roles, the rest grouped as Other">
        <BarList data={bars(m.discipline)} color={C.green} emptyLabel={noAnswers} />
      </Panel>

      <Panel title="Years of experience" subtitle="Experience band they chose">
        <BarList data={bars(m.years_experience, " years")} color={C.cobalt} emptyLabel={noAnswers} />
      </Panel>

      <Panel title="Career status" subtitle="How open they are to a new role">
        <Donut data={withRest(toSlices(m.career_status, { labels: CAREER_LABEL, colors: CAREER_COLOR }), m.count, "Not answered")} {...DONUT} centerLabel="members" emptyLabel={none} />
      </Panel>

      <Panel title="Open to relocating" subtitle="Would they move for a job">
        <Donut data={withRest(toSlices(m.relocation, { labels: RELOCATION_LABEL, colors: RELOCATION_COLOR }), m.count, "Not answered")} {...DONUT} centerLabel="members" emptyLabel={none} />
      </Panel>

      <Panel title="Résumé on file" subtitle="Uploaded, or built with the ECRN résumé builder">
        <Donut
          data={[
            { label: "Uploaded", value: m.resume.uploaded, color: C.green },
            { label: "Built in ECRN", value: m.resume.built, color: C.cobalt },
            { label: "None yet", value: m.resume.none, color: C.none },
          ]}
          {...DONUT}
          centerValue={fmtPct(m.resume.uploaded + m.resume.built, m.count)}
          centerLabel="have one"
          emptyLabel={none}
        />
      </Panel>

      <Panel title="Where they signed up" subtitle="Website or one of the phone apps">
        <Donut data={withRest(toSlices(m.signup_platform, { labels: PLATFORM_LABEL, colors: PLATFORM_COLOR }), m.count, "Not recorded")} {...DONUT} centerLabel="members" emptyLabel={none} />
      </Panel>

      <Panel title="Top states" subtitle={`${fmtNum(m.located)} of ${fmtNum(m.count)} shared a location`}>
        <BarList data={bars(m.states)} color={C.navy} emptyLabel={m.count > 0 ? "No locations shared yet" : none} />
      </Panel>

      <Panel title="Top cities" subtitle="Where members are based">
        <BarList data={bars(m.cities)} color={C.sky} emptyLabel={m.count > 0 ? "No locations shared yet" : none} />
      </Panel>

      <Panel title="What would make them move" subtitle={`From ${plural(m.open_to_move, "member")} who have a job but are open to the right move`}>
        <BarList data={bars(m.motivators)} color={C.green} emptyLabel={m.open_to_move > 0 ? "No answers yet" : "No open-to-move members in this group"} />
      </Panel>

      <Panel className={span.full} title="App usage" subtitle={`Across all ${plural(e.members, "member")}, right now`}>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
          <MiniStat label="Active, last 24 hours" value={fmtNum(e.active_1d)} hint={fmtPct(e.active_1d, e.members)} />
          <MiniStat label="Active, last 7 days" value={fmtNum(e.active_7d)} hint={fmtPct(e.active_7d, e.members)} />
          <MiniStat label="Active, last 30 days" value={fmtNum(e.active_30d)} hint={fmtPct(e.active_30d, e.members)} />
          <MiniStat label="No visit recorded" value={fmtNum(e.never_seen)} hint={fmtPct(e.never_seen, e.members)} />
          <MiniStat label="Finished onboarding" value={fmtNum(e.onboarded)} hint={fmtPct(e.onboarded, e.members)} />
          <MiniStat label="Push notifications on" value={fmtNum(e.push_enabled)} hint={fmtPct(e.push_enabled, e.members)} />
        </div>
        <div className="mt-5 grid gap-x-10 gap-y-5 md:grid-cols-2">
          <div>
            <SubHeading>Where they last used ECRN</SubHeading>
            <StackedBar data={toSlices(e.last_platform, { labels: PLATFORM_LABEL, colors: PLATFORM_COLOR })} emptyLabel="No visits recorded yet" />
          </div>
          <div>
            <SubHeading>Phones registered for push</SubHeading>
            <StackedBar data={toSlices(e.devices, { labels: PLATFORM_LABEL, colors: PLATFORM_COLOR })} emptyLabel="No phones registered for push notifications yet" />
          </div>
        </div>
      </Panel>
    </>
  );
}
