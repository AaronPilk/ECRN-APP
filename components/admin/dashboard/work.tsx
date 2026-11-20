import Link from "next/link";
import { Panel, Pill, fmtMoney, fmtNum, fmtPct } from "@/components/admin/ui";
import { BarList, ColumnChart, Donut, Funnel, KeyValues, StackedBar } from "@/components/admin/charts";
import type { AdminAnalytics } from "@/lib/admin/analytics";
import {
  APPLICATION_COLOR,
  APPLICATION_LABEL,
  C,
  CANDIDATE_SOURCE_COLOR,
  CANDIDATE_SOURCE_LABEL,
  JOB_STATUS_COLOR,
  JOB_STATUS_LABEL,
  LEAD_COLOR,
  LEAD_LABEL,
  PAYOUT_COLOR,
  PAYOUT_LABEL,
  PIPELINE_ORDER,
  PLACED_STAGES,
  REFERRAL_OUTCOMES,
  REFERRAL_SOURCE_COLOR,
  REFERRAL_SOURCE_LABEL,
  ROUTING_REASON_COLOR,
  ROUTING_REASON_LABEL,
  STAGE_COLOR,
  STAGE_LABEL,
  STAGE_ORDER,
  bucketLabel,
  fmtHours,
  plural,
  sentence,
  toSlices,
  type Scope,
} from "./labels";
import { EmptyNote, MiniStat, MoneyBreakdown, Num, PanelLink, PanelTable, SectionHeading, SplitBar, SubHeading, cell, cellNum, span } from "./parts";

/** Dashboard sections about the work itself: pipeline, routing, jobs, payouts. */

const DONUT = { size: 104, thickness: 16 } as const;

const JOB_PILL = { draft: "neutral", open: "green", paused: "amber", filled: "blue", archived: "neutral" } as const;

// ═══ Recruiting pipeline ═════════════════════════════════════════════

