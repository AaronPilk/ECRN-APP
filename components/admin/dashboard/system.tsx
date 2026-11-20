import Link from "next/link";
import type { ReactNode } from "react";
import { Notice, Panel, Pill, fmtNum, relTime } from "@/components/admin/ui";
import { BarList, KeyValues } from "@/components/admin/charts";
import type { ActivityEntry, AdminAnalytics } from "@/lib/admin/analytics";
import { C, PROVIDER_LABEL, plural, sentence } from "./labels";
import { EmptyNote, MiniStat, PanelLink, SectionHeading, SubHeading, span } from "./parts";

/** Dashboard sections about the plumbing: Bullhorn / Staffing Referrals sync and the activity feed. */

// ═══ Bullhorn / Staffing Referrals ═══════════════════════════════════

const CONNECTED = new Set(["active", "connected", "enabled", "ok"]);
const BROKEN = new Set(["error", "failed", "disconnected"]);

function ProviderStatus({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (CONNECTED.has(s)) return <Pill tone="green">Connected</Pill>;
  if (BROKEN.has(s)) return <Pill tone="red">Needs attention</Pill>;
  if (s === "inactive") return <Pill tone="amber">Not connected yet</Pill>;
  return <Pill>{sentence(status)}</Pill>;
}

export function IntegrationPanels({ a, scope }: { a: AdminAnalytics; scope: { when: string } }) {
  const i = a.integrations;
  const n = a.notifications;
  const bullhorn = i.providers.find((p) => p.provider === "bullhorn");
  const bullhornLive = bullhorn ? CONNECTED.has(bullhorn.status.toLowerCase()) : false;
  const events = i.outbox.by_event.map((e) => ({
    label: sentence(e.key),
    value: e.count,
    sub: e.failed > 0 ? `${fmtNum(e.failed)} failed` : e.queued > 0 ? `${fmtNum(e.queued)} waiting` : undefined,
    color: e.failed > 0 ? C.red : C.cobalt,
  }));
  const inbound = i.inbox.by_event.map((e) => ({ label: sentence(e.key), value: e.count }));
  const mirrored = i.crm.by_entity.map((e) => ({ label: sentence(e.key), value: e.count }));

  return (
    <>
      <SectionHeading id="integrations" title="Bullhorn and Staffing Referrals" note="Sync health, right now" />

      <Panel
        className={span.wide}
        title="Bullhorn / Staffing Referrals"
        subtitle="Recruiters keep working in Bullhorn. ECRN sends everything there and mirrors what comes back."
        action={<PanelLink href="/admin/sync">Integrations</PanelLink>}
      >
        {i.providers.length ? (
          <ul className="grid gap-2.5 sm:grid-cols-3">
            {i.providers.map((p) => (
              <li key={p.provider} className="rounded-[12px] border border-ecrn-line px-3.5 py-2.5">
                <div className="text-[13.5px] font-medium text-ecrn-ink">{PROVIDER_LABEL[p.provider] ?? sentence(p.provider)}</div>
                <div className="mt-1.5">
                  <ProviderStatus status={p.status} />
                </div>
                <div className="mt-1.5 text-[12px] text-ecrn-secondary">{p.last_synced_at ? `Last synced ${relTime(p.last_synced_at)}` : "Never synced"}</div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyNote>No integrations have been set up yet.</EmptyNote>
        )}

        <div className="mt-4">
          <Notice tone={bullhornLive ? "green" : "blue"}>
            {bullhornLive
              ? "Bullhorn is connected. Placements, submissions and interviews are mirrored below as they arrive."
              : "Placements, submissions and interviews from Bullhorn will appear here once the API is connected. Until then, everything that happens in ECRN is queued so nothing is lost."}{" "}
            <Link href="/admin/sync" className="font-medium underline underline-offset-2">
              Open integrations
            </Link>
          </Notice>
        </div>

        <div className="mt-5 grid gap-x-8 gap-y-5 md:grid-cols-2">
          <div>
            <SubHeading>Going out, ECRN to Staffing Referrals</SubHeading>
            <div className="grid grid-cols-3 gap-2.5">
              <MiniStat
                label="Waiting"
                value={fmtNum(i.outbox.queued)}
                hint={i.outbox.oldest_queued_at ? `Oldest ${relTime(i.outbox.oldest_queued_at)}` : "Queue is empty"}
                tone={i.outbox.queued > 0 ? "amber" : "default"}
                href="/admin/sync"
              />
              <MiniStat label="Sent" value={fmtNum(i.outbox.sent)} hint={i.outbox.last_sent_at ? `Last ${relTime(i.outbox.last_sent_at)}` : undefined} tone={i.outbox.sent > 0 ? "green" : "default"} />
              <MiniStat label="Failed" value={fmtNum(i.outbox.failed)} hint={i.outbox.skipped > 0 ? `${fmtNum(i.outbox.skipped)} skipped` : undefined} tone={i.outbox.failed > 0 ? "red" : "default"} href="/admin/sync" />
            </div>
          </div>
          <div>
            <SubHeading>Coming in, Bullhorn to ECRN</SubHeading>
            <div className="grid grid-cols-3 gap-2.5">
              <MiniStat label="Received" value={fmtNum(i.inbox.total)} hint={i.inbox.last_received_at ? `Last ${relTime(i.inbox.last_received_at)}` : undefined} />
              <MiniStat label="Applied" value={fmtNum(i.inbox.applied)} hint={i.inbox.received > 0 ? `${fmtNum(i.inbox.received)} waiting` : i.inbox.ignored > 0 ? `${fmtNum(i.inbox.ignored)} ignored` : undefined} tone={i.inbox.applied > 0 ? "green" : "default"} />
              <MiniStat label="Failed" value={fmtNum(i.inbox.failed)} tone={i.inbox.failed > 0 ? "red" : "default"} href="/admin/sync" />
            </div>
          </div>
          <div>
            <SubHeading>Bullhorn records mirrored in ECRN</SubHeading>
            <BarList data={mirrored} color={C.navy} limit={8} emptyLabel="None yet. Bullhorn users, job orders, candidates, submissions and placements will be listed here." />
          </div>
          <div>
            <SubHeading>ECRN records matched to Bullhorn</SubHeading>
            <KeyValues
              rows={[
                { label: "Team members with a Bullhorn user", value: `${fmtNum(i.linked.staff)} of ${fmtNum(a.team.staff.total)}` },
                { label: "Jobs with a Bullhorn job order", value: `${fmtNum(i.linked.jobs)} of ${fmtNum(a.jobs.total)}` },
                { label: "Candidates with a Bullhorn record", value: `${fmtNum(i.linked.candidates)} of ${fmtNum(a.pipeline.total)}` },
              ]}
            />
          </div>
        </div>
      </Panel>

      <Panel className={span.lgWide} title="Sync events by type" subtitle={`${plural(i.outbox.total, "event")} recorded for Staffing Referrals, ${fmtNum(i.outbox.in_period)} ${scope.when}`}>
        <BarList data={events} color={C.cobalt} limit={10} emptyLabel="No events yet. They are created as people sign up, refer and apply." />
        {inbound.length > 0 && (
          <>
            <SubHeading className="mt-5">Received from Bullhorn</SubHeading>
            <BarList data={inbound} color={C.navy} limit={6} />
          </>
        )}
        <SubHeading className="mt-5">Member notifications</SubHeading>
        <KeyValues
          rows={[
            { label: `Sent ${scope.when}`, value: fmtNum(n.in_period) },
            { label: "Sent all time", value: fmtNum(n.total) },
            { label: "Failed to send", value: n.failed > 0 ? <span className="text-red-700">{fmtNum(n.failed)}</span> : "0" },
          ]}
        />
      </Panel>
    </>
  );
}

// ═══ Recent activity ═════════════════════════════════════════════════

function subjectHref(e: ActivityEntry): string | null {
  if (!e.subject) return null;
  if (e.candidate_id) return `/admin/candidates/${e.candidate_id}`;
  if (!e.entity_id) return null;
  switch (e.entity_type) {
    case "profile":
      return `/admin/members/${e.entity_id}`;
    case "job":
      return `/admin/jobs/${e.entity_id}/edit`;
    case "company_lead":
      return `/admin/companies/${e.entity_id}`;
    case "staff":
      return `/admin/team/${e.entity_id}`;
    default:
      return null;
  }
}

function actorLine(e: ActivityEntry): ReactNode {
  if (e.actor_name) return e.actor_name === e.subject ? "By the member" : `By ${e.actor_name}`;
  return e.actor_id ? "By a deleted account" : "Automatic";
}

export function ActivityPanels({ a }: { a: AdminAnalytics }) {
  const rows = a.activity.recent;
  return (
    <>
      <SectionHeading id="activity" title="Recent activity" note="The latest 15 things that happened" />

      <Panel className={span.full} action={<PanelLink href="/admin/activity">All activity</PanelLink>} title="Latest events">
        {rows.length ? (
          <ol className="gap-x-10 md:columns-2">
            {rows.map((e) => {
              const href = subjectHref(e);
              return (
                <li key={e.id} className="break-inside-avoid border-b border-ecrn-line py-2.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 text-[13.5px] leading-snug text-ecrn-ink">
                      <span className="font-medium">{e.label}</span>
                      {e.subject && (
                        <>
                          <span className="text-ecrn-secondary"> · </span>
                          {href ? (
                            <Link href={href} className="hover:underline">
                              {e.subject}
                            </Link>
                          ) : (
                            e.subject
                          )}
                        </>
                      )}
                    </p>
                    <time dateTime={e.created_at} className="shrink-0 whitespace-nowrap text-[12px] tabular-nums text-ecrn-secondary">
                      {relTime(e.created_at)}
                    </time>
                  </div>
                  <p className="mt-0.5 text-[12px] text-ecrn-secondary">{actorLine(e)}</p>
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyNote>Nothing has happened yet. Sign-ups, referrals, applications and status changes will show up here.</EmptyNote>
        )}
      </Panel>
    </>
  );
}
