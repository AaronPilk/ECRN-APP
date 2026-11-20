import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth/session";
import { STAFF_ROLE_LABEL, listStaff, staffName } from "@/lib/admin/staff";
import { getRequestOrigin, getTeamStats, groupTeam, statsFor, sumStats, weekLabel, type StaffStats } from "@/lib/admin/team";
import { AdminHeader, AdminPage, EmptyState, FilterTabs, Notice, Panel, Pill, StatCard, fmtNum, fmtPct } from "@/components/admin/ui";
import { BarList, ColumnChart } from "@/components/admin/charts";
import { FormMessage } from "@/components/ui/FormMessage";
import { LinkButton, MiniStat, StaffTable } from "@/components/admin/team/parts";
import { cn } from "@/lib/utils/cn";
import type { Staff } from "@/types";

/**
 * Team: Delta's account managers and recruiters, their personal sign-up
 * links, and exactly who is bringing people into ECRN. Owners only.
 */

type Sort = "signups" | "placements" | "assigned";
type Show = "active" | "inactive" | "all";

const SORTS: { key: Sort; label: string; title: string; empty: string }[] = [
  { key: "signups", label: "Sign-ups", title: "Sign-ups credited (direct + network)", empty: "No sign-ups credited to anyone yet. Share each person's link to get started." },
  { key: "placements", label: "Placements", title: "Placed candidates they recruit or own", empty: "No placements yet." },
  { key: "assigned", label: "Assigned", title: "Candidates assigned to them as recruiter", empty: "No candidates assigned to a recruiter yet." },
];

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; show?: string; message?: string; error?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const sort: Sort = sp.sort === "placements" || sp.sort === "assigned" ? sp.sort : "signups";
  const show: Show = sp.show === "all" || sp.show === "inactive" ? sp.show : "active";

  const [staff, stats, origin] = await Promise.all([listStaff(), getTeamStats(), getRequestOrigin()]);

  const href = (next: { sort?: Sort; show?: Show }) => {
    const p = new URLSearchParams();
    const s = next.sort ?? sort;
    const sh = next.show ?? show;
    if (s !== "signups") p.set("sort", s);
    if (sh !== "active") p.set("show", sh);
    const qs = p.toString();
    return qs ? `/admin/team?${qs}` : "/admin/team";
  };

  const st = (id: string) => statsFor(stats, id);
  const matches = (s: Staff) => show === "all" || (show === "active" ? s.isActive : !s.isActive);
  const bySignups = (a: Staff, b: Staff) => st(b.id).signups - st(a.id).signups || staffName(a).localeCompare(staffName(b));

  // ── headline numbers ──
  const active = staff.filter((s) => s.isActive);
  const inactiveCount = staff.length - active.length;
  const activeManagers = active.filter((s) => s.staffRole === "account_manager").length;
  const activeOwners = active.filter((s) => s.staffRole === "owner").length;
  const activeRecruiters = active.filter((s) => s.staffRole === "recruiter");
  const recruitersWithSignups = activeRecruiters.filter((s) => st(s.id).signups > 0).length;
  const t = stats.totals;

  // ── leaderboard ──
  const sortInfo = SORTS.find((s) => s.key === sort) ?? SORTS[0];
  const metric = (s: StaffStats) => (sort === "placements" ? s.placements : sort === "assigned" ? s.candidatesAssigned : s.signups);
  const nameCount = new Map<string, number>();
  for (const s of staff) nameCount.set(staffName(s), (nameCount.get(staffName(s)) ?? 0) + 1);
  const leaderboard = staff
    .filter(matches)
    .map((s) => ({ s, value: metric(st(s.id)) }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value || staffName(a.s).localeCompare(staffName(b.s)))
    .map(({ s, value }) => ({
      // Two people with the same name: add the code so each bar is clearly theirs.
      label: (nameCount.get(staffName(s)) ?? 0) > 1 ? `${staffName(s)} (${s.inviteCode})` : staffName(s),
      value,
      sub: [s.staffRole !== "recruiter" ? STAFF_ROLE_LABEL[s.staffRole] : null, s.isActive ? null : "inactive"].filter(Boolean).join(", ") || undefined,
      href: `/admin/team/${s.id}`,
    }));

  // ── who reports to whom ──
  const { groups, unmanaged, owners } = groupTeam(staff);
  const visibleGroups = groups
    .map((g) => ({
      lead: g.lead,
      reports: g.reports,
      rows: g.reports.filter(matches).sort(bySignups),
      own: st(g.lead.id),
      team: sumStats(g.lead.id, [st(g.lead.id), ...g.reports.map((r) => st(r.id))]),
    }))
    .filter((g) => matches(g.lead) || g.rows.length > 0)
    .sort((a, b) => b.team.signups - a.team.signups || staffName(a.lead).localeCompare(staffName(b.lead)));
  const visibleUnmanaged = unmanaged.filter(matches).sort(bySignups);
  const visibleOwners = owners.filter(matches).sort(bySignups);
  const nothingVisible = !visibleGroups.length && !visibleUnmanaged.length && !visibleOwners.length;

  const sortToggle = (
    <div className="inline-flex gap-1 rounded-full bg-ecrn-paper border border-ecrn-line p-0.5">
      {SORTS.map((s) => (
        <Link
          key={s.key}
          href={href({ sort: s.key })}
          aria-current={s.key === sort ? "true" : undefined}
          className={cn(
            "px-2.5 h-7 inline-flex items-center rounded-full text-[12.5px] font-medium",
            s.key === sort ? "bg-white text-ecrn-ink shadow-sm" : "text-ecrn-secondary hover:text-ecrn-ink"
          )}
        >
          {s.label}
        </Link>
      ))}
    </div>
  );

  const addButton = (
    <LinkButton href="/admin/team/new" variant="primary">
      <Plus className="w-4 h-4" /> Add team member
    </LinkButton>
  );

  return (
    <AdminPage>
      <AdminHeader
        eyebrow="Delta Construction Partners"
        title="Team"
        subtitle="Account managers and recruiters, each with a personal sign-up link. See who is bringing people into ECRN and who every sign-up belongs to."
        actions={
          <>
            {staff.length > 0 && (
              <LinkButton href="/admin/export/team" download>
                <Download className="w-4 h-4" /> Export CSV
              </LinkButton>
            )}
            {addButton}
          </>
        }
      />

      <FormMessage error={sp.error} message={sp.message} />
      {stats.error && (
        <Notice tone="amber">
          The team numbers could not be loaded right now, so the counts below show as zero. The team list itself is up to date.
        </Notice>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Team size" value={fmtNum(active.length)} hint={inactiveCount ? `${fmtNum(inactiveCount)} inactive` : "Active people"} />
        <StatCard
          label="Account managers"
          value={fmtNum(activeManagers)}
          hint={activeOwners ? `Plus ${fmtNum(activeOwners)} ${activeOwners === 1 ? "owner" : "owners"}` : undefined}
        />
        <StatCard
          label="Recruiters"
          value={fmtNum(activeRecruiters.length)}
          hint={activeRecruiters.length ? `${fmtNum(recruitersWithSignups)} with sign-ups` : undefined}
        />
        <StatCard
          label="Sign-ups credited to the team"
          value={fmtNum(t.direct + t.network)}
          tone="green"
          hint={`${fmtNum(t.direct)} direct, ${fmtNum(t.network)} network`}
        />
        <StatCard label="Members with a recruiter" value={fmtPct(t.attributed, t.members)} hint={`${fmtNum(t.attributed)} of ${fmtNum(t.members)} members`} />
        <StatCard
          label="Members with no recruiter"
          value={fmtNum(t.unattributed)}
          tone={t.unattributed > 0 ? "amber" : "default"}
          hint="Joined on their own"
          href="/admin/members?recruiter=none"
        />
      </div>

      {staff.length === 0 ? (
        <Panel>
          <EmptyState
            title="No team members yet"
            body={
              <>
                Add your account managers and recruiters here. Each person gets a personal link ({origin.replace(/^https?:\/\//, "")}/r/CODE) and a code people can type when they sign up, so you can see
                exactly who is bringing members into ECRN and which account manager each new person goes to.
              </>
            }
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {addButton}
                <LinkButton href="/admin/team/new?bulk=1#bulk">Add several at once</LinkButton>
              </div>
            }
          />
        </Panel>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Leaderboard" subtitle={sortInfo.title} className="min-w-0" action={<div className="hidden sm:block">{sortToggle}</div>}>
              <div className="sm:hidden mb-4">{sortToggle}</div>
              <BarList data={leaderboard} limit={10} color={sort === "signups" ? "#16C172" : "#0655CE"} emptyLabel={sortInfo.empty} />
              {leaderboard.length > 10 && <p className="mt-3 text-[12.5px] text-ecrn-secondary">Top 10 of {fmtNum(leaderboard.length)}. Everyone is listed below.</p>}
            </Panel>

            <Panel className="min-w-0" title="Team sign-ups by week" subtitle={`Last 12 weeks. ${fmtNum(t.signups30d)} in the last 30 days, ${fmtNum(t.signups7d)} in the last 7.`}>
              <ColumnChart
                data={stats.weekStarts.map((w, i) => ({ label: weekLabel(w), value: t.weekly[i] ?? 0 }))}
                emptyLabel="No sign-ups credited to the team in the last 12 weeks"
              />
            </Panel>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <h2 className="font-display text-[20px] font-semibold tracking-[-0.02em] text-ecrn-ink">By account manager</h2>
            <FilterTabs
              tabs={[
                { label: "Active", href: href({ show: "active" }), active: show === "active", count: active.length },
                { label: "Inactive", href: href({ show: "inactive" }), active: show === "inactive", count: inactiveCount },
                { label: "All", href: href({ show: "all" }), active: show === "all", count: staff.length },
              ]}
            />
          </div>

          {nothingVisible && (
            <Panel>
              <EmptyState
                title={show === "inactive" ? "Nobody is inactive" : "Nobody is active"}
                body={
                  show === "inactive"
                    ? "When someone leaves, deactivate them instead of deleting. Their sign-ups and history stay here."
                    : "Everyone on the team is inactive. Reactivate someone or add a new team member."
                }
                action={<LinkButton href={href({ show: "all" })}>Show everyone</LinkButton>}
              />
            </Panel>
          )}

          {visibleGroups.map((g) => (
            <section key={g.lead.id} className="bg-white rounded-[16px] border border-ecrn-line overflow-hidden">
              <header className="px-5 py-4 flex flex-wrap items-start justify-between gap-x-8 gap-y-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/team/${g.lead.id}`} className="font-display text-[18px] font-semibold text-ecrn-ink hover:text-ecrn-green-text">
                      {staffName(g.lead)}
                    </Link>
                    <Pill tone="blue">{STAFF_ROLE_LABEL[g.lead.staffRole]}</Pill>
                    {!g.lead.isActive && <Pill tone="amber">Inactive</Pill>}
                  </div>
                  <p className="mt-1 text-[12.5px] text-ecrn-secondary">
                    {g.lead.title ? `${g.lead.title} · ` : ""}
                    Code <span className="font-mono text-ecrn-ink">{g.lead.inviteCode}</span>
                    {g.lead.territories.length > 0 && ` · ${g.lead.territories.join(", ")}`}
                  </p>
                </div>
                <dl className="flex flex-wrap gap-x-6 gap-y-2">
                  <MiniStat label="Team sign-ups" value={g.team.signups} hint={g.own.signups > 0 ? `${fmtNum(g.own.signups)} their own` : undefined} />
                  <MiniStat label="Last 30 days" value={g.team.signups30d} />
                  <MiniStat label="Recruiters" value={g.reports.length} />
                  <MiniStat label="Candidates owned" value={g.own.candidatesOwned} />
                  <MiniStat label="Jobs owned" value={g.own.jobsOwned} />
                  <MiniStat label="Placements" value={g.own.placements} />
                </dl>
              </header>
              {g.rows.length > 0 ? (
                <StaffTable rows={g.rows} statsOf={st} flush showRole={g.rows.some((r) => r.staffRole !== "recruiter")} />
              ) : (
                <p className="border-t border-ecrn-line px-5 py-3.5 text-[13px] text-ecrn-secondary">
                  {g.reports.length === 0 ? "No recruiters on this team yet. " : `No ${show} recruiters on this team. `}
                  <Link href={`/admin/team/new?manager=${g.lead.id}`} className="font-medium text-ecrn-green-text hover:underline">
                    Add a recruiter
                  </Link>
                </p>
              )}
            </section>
          ))}

          {visibleUnmanaged.length > 0 && (
            <section className="bg-white rounded-[16px] border border-ecrn-line overflow-hidden">
              <header className="px-5 py-4">
                <h3 className="font-display text-[18px] font-semibold text-ecrn-ink">No account manager</h3>
                <p className="mt-1 text-[12.5px] text-ecrn-secondary">
                  {fmtNum(visibleUnmanaged.length)} {visibleUnmanaged.length === 1 ? "recruiter is" : "recruiters are"} not on anyone&apos;s team. Open a recruiter and choose Edit to pick their account
                  manager.
                </p>
              </header>
              <StaffTable rows={visibleUnmanaged} statsOf={st} flush />
            </section>
          )}

          {visibleOwners.length > 0 && (
            <section className="bg-white rounded-[16px] border border-ecrn-line overflow-hidden">
              <header className="px-5 py-4">
                <h3 className="font-display text-[18px] font-semibold text-ecrn-ink">Owners</h3>
                <p className="mt-1 text-[12.5px] text-ecrn-secondary">Owners have their own sign-up link and can own jobs like an account manager.</p>
              </header>
              <StaffTable rows={visibleOwners} statsOf={st} flush />
            </section>
          )}

          <Notice>
            A direct sign-up used the person&apos;s own link or code. A network sign-up was invited by a member that person brought in. Weeks start on Monday (Eastern time) and the last bar is the
            current week so far.
          </Notice>
        </>
      )}
    </AdminPage>
  );
}