export function PipelinePanels({ a, scope }: { a: AdminAnalytics; scope: Scope }) {
  const p = a.pipeline;
  const r = a.routing;
  const apps = a.applications;
  const refs = a.referrals;

  // Funnel: everyone who has reached each stage or gone further ("placed" includes the payout stages).
  const byStatus = new Map(p.by_status.map((s) => [s.key, s.count]));
  const at = (k: string) => byStatus.get(k) ?? 0;
  const stageCounts = PIPELINE_ORDER.map((k) => (k === "placed" ? PLACED_STAGES.reduce((sum, x) => sum + at(x), 0) : at(k)));
  const reached = PIPELINE_ORDER.map((k, i) => ({ label: STAGE_LABEL[k], value: stageCounts.slice(i).reduce((sum, v) => sum + v, 0) }));

  // Where everyone is right now: the happy path in order, then everything off it.
  const rightNow = STAGE_ORDER.map((k) => ({ label: STAGE_LABEL[k] ?? sentence(k), value: at(k), color: STAGE_COLOR[k] ?? C.slate }));

  const refStatus = new Map(refs.by_status.map((s) => [s.key, s.count]));
  const outcomes = REFERRAL_OUTCOMES.map((g) => ({ label: g.label, value: g.keys.reduce((sum, k) => sum + (refStatus.get(k) ?? 0), 0), color: g.color }));

  const waitingForRecruiter = r.no_recruiter_candidates + r.no_recruiter_applications + r.no_recruiter_job_referrals;

  return (
    <>
      <SectionHeading id="pipeline" title="Recruiting pipeline" note={`${plural(p.total, "candidate")}, as things stand right now`} />

      <Panel
        className={span.wide}
        title="Candidate pipeline"
        subtitle="Each bar counts everyone who has reached that stage or gone further"
        action={<PanelLink href="/admin/candidates">Candidates</PanelLink>}
      >
        {p.total > 0 ? (
          <>
            <Funnel steps={reached} color={C.cobalt} />
            <SubHeading className="mt-6">Where everyone is right now</SubHeading>
            <SplitBar data={rightNow} />
          </>
        ) : (
          <EmptyNote>No candidates yet. They appear as members sign up, apply to jobs and refer people.</EmptyNote>
        )}
      </Panel>

      <Panel title="Where candidates come from" subtitle="How each person entered the pipeline">
        <Donut data={toSlices(p.by_source, { labels: CANDIDATE_SOURCE_LABEL, colors: CANDIDATE_SOURCE_COLOR })} {...DONUT} centerLabel="candidates" emptyLabel="No candidates yet" />
        <div className="mt-3">
          <KeyValues
            rows={[
              { label: "Confidential (employed, open to a move)", value: fmtNum(p.confidential) },
              { label: "Actively looking", value: fmtNum(p.actively_looking) },
              { label: "Have their own ECRN account", value: fmtNum(p.with_account) },
              { label: "Résumé on file", value: fmtNum(p.with_resume) },
            ]}
          />
        </div>
      </Panel>

      <Panel title="Routing health" subtitle="Is everyone with the right account manager and recruiter" action={<PanelLink href="/admin/routing">Routing</PanelLink>}>
        <div className="grid grid-cols-2 gap-2.5">
          <MiniStat
            label="No account manager"
            value={fmtNum(r.unassigned)}
            hint={`${fmtPct(r.unassigned, r.candidates)} of candidates`}
            tone={r.unassigned > 0 ? "amber" : "default"}
            href="/admin/routing"
          />
          <MiniStat
            label="Waiting for a recruiter"
            value={fmtNum(waitingForRecruiter)}
            hint="Have an owner already"
            tone={waitingForRecruiter > 0 ? "amber" : "default"}
            href="/admin/routing"
          />
        </div>
        <div className="mt-2">
          <KeyValues
            rows={[
              { label: "People waiting for a recruiter", value: fmtNum(r.no_recruiter_candidates) },
              { label: "Applications waiting for a recruiter", value: fmtNum(r.no_recruiter_applications) },
              { label: "Job referrals waiting for a recruiter", value: fmtNum(r.no_recruiter_job_referrals) },
              {
                label: "Jobs without an owner",
                value:
                  a.jobs.without_owner > 0 ? (
                    <Link href="/admin/jobs" className="text-amber-700 hover:underline">
                      {fmtNum(a.jobs.without_owner)}
                    </Link>
                  ) : (
                    "0"
                  ),
              },
              { label: `People routed ${scope.when}`, value: fmtNum(r.routed) },
              { label: "Typical time to route them", value: fmtHours(r.median_hours_to_route) },
              { label: "Average time to route them", value: fmtHours(r.avg_hours_to_route) },
            ]}
          />
        </div>
        <SubHeading className="mt-4">How people were routed</SubHeading>
        <StackedBar data={toSlices(r.by_reason, { labels: ROUTING_REASON_LABEL, colors: ROUTING_REASON_COLOR })} emptyLabel="Nobody has been routed yet" />
      </Panel>

      <Panel title="Applications by status" subtitle={`${plural(apps.total, "application")} in total`} action={<PanelLink href="/admin/applications">Applications</PanelLink>}>
        <Donut data={toSlices(apps.by_status, { labels: APPLICATION_LABEL, colors: APPLICATION_COLOR })} {...DONUT} centerLabel="total" emptyLabel="No applications yet" />
        <div className="mt-3">
          <KeyValues
            rows={[
              { label: "Waiting for a first review", value: fmtNum(apps.awaiting_review) },
              { label: "Not routed to an account manager", value: fmtNum(r.unassigned_applications) },
            ]}
          />
        </div>
      </Panel>

      <Panel title="Referrals by status" subtitle={`${plural(refs.total, "referral")} from ${plural(refs.referrers, "member")}`} action={<PanelLink href="/admin/referrals">Referrals</PanelLink>}>
        <Donut data={outcomes} {...DONUT} centerLabel="referrals" emptyLabel="No referrals yet" />
        <SubHeading className="mt-5">How they were sent in</SubHeading>
        <StackedBar data={toSlices(refs.by_source, { labels: REFERRAL_SOURCE_LABEL, colors: REFERRAL_SOURCE_COLOR })} emptyLabel="No referrals yet" />
        <div className="mt-3">
          <KeyValues
            rows={[
              {
                label: "Duplicates waiting for review",
                value:
                  refs.duplicates_pending > 0 ? (
                    <Link href="/admin/referrals" className="text-amber-700 hover:underline">
                      {fmtNum(refs.duplicates_pending)}
                    </Link>
                  ) : (
                    "0"
                  ),
              },
              { label: "Referred to a specific job", value: fmtNum(refs.job_referrals) },
            ]}
          />
        </div>
      </Panel>
    </>
  );
}

// ═══ Jobs and hiring requests ════════════════════════════════════════

export function JobsPanels({ a, scope }: { a: AdminAnalytics; scope: Scope }) {
  const j = a.jobs;
  const l = a.leads;
  const named = (rows: { key: string; count: number }[]) => rows.map((r) => ({ label: r.key === "unknown" ? "Not set" : sentence(r.key), value: r.count }));
  const states = j.open_by_state.map((r) => ({ label: r.key === "unknown" ? "Not set" : r.key, value: r.count }));
  const owners = j.by_account_manager.map((o) => ({
    label: o.name ?? "No owner yet",
    value: o.jobs,
    sub: `${fmtNum(o.open)} open`,
    href: o.id ? `/admin/team/${o.id}` : "/admin/jobs",
    color: o.id ? C.navy : C.amber,
  }));

  return (
    <>
      <SectionHeading id="jobs" title="Jobs and hiring requests" note={`${plural(j.open, "open job")} right now`} />

      <Panel title="Jobs by status" subtitle={`${plural(j.total, "job")} in total`} action={<PanelLink href="/admin/jobs">Jobs</PanelLink>}>
        <Donut data={toSlices(j.by_status, { labels: JOB_STATUS_LABEL, colors: JOB_STATUS_COLOR })} {...DONUT} centerLabel="jobs" emptyLabel="No jobs posted yet" />
        <div className="mt-3">
          <KeyValues
            rows={[
              { label: "Average time open", value: j.avg_days_open != null ? `${fmtNum(Math.round(j.avg_days_open))} days` : "—" },
              { label: "Marked high or critical urgency", value: fmtNum(j.urgent_open) },
              { label: "Visible on the job board", value: fmtNum(j.public_open) },
              { label: "Average referral reward", value: j.avg_payout_cents != null ? fmtMoney(j.avg_payout_cents) : "—" },
              { label: `Added ${scope.when}`, value: fmtNum(j.new_in_period) },
            ]}
          />
        </div>
      </Panel>

      <Panel title="Open jobs by trade and state" subtitle="Where the demand is">
        <SubHeading>By trade</SubHeading>
        <BarList data={named(j.open_by_trade)} color={C.green} limit={6} emptyLabel="No open jobs" />
        <SubHeading className="mt-5">By state</SubHeading>
        <BarList data={states} color={C.cobalt} limit={6} emptyLabel="No open jobs" />
      </Panel>

      <Panel title="Hiring requests" subtitle="Companies asking Delta for people" action={<PanelLink href="/admin/companies">Requests</PanelLink>}>
        {l.total > 0 ? (
          <>
            <StackedBar data={toSlices(l.by_status, { labels: LEAD_LABEL, colors: LEAD_COLOR, hideZero: true })} />
            <div className="mt-3">
              <KeyValues
                rows={[
                  { label: `New ${scope.when}`, value: fmtNum(l.new_in_period) },
                  ...(l.new_previous != null && scope.days != null ? [{ label: `New in the ${scope.days} days before`, value: fmtNum(l.new_previous) }] : []),
                  { label: "Waiting for a first call", value: fmtNum(l.waiting) },
                  { label: "Still open", value: fmtNum(l.open) },
                  { label: "People asked for on open requests", value: fmtNum(l.positions_open) },
                  { label: "Won", value: fmtNum(l.won) },
                ]}
              />
            </div>
          </>
        ) : (
          <EmptyNote>No hiring requests yet. When a company asks Delta for people, it shows up here.</EmptyNote>
        )}
      </Panel>

      <Panel title="Jobs by account manager" subtitle="Who owns the open work" action={<PanelLink href="/admin/team">Team</PanelLink>}>
        <BarList data={owners} color={C.navy} limit={8} emptyLabel="No jobs posted yet" />
      </Panel>

      <Panel className={span.wide} bodyClassName="px-0 pb-2 pt-3" title="Busiest jobs" subtitle="Top 10 by applications and referrals received" action={<PanelLink href="/admin/jobs">All jobs</PanelLink>}>
        {j.top.length ? (
          <PanelTable minWidth={560} head={[{ label: "Job" }, { label: "Status" }, { label: "Owner" }, { label: "Applications", right: true }, { label: "Referrals", right: true }]}>
            {j.top.map((t) => (
              <tr key={t.id}>
                <td className={cell}>
                  <Link href={`/admin/jobs/${t.id}/edit`} className="font-medium text-ecrn-ink hover:underline">
                    {t.title}
                  </Link>
                  <div className="text-[12px] text-ecrn-secondary">{[t.company, t.location].filter(Boolean).join(" · ") || "No company or location set"}</div>
                </td>
                <td className={cell}>
                  <Pill tone={JOB_PILL[t.status as keyof typeof JOB_PILL] ?? "neutral"}>{JOB_STATUS_LABEL[t.status] ?? sentence(t.status)}</Pill>
                </td>
                <td className={cell}>{t.owner_name ?? <span className="text-amber-700">No owner yet</span>}</td>
                <td className={cellNum}>
                  <Num n={t.applications} />
                </td>
                <td className={cellNum}>
                  <Num n={t.referrals} />
                </td>
              </tr>
            ))}
          </PanelTable>
        ) : (
          <div className="px-5 pb-3">
            <EmptyNote>No jobs posted yet.</EmptyNote>
          </div>
        )}
      </Panel>
    </>
  );
}

// ═══ Referral payouts ════════════════════════════════════════════════

export function PayoutPanels({ a }: { a: AdminAnalytics }) {
  const p = a.payouts;
  const owed = p.pending_cents + p.approved_cents;
  const months = p.paid_by_month.map((m, i) => ({ label: bucketLabel(m.bucket, "month", i), value: Math.round(m.cents / 100) }));
  // Always show the three live statuses; denied and disputed only when they exist.
  const rows = p.by_status
    .filter((s) => s.count > 0 || ["pending", "approved", "paid"].includes(s.key))
    .map((s) => ({ label: PAYOUT_LABEL[s.key] ?? sentence(s.key), count: s.count, cents: s.cents, color: PAYOUT_COLOR[s.key] ?? C.slate }));

  return (
    <>
      <SectionHeading id="payouts" title="Referral payouts" note={`${fmtMoney(owed)} owed right now, ${fmtMoney(p.paid_cents)} paid so far`} />

      <Panel className={span.wide} title="Paid out per month" subtitle="Referral rewards paid to members, last 12 months, in dollars" action={<PanelLink href="/admin/payouts">Payouts</PanelLink>}>
        <ColumnChart data={months} color={C.green} height={190} emptyLabel="No payouts paid in the last 12 months" />
      </Panel>

      <Panel className={span.lgWide} title="Payouts by status" subtitle={`${plural(p.total, "payout")} in total`}>
        <MoneyBreakdown rows={rows} formatMoney={fmtMoney} emptyLabel="No payouts yet. One is created when a referred candidate is placed." />
        <div className="mt-3">
          <KeyValues
            rows={[
              { label: "Average payout", value: p.avg_cents != null ? fmtMoney(p.avg_cents) : "—" },
              { label: "Largest payout", value: p.largest_cents != null ? fmtMoney(p.largest_cents) : "—" },
              ...(p.missing_amount > 0
                ? [
                    {
                      label: "Still need an amount set",
                      value: (
                        <Link href="/admin/payouts" className="text-amber-700 hover:underline">
                          {fmtNum(p.missing_amount)}
                        </Link>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      </Panel>
    </>
  );
}
