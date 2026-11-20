import Link from "next/link";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { CheckCircle2, ChevronRight, CircleDashed } from "lucide-react";
import {
  AdminHeader,
  AdminPage,
  DataTable,
  EmptyState,
  FilterTabs,
  Notice,
  Panel,
  Pill,
  StatCard,
  fmtDateTime,
  fmtNum,
  relTime,
  tdClass,
} from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { DispatchButton } from "@/components/admin/DispatchButton";
import { ActionButton } from "@/components/admin/integrations/ActionButton";
import { CopyButton } from "@/components/admin/integrations/CopyButton";
import { SimulatorForm, type SimulatorSample } from "@/components/admin/integrations/SimulatorForm";
import { requireAdmin } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isServiceClientConfigured } from "@/lib/supabase/service";
import {
  DEFAULT_DISPATCH_LIMIT,
  MAX_DELIVERY_ATTEMPTS,
  isOutboundSigned,
  isStaffingReferralsConfigured,
  toBullhorn,
  type OutboxRow,
} from "@/lib/integrations/staffing-referrals";
import { bullhornAuthMode, isBullhornConfigured } from "@/lib/integrations/bullhorn";
import { buildInboundSamples, type SampleContext } from "@/lib/integrations/samples";
import {
  CANDIDATE_STATUS_GROUPS,
  DIRECTION_LABEL,
  EMPLOYMENT_TYPE_ROWS,
  FIELD_MAPPINGS,
  INBOUND_EVENTS,
  JOB_STATUS_GROUPS,
  OUTBOUND_EVENTS,
  SUBMISSION_STATUS_GROUPS,
  type StatusGroup,
} from "@/lib/integrations/mapping";
import { clearSimulatedMirrorAction, pullBullhornNowAction, rerunInboxAction, retryOutboxAction } from "./actions";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Json = Record<string, any>;
type PillTone = "neutral" | "green" | "blue" | "cobalt" | "amber" | "red" | "dark";

const TABS = [
  { key: "outbox", label: "Outbox" },
  { key: "inbox", label: "Inbox" },
  { key: "mirror", label: "Bullhorn mirror" },
  { key: "simulator", label: "Simulator" },
  { key: "mapping", label: "Field mapping" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

const OUTBOX_STATUSES = ["queued", "sent", "failed", "skipped"] as const;
const INBOX_STATUSES = ["received", "applied", "ignored", "failed"] as const;
const MIRROR_ENTITIES = ["CorporateUser", "JobOrder", "Candidate", "JobSubmission", "Placement"] as const;
const MIRROR_LABEL: Record<string, string> = {
  CorporateUser: "Team (CorporateUser)",
  JobOrder: "Jobs (JobOrder)",
  Candidate: "People (Candidate)",
  JobSubmission: "Submissions",
  Placement: "Placements",
};
const PAGE_SIZE = 50;

const OUTBOX_TONE: Record<string, PillTone> = { queued: "amber", sent: "green", failed: "red", skipped: "neutral" };
const INBOX_TONE: Record<string, PillTone> = { received: "blue", applied: "green", ignored: "neutral", failed: "red" };

interface InboxRow {
  id: string;
  provider: string;
  event_type: string;
  external_id: string | null;
  payload: Json;
  status: string;
  result: Json | null;
  error: string | null;
  received_at: string;
  processed_at: string | null;
}
interface MirrorRow {
  provider: string;
  entity_type: string;
  external_id: string;
  data: Json;
  ecrn_table: string | null;
  ecrn_id: string | null;
  synced_at: string;
}

function href(params: Record<string, string | number | null | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== null && v !== undefined && v !== "") q.set(k, String(v));
  const s = q.toString();
  return s ? `/admin/sync?${s}` : "/admin/sync";
}

async function countRows(sb: SupabaseClient, table: string, filter: Record<string, string> = {}): Promise<number> {
  let q = sb.from(table).select("*", { count: "exact", head: true });
  for (const [col, value] of Object.entries(filter)) q = q.eq(col, value);
  const { count } = await q;
  return count ?? 0;
}

export default async function AdminIntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string; page?: string; notice?: string; error?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const tab: TabKey = TABS.some((t) => t.key === sp.tab) ? (sp.tab as TabKey) : "outbox";
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1);
  const sb = await createSupabaseServerClient();

  // Where this request came in, so the webhook URL shown is the one that works today.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "ecrn.com";
  const proto = h.get("x-forwarded-proto") ?? (/^(localhost|127\.)/.test(host) ? "http" : "https");
  const origin = `${proto.split(",")[0].trim()}://${host.split(",")[0].trim()}`;
  const inboundUrl = `${origin}/api/integrations/staffing-referrals`;
  const dispatchUrl = `${origin}/api/integrations/dispatch`;

  const outboundConfigured = isStaffingReferralsConfigured();
  const outboundSigned = isOutboundSigned();
  const secretSet = Boolean(process.env.STAFFING_REFERRALS_SECRET);
  const serviceKeySet = isServiceClientConfigured();
  const inboundReady = secretSet && serviceKeySet;
  const cronReady = Boolean(process.env.CRON_SECRET) && serviceKeySet;
  const bullhornConfigured = isBullhornConfigured();
  const bullhornMode = bullhornAuthMode();
  const bullhornKeySet = Boolean(process.env.BULLHORN_CLIENT_ID && process.env.BULLHORN_CLIENT_SECRET);
  const bullhornUserSet = Boolean((process.env.BULLHORN_USERNAME && process.env.BULLHORN_PASSWORD) || process.env.BULLHORN_REFRESH_TOKEN);

  const [outboxCounts, inboxCounts, lastSentRes, lastReceivedRes, bullhornRowRes] = await Promise.all([
    Promise.all(OUTBOX_STATUSES.map((s) => countRows(sb, "integration_outbox", { status: s }))),
    Promise.all(INBOX_STATUSES.map((s) => countRows(sb, "integration_inbox", { status: s }))),
    sb.from("integration_outbox").select("sent_at").eq("status", "sent").order("sent_at", { ascending: false }).limit(1),
    sb.from("integration_inbox").select("received_at").order("received_at", { ascending: false }).limit(1),
    sb.from("integrations").select("last_synced_at").eq("provider", "bullhorn").limit(1),
  ]);
  const outbox = Object.fromEntries(OUTBOX_STATUSES.map((s, i) => [s, outboxCounts[i]])) as Record<(typeof OUTBOX_STATUSES)[number], number>;
  const inbox = Object.fromEntries(INBOX_STATUSES.map((s, i) => [s, inboxCounts[i]])) as Record<(typeof INBOX_STATUSES)[number], number>;
  const outboxTotal = outboxCounts.reduce((a, b) => a + b, 0);
  const inboxTotal = inboxCounts.reduce((a, b) => a + b, 0);
  const lastSent = (lastSentRes.data?.[0]?.sent_at as string | undefined) ?? null;
  const lastReceived = (lastReceivedRes.data?.[0]?.received_at as string | undefined) ?? null;
  const lastBullhornPull = (bullhornRowRes.data?.[0]?.last_synced_at as string | undefined) ?? null;

  return (
    <AdminPage>
      <AdminHeader
        eyebrow="System"
        title="Integrations"
        subtitle={`ECRN queues every sign-up, referral and application for Staffing Referrals, which feeds Bullhorn and Sense. Updates from Bullhorn come back through the inbound webhook.${
          outboundConfigured && inboundReady ? "" : " Until the connections exist, events wait here and nothing is lost."
        }`}
      />

      <FormMessage error={sp.error} message={sp.notice} />

      {/* ── Connections ─────────────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <Panel
          title="Staffing Referrals: outbound"
          subtitle="ECRN → Staffing Referrals → Bullhorn"
          action={<Pill tone={outboundConfigured ? "green" : "amber"}>{outboundConfigured ? "Connected" : "Not connected"}</Pill>}
        >
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="Queued" value={outbox.queued} href={href({ tab: "outbox", status: "queued" })} />
            <MiniStat label="Sent" value={outbox.sent} href={href({ tab: "outbox", status: "sent" })} />
            <MiniStat label="Failed" value={outbox.failed} href={href({ tab: "outbox", status: "failed" })} tone={outbox.failed > 0 ? "red" : undefined} />
          </div>
          <ul className="mt-3 space-y-1.5">
            <Check ok={outboundConfigured} label="Webhook URL" detail="STAFFING_REFERRALS_WEBHOOK_URL" />
            <Check ok={outboundSigned} label="Signing secret" detail="STAFFING_REFERRALS_SECRET" />
            <Check ok={cronReady} label="Scheduler secrets" detail="CRON_SECRET + SUPABASE_SECRET_KEY" />
          </ul>
          <p className="mt-3 text-[12.5px] text-ecrn-secondary">
            {outboundConfigured ? `Last delivery: ${lastSent ? relTime(lastSent) : "none yet"}.` : "Events stay queued until the webhook URL is added. Nothing is lost."}
          </p>
          <div className="mt-3">
            <DispatchButton disabled={!outboundConfigured} disabledHint="Available once the webhook URL is set." />
          </div>
        </Panel>

        <Panel
          title="Inbound webhook"
          subtitle="Bullhorn → Staffing Referrals → ECRN"
          action={<Pill tone={inboundReady ? "green" : "amber"}>{inboundReady ? "Ready" : "Not ready"}</Pill>}
        >
          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="Received" value={inboxTotal} href={href({ tab: "inbox" })} />
            <MiniStat label="Applied" value={inbox.applied} href={href({ tab: "inbox", status: "applied" })} />
            <MiniStat label="Failed" value={inbox.failed} href={href({ tab: "inbox", status: "failed" })} tone={inbox.failed > 0 ? "red" : undefined} />
          </div>
          <p className="mt-3 text-[12px] font-medium text-ecrn-ink">URL to give Staffing Referrals</p>
          <div className="mt-1 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-[8px] border border-ecrn-line bg-ecrn-paper px-2.5 py-1.5 font-mono text-[11.5px] text-ecrn-ink" title={inboundUrl}>
              {inboundUrl}
            </code>
            <CopyButton value={inboundUrl} />
          </div>
          <ul className="mt-3 space-y-1.5">
            <Check ok={secretSet} label="Shared secret" detail="STAFFING_REFERRALS_SECRET" />
            <Check ok={serviceKeySet} label="Database service key" detail="SUPABASE_SECRET_KEY" />
          </ul>
          <p className="mt-3 text-[12.5px] text-ecrn-secondary">
            {inboundReady
              ? `Last event: ${lastReceived ? relTime(lastReceived) : "none yet"}.`
              : "Until both are set the endpoint answers 503 and accepts nothing. Use the simulator to try it today."}
          </p>
        </Panel>

        <Panel
          title="Bullhorn direct API"
          subtitle="Optional second route, without Staffing Referrals"
          action={<Pill tone={bullhornConfigured ? "green" : "neutral"}>{bullhornConfigured ? "Configured" : "Not connected"}</Pill>}
        >
          <p className="text-[13px] leading-relaxed text-ecrn-secondary">
            {bullhornConfigured
              ? `Signing in with ${bullhornMode === "password" ? "the API user and password" : "a refresh token"}. ECRN can pull the team, jobs and placements itself.`
              : "No API credentials yet. The client is built and waiting: it signs in the way Bullhorn documents, then reads the team, jobs and placements into the same handlers the webhook uses."}
          </p>
          <ul className="mt-3 space-y-1.5">
            <Check ok={bullhornKeySet} label="API key" detail="BULLHORN_CLIENT_ID + BULLHORN_CLIENT_SECRET" />
            <Check ok={bullhornUserSet} label="API user" detail="BULLHORN_USERNAME + BULLHORN_PASSWORD" />
          </ul>
          {bullhornConfigured && (
            <>
              <p className="mt-3 text-[12.5px] text-ecrn-secondary">Last pull: {lastBullhornPull ? relTime(lastBullhornPull) : "never"}.</p>
              <div className="mt-3">
                <ActionButton action={pullBullhornNowAction} label="Pull from Bullhorn now" variant="secondary" />
              </div>
            </>
          )}
        </Panel>

        <Panel title="Sense" subtitle="Texts and emails" action={<Pill tone="blue">Runs from Bullhorn</Pill>}>
          <p className="text-[13px] leading-relaxed text-ecrn-secondary">
            Sense sends Delta&apos;s texts and emails. It works from Bullhorn and Staffing Referrals, so ECRN does not connect to it directly and
            never sends outreach itself.
          </p>
          <p className="mt-3 text-[13px] leading-relaxed text-ecrn-secondary">
            Once people from ECRN reach Bullhorn with their owner and recruiter attached, Sense can message them from the right person. Nothing to
            set up here.
          </p>
        </Panel>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <nav aria-label="Integration views" className="flex flex-wrap gap-x-6 gap-y-1 border-b border-ecrn-line">
        {TABS.map((t) => {
          const count = t.key === "outbox" ? outbox.queued : t.key === "inbox" ? inboxTotal : null;
          return (
            <Link
              key={t.key}
              href={href({ tab: t.key })}
              aria-current={tab === t.key ? "page" : undefined}
              className={
                tab === t.key
                  ? "-mb-px border-b-2 border-ecrn-green-text pb-2.5 text-[14px] font-semibold text-ecrn-ink"
                  : "-mb-px border-b-2 border-transparent pb-2.5 text-[14px] font-medium text-ecrn-secondary hover:text-ecrn-ink"
              }
            >
              {t.label}
              {count != null && count > 0 && <span className="ml-1.5 tabular-nums text-ecrn-secondary">{fmtNum(count)}</span>}
            </Link>
          );
        })}
      </nav>

      {tab === "outbox" && <OutboxTab sb={sb} status={sp.status} page={page} counts={outbox} total={outboxTotal} configured={outboundConfigured} />}
      {tab === "inbox" && <InboxTab sb={sb} status={sp.status} page={page} counts={inbox} total={inboxTotal} />}
      {tab === "mirror" && <MirrorTab sb={sb} />}
      {tab === "simulator" && <SimulatorTab sb={sb} />}
      {tab === "mapping" && <MappingTab dispatchUrl={dispatchUrl} />}
    </AdminPage>
  );
}

// ═══ Small pieces ════════════════════════════════════════════════════

function MiniStat({ label, value, href: to, tone }: { label: string; value: number; href: string; tone?: "red" }) {
  return (
    <Link href={to} className="rounded-[12px] border border-ecrn-line px-3 py-2 hover:border-ecrn-green transition-colors">
      <div className="text-[11.5px] text-ecrn-secondary">{label}</div>
      <div className={`font-display text-[20px] font-semibold tabular-nums leading-tight ${tone === "red" ? "text-red-700" : "text-ecrn-ink"}`}>
        {fmtNum(value)}
      </div>
    </Link>
  );
}

function Check({ ok, label, detail }: { ok: boolean; label: string; detail?: string }) {
  return (
    <li className="flex items-start gap-2 text-[12.5px]">
      {ok ? (
        <CheckCircle2 className="mt-px h-4 w-4 shrink-0 text-ecrn-green-text" aria-hidden />
      ) : (
        <CircleDashed className="mt-px h-4 w-4 shrink-0 text-ecrn-secondary" aria-hidden />
      )}
      <span className="min-w-0">
        <span className="text-ecrn-ink">{label}</span>
        <span className="text-ecrn-secondary">: {ok ? "set" : "not set"}</span>
        {detail && <span className="block truncate font-mono text-[11px] text-ecrn-secondary">{detail}</span>}
      </span>
    </li>
  );
}

function JsonBlock({ label, value }: { label?: string; value: unknown }) {
  return (
    <div className="mt-3">
      {label && <p className="mb-1 text-[11.5px] font-medium uppercase tracking-wide text-ecrn-secondary">{label}</p>}
      <pre className="max-h-[420px] overflow-auto rounded-[10px] border border-ecrn-line bg-ecrn-paper p-3 font-mono text-[11.5px] leading-[1.55] text-ecrn-ink">
        {JSON.stringify(value ?? null, null, 2)}
      </pre>
    </div>
  );
}

function Pager({ page, total, params }: { page: number; total: number; params: Record<string, string | undefined> }) {
  if (total <= PAGE_SIZE) return null;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(total, page * PAGE_SIZE);
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-ecrn-line text-[12.5px] text-ecrn-secondary">
      <span>
        {fmtNum(Math.min(from, total))} to {fmtNum(to)} of {fmtNum(total)}
      </span>
      <span className="flex gap-3">
        {page > 1 && (
          <Link href={href({ ...params, page: page - 1 })} className="font-medium text-ecrn-green-text">
            Newer
          </Link>
        )}
        {to < total && (
          <Link href={href({ ...params, page: page + 1 })} className="font-medium text-ecrn-green-text">
            Older
          </Link>
        )}
      </span>
    </div>
  );
}

function ListShell({ children }: { children: ReactNode }) {
  return <section className="overflow-hidden rounded-[16px] border border-ecrn-line bg-white">{children}</section>;
}

// ═══ Outbox ══════════════════════════════════════════════════════════

/** One line that says what an outbound event is about, read from the exact payload that is sent. */
function describeOutbound(shaped: Json): string {
  const d: Json = shaped.data ?? {};
  const person = [d.firstName, d.lastName].filter(Boolean).join(" ");
  const parts: string[] = [];
  if (d.entity) parts.push(String(d.entity));
  if (person) parts.push(person);
  else if (d.companyName) parts.push(String(d.companyName));
  else if (d.jobOrder?.title) parts.push(String(d.jobOrder.title));
  if (d.customText?.confidential) parts.push("confidential");
  if (d.owner?.name) parts.push(`owner ${d.owner.name}`);
  if (d.assignedRecruiter?.name) parts.push(`recruiter ${d.assignedRecruiter.name}`);
  return parts.join(" · ");
}

async function OutboxTab({
  sb,
  status,
  page,
  counts,
  total,
  configured,
}: {
  sb: SupabaseClient;
  status?: string;
  page: number;
  counts: Record<(typeof OUTBOX_STATUSES)[number], number>;
  total: number;
  configured: boolean;
}) {
  const active = OUTBOX_STATUSES.find((s) => s === status) ?? null;
  let q = sb
    .from("integration_outbox")
    .select("*")
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (active) q = q.eq("status", active);
  const { data, error } = await q;
  const rows = (data ?? []) as OutboxRow[];
  const shown = active ? counts[active] : total;
  const back = href({ tab: "outbox", status: active ?? undefined, page: page > 1 ? page : undefined });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterTabs
          tabs={[
            { label: "All", href: href({ tab: "outbox" }), active: !active, count: total },
            ...OUTBOX_STATUSES.map((s) => ({ label: s[0].toUpperCase() + s.slice(1), href: href({ tab: "outbox", status: s }), active: active === s, count: counts[s] })),
          ]}
        />
        {counts.failed > 0 && (
          <form action={retryOutboxAction}>
            <input type="hidden" name="id" value="all" />
            <input type="hidden" name="back" value={back} />
            <Button type="submit" size="sm" variant="secondary">
              Retry all failed ({fmtNum(counts.failed)})
            </Button>
          </form>
        )}
      </div>

      {!configured && counts.queued > 0 && (
        <Notice tone="amber">
          {fmtNum(counts.queued)} event{counts.queued === 1 ? " is" : "s are"} waiting. They are sent in order as soon as the Staffing Referrals webhook URL is
          added. Open any row to see exactly what will be sent.
        </Notice>
      )}
      {error && <Notice tone="amber">The outbox could not be loaded: {error.message}</Notice>}

      <ListShell>
        {rows.length === 0 ? (
          <EmptyState
            title={active ? `No ${active} events` : "No events yet"}
            body={
              active === "skipped"
                ? "Skipped events are demo data and echoes of changes that came from Bullhorn. They are never sent."
                : "Events appear here as people sign up, refer, apply, and as owners are assigned."
            }
          />
        ) : (
          <ul className="divide-y divide-ecrn-line">
            {rows.map((r) => {
              const shaped = toBullhorn(r);
              return (
                <li key={r.id}>
                  <details className="group">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 hover:bg-ecrn-paper/60 [&::-webkit-details-marker]:hidden">
                      <ChevronRight className="h-4 w-4 shrink-0 text-ecrn-secondary transition-transform group-open:rotate-90" aria-hidden />
                      <Pill tone={OUTBOX_TONE[r.status] ?? "neutral"}>{r.status}</Pill>
                      <span className="w-[200px] shrink-0 truncate font-mono text-[12px] text-ecrn-secondary">{r.event_type}</span>
                      <span className="min-w-0 flex-1 basis-[220px] truncate text-[13.5px] text-ecrn-ink">{describeOutbound(shaped) || "Event"}</span>
                      <span className="shrink-0 text-[12px] text-ecrn-secondary" title={fmtDateTime(r.created_at)}>
                        {relTime(r.created_at)}
                      </span>
                    </summary>
                    <div className="px-5 pb-4 pl-12">
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12.5px] text-ecrn-secondary">
                        <span>Queued {fmtDateTime(r.created_at)}</span>
                        {r.sent_at && <span>Sent {fmtDateTime(r.sent_at)}</span>}
                        <span>
                          Attempts {r.attempts} of {MAX_DELIVERY_ATTEMPTS}
                        </span>
                        <span className="font-mono text-[11.5px]">{r.id}</span>
                      </div>
                      {r.last_error && (
                        <p className={`mt-2 text-[12.5px] ${r.status === "failed" ? "text-red-700" : "text-ecrn-secondary"}`}>
                          {r.status === "failed" ? "Last error: " : ""}
                          {r.last_error}
                        </p>
                      )}
                      {r.status === "failed" && (
                        <form action={retryOutboxAction} className="mt-3">
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="back" value={back} />
                          <Button type="submit" size="sm" variant="secondary">
                            Retry
                          </Button>
                        </form>
                      )}
                      <JsonBlock label="Sent to Staffing Referrals (Bullhorn-shaped)" value={shaped} />
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
        <Pager page={page} total={shown} params={{ tab: "outbox", status: active ?? undefined }} />
      </ListShell>

      <p className="text-[12.5px] text-ecrn-secondary">
        Each run delivers up to {DEFAULT_DISPATCH_LIMIT} events, oldest first. A failed event is retried automatically up to {MAX_DELIVERY_ATTEMPTS} times,
        then waits here for a manual retry.
      </p>
    </div>
  );
}

// ═══ Inbox ═══════════════════════════════════════════════════════════

const PROVIDER_LABEL: Record<string, string> = {
  staffing_referrals: "Staffing Referrals",
  bullhorn: "Bullhorn API",
  simulator: "Simulator",
};

async function InboxTab({
  sb,
  status,
  page,
  counts,
  total,
}: {
  sb: SupabaseClient;
  status?: string;
  page: number;
  counts: Record<(typeof INBOX_STATUSES)[number], number>;
  total: number;
}) {
  const active = INBOX_STATUSES.find((s) => s === status) ?? null;
  let q = sb
    .from("integration_inbox")
    .select("*")
    .order("received_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (active) q = q.eq("status", active);
  const { data, error } = await q;
  const rows = (data ?? []) as InboxRow[];
  const shown = active ? counts[active] : total;
  const back = href({ tab: "inbox", status: active ?? undefined, page: page > 1 ? page : undefined });

  return (
    <div className="space-y-4">
      <FilterTabs
        tabs={[
          { label: "All", href: href({ tab: "inbox" }), active: !active, count: total },
          ...INBOX_STATUSES.map((s) => ({ label: s[0].toUpperCase() + s.slice(1), href: href({ tab: "inbox", status: s }), active: active === s, count: counts[s] })),
        ]}
      />
      {error && <Notice tone="amber">The inbox could not be loaded: {error.message}</Notice>}

      <ListShell>
        {rows.length === 0 ? (
          <EmptyState
            title={active ? `No ${active} events` : "Nothing received yet"}
            body="Events from Staffing Referrals and Bullhorn land here before they are applied, so nothing is lost. Try one now in the simulator."
            action={
              <Link href={href({ tab: "simulator" })} className="text-[13.5px] font-medium text-ecrn-green-text">
                Open the simulator
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-ecrn-line">
            {rows.map((r) => {
              const summary = typeof r.result?.summary === "string" ? r.result.summary : null;
              const notes: string[] = Array.isArray(r.result?.notes) ? r.result.notes.map(String) : [];
              return (
                <li key={r.id}>
                  <details className="group">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 px-5 py-3 hover:bg-ecrn-paper/60 [&::-webkit-details-marker]:hidden">
                      <ChevronRight className="h-4 w-4 shrink-0 text-ecrn-secondary transition-transform group-open:rotate-90" aria-hidden />
                      <Pill tone={INBOX_TONE[r.status] ?? "neutral"}>{r.status}</Pill>
                      <span className="w-[170px] shrink-0 truncate font-mono text-[12px] text-ecrn-secondary">{r.event_type}</span>
                      <span className="min-w-0 flex-1 basis-[220px] truncate text-[13.5px] text-ecrn-ink">{r.error ?? summary ?? "Waiting to be applied"}</span>
                      {r.provider === "simulator" && <Pill tone="blue">Simulated</Pill>}
                      <span className="shrink-0 text-[12px] text-ecrn-secondary" title={fmtDateTime(r.received_at)}>
                        {relTime(r.received_at)}
                      </span>
                    </summary>
                    <div className="px-5 pb-4 pl-12">
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[12.5px] text-ecrn-secondary">
                        <span>From {PROVIDER_LABEL[r.provider] ?? r.provider}</span>
                        <span>Received {fmtDateTime(r.received_at)}</span>
                        {r.processed_at && <span>Processed {fmtDateTime(r.processed_at)}</span>}
                        {r.external_id && <span className="font-mono text-[11.5px]">{r.external_id}</span>}
                      </div>
                      {r.error && <p className="mt-2 text-[12.5px] text-red-700">Error: {r.error}</p>}
                      {notes.length > 0 && (
                        <ul className="mt-2 space-y-1 text-[12.5px] text-amber-800">
                          {notes.map((n, i) => (
                            <li key={i}>{n}</li>
                          ))}
                        </ul>
                      )}
                      {r.status !== "applied" && (
                        <form action={rerunInboxAction} className="mt-3">
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="back" value={back} />
                          <Button type="submit" size="sm" variant="secondary">
                            Run again
                          </Button>
                        </form>
                      )}
                      <JsonBlock label="Payload received" value={r.payload} />
                      {r.result && <JsonBlock label="Result" value={r.result} />}
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
        <Pager page={page} total={shown} params={{ tab: "inbox", status: active ?? undefined }} />
      </ListShell>

      <p className="text-[12.5px] text-ecrn-secondary">
        Applied: ECRN was updated. Ignored: nothing in ECRN matched, or the event type has no handler. Failed: the reason is on the row, and it can be run
        again once fixed. A repeat of the same event id is never applied twice.
      </p>
    </div>
  );
}

// ═══ Bullhorn mirror ═════════════════════════════════════════════════

function ecrnLink(table: string | null, id: string | null): ReactNode {
  if (!table || !id) return <span className="text-ecrn-secondary">Not linked</span>;
  const label = table.replace(/_/g, " ");
  const to =
    table === "candidates"
      ? `/admin/candidates/${id}`
      : table === "jobs"
        ? `/admin/jobs/${id}/edit`
        : table === "staff"
          ? `/admin/team/${id}`
          : table === "job_applications"
            ? "/admin/applications"
            : table === "job_referrals"
              ? "/admin/referrals"
              : null;
  return to ? (
    <Link href={to} className="font-medium text-ecrn-green-text">
      {label}
    </Link>
  ) : (
    <span className="text-ecrn-ink">{label}</span>
  );
}

function mirrorTitle(row: MirrorRow): string {
  const d = row.data ?? {};
  const person = [d.firstName, d.lastName].filter(Boolean).join(" ") || d.name;
  if (person) return String(person);
  if (d.title) return String(d.title);
  if (d.status) return String(d.status);
  return "";
}

async function MirrorTab({ sb }: { sb: SupabaseClient }) {
  const [entityCounts, total, simulated, latest] = await Promise.all([
    Promise.all(MIRROR_ENTITIES.map((e) => countRows(sb, "crm_records", { entity_type: e }))),
    countRows(sb, "crm_records"),
    countRows(sb, "crm_records", { provider: "simulator" }),
    sb.from("crm_records").select("*").order("synced_at", { ascending: false }).limit(25),
  ]);
  const rows = (latest.data ?? []) as MirrorRow[];
  const other = Math.max(0, total - entityCounts.reduce((a, b) => a + b, 0));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {MIRROR_ENTITIES.map((e, i) => (
          <StatCard key={e} label={MIRROR_LABEL[e]} value={fmtNum(entityCounts[i])} />
        ))}
        <StatCard label="Other records" value={fmtNum(other)} />
      </div>

      {simulated > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-delta-surface px-4 py-3 text-[13.5px] text-navy">
          <span>
            {fmtNum(simulated)} of these record{simulated === 1 ? "" : "s"} came from the simulator, not from Bullhorn.
          </span>
          <form action={clearSimulatedMirrorAction}>
            <input type="hidden" name="back" value={href({ tab: "mirror" })} />
            <Button type="submit" size="sm" variant="secondary">
              Clear simulated records
            </Button>
          </form>
        </div>
      )}

      <DataTable
        head={["Type", "Bullhorn id", "Record", "Linked in ECRN", "Source", "Synced", ""]}
        empty={
          rows.length === 0 ? (
            <EmptyState
              title="The mirror is empty"
              body="Every record Bullhorn sends (team, jobs, people, submissions, placements) is kept here in full, even fields ECRN has no screen for yet."
            />
          ) : undefined
        }
      >
        {rows.map((r) => (
          <tr key={`${r.provider}:${r.entity_type}:${r.external_id}`}>
            <td className={tdClass}>
              <span className="font-medium text-ecrn-ink">{r.entity_type}</span>
            </td>
            <td className={`${tdClass} font-mono text-[12.5px]`}>{r.external_id}</td>
            <td className={`${tdClass} max-w-[260px] truncate`}>{mirrorTitle(r) || <span className="text-ecrn-secondary">No name</span>}</td>
            <td className={tdClass}>{ecrnLink(r.ecrn_table, r.ecrn_id)}</td>
            <td className={tdClass}>{r.provider === "simulator" ? <Pill tone="blue">Simulated</Pill> : <Pill>Bullhorn</Pill>}</td>
            <td className={`${tdClass} whitespace-nowrap text-ecrn-secondary`} title={fmtDateTime(r.synced_at)}>
              {relTime(r.synced_at)}
            </td>
            <td className={tdClass}>
              <details>
                <summary className="cursor-pointer text-[12.5px] font-medium text-ecrn-green-text">Raw</summary>
                <pre className="mt-2 max-h-[320px] w-[min(520px,70vw)] overflow-auto rounded-[10px] border border-ecrn-line bg-ecrn-paper p-3 font-mono text-[11.5px] leading-[1.55] text-ecrn-ink">
                  {JSON.stringify(r.data, null, 2)}
                </pre>
              </details>
            </td>
          </tr>
        ))}
      </DataTable>
      {rows.length > 0 && <p className="text-[12.5px] text-ecrn-secondary">Showing the 25 most recently synced records of {fmtNum(total)}.</p>}
    </div>
  );
}

// ═══ Simulator ═══════════════════════════════════════════════════════

async function SimulatorTab({ sb }: { sb: SupabaseClient }) {
  // Aim the samples at real ECRN records so the result is visible on the other admin screens.
  const { data: apps } = await sb.from("job_applications").select("id, candidate_id, job_id").order("created_at", { ascending: false }).limit(1);
  const app = apps?.[0] ?? null;
  const candidateQuery = sb.from("candidates").select("id, first_name, last_name, email");
  const { data: candidates } = app
    ? await candidateQuery.eq("id", app.candidate_id).limit(1)
    : await candidateQuery
        .not("status", "in", "(placed,payout_pending,payout_approved,payout_paid)")
        .order("created_at", { ascending: false })
        .limit(1);
  const jobQuery = sb.from("jobs").select("id, title");
  const { data: jobs } = app ? await jobQuery.eq("id", app.job_id).limit(1) : await jobQuery.order("created_at", { ascending: false }).limit(1);
  const candidate = candidates?.[0] ?? null;
  const job = jobs?.[0] ?? null;

  const context: SampleContext = {
    candidate: candidate ? { id: candidate.id, name: `${candidate.first_name} ${candidate.last_name}`.trim(), email: candidate.email ?? null } : null,
    job: job ? { id: job.id, title: job.title } : null,
    application: app ? { id: app.id, candidateId: app.candidate_id, jobId: app.job_id } : null,
  };
  const samples: SimulatorSample[] = buildInboundSamples(context).map((s) => ({
    key: s.key,
    type: s.type,
    label: s.label,
    description: s.description,
    json: JSON.stringify(s.event, null, 2),
  }));

  return (
    <div className="space-y-4">
      <Notice tone="blue">
        The simulator plays the part of Bullhorn. It runs an event through the same handlers as a live webhook, using your admin session, and records
        it in the inbox as simulated. <strong className="font-semibold">It changes real ECRN records</strong> (team, jobs, statuses, payouts), so use the
        samples as they are or point them at test people. Sample Bullhorn ids start at 900000 and sample people use example.com emails, which makes them
        easy to find and remove.
      </Notice>
      <Panel
        title="Send a sample event"
        subtitle={
          context.candidate
            ? `Person samples are aimed at ${context.candidate.name}${context.application ? " (the most recent application)" : " (the most recent person not yet placed)"}.`
            : "There are no people in ECRN yet, so the person samples need an id pasted in."
        }
      >
        <SimulatorForm samples={samples} />
      </Panel>
      <p className="text-[12.5px] text-ecrn-secondary">
        Suggested order for the full loop: account manager, recruiter, job, link the person, update the person, submission, placement. Then look at Team,
        Jobs, the person&apos;s page, Payouts, and the Inbox and Bullhorn mirror tabs here.
      </p>
    </div>
  );
}

// ═══ Field mapping ═══════════════════════════════════════════════════

function StatusTable<T extends string>({ title, subtitle, groups }: { title: string; subtitle: string; groups: StatusGroup<T>[] }) {
  return (
    <div>
      <h3 className="font-display text-[15px] font-semibold text-ecrn-ink">{title}</h3>
      <p className="mt-0.5 mb-2 text-[12.5px] text-ecrn-secondary">{subtitle}</p>
      <DataTable head={["Bullhorn says", "ECRN shows", "Note"]}>
        {groups.map((g, i) => (
          <tr key={i}>
            <td className={tdClass}>{g.bullhorn.join(", ")}</td>
            <td className={`${tdClass} whitespace-nowrap`}>{g.ecrn ? <Pill tone="green">{g.ecrn.replace(/_/g, " ")}</Pill> : <Pill>no change</Pill>}</td>
            <td className={`${tdClass} text-ecrn-secondary`}>{g.note ?? ""}</td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}

function MappingTab({ dispatchUrl }: { dispatchUrl: string }) {
  return (
    <div className="space-y-8">
      <Notice tone="blue">
        This is how ECRN fields line up with Bullhorn&apos;s. Outbound names follow Bullhorn&apos;s REST entities so Staffing Referrals can map them one to
        one. Status wording is configurable in Bullhorn, so these tables need a check against Delta&apos;s account before go-live. The full hand-off
        document with sample payloads is <span className="font-mono text-[12.5px]">docs/BULLHORN_INTEGRATION.md</span>.
      </Notice>

      {FIELD_MAPPINGS.map((m) => (
        <div key={m.entity}>
          <h2 className="font-display text-[17px] font-semibold text-ecrn-ink">
            {m.entity} <span className="font-normal text-ecrn-secondary">↔ {m.ecrnTable}</span>
          </h2>
          <p className="mt-0.5 mb-2 max-w-3xl text-[13px] text-ecrn-secondary">{m.summary}</p>
          <DataTable head={["ECRN", "Direction", "Bullhorn", "Notes"]}>
            {m.rows.map((r, i) => (
              <tr key={i}>
                <td className={`${tdClass} font-mono text-[12.5px] text-ecrn-ink`}>{r.ecrn}</td>
                <td className={`${tdClass} whitespace-nowrap`}>
                  <Pill tone={r.direction === "out" ? "green" : r.direction === "in" ? "blue" : "neutral"}>{DIRECTION_LABEL[r.direction]}</Pill>
                </td>
                <td className={`${tdClass} font-mono text-[12.5px] text-ecrn-ink`}>{r.bullhorn}</td>
                <td className={`${tdClass} text-ecrn-secondary`}>{r.note ?? ""}</td>
              </tr>
            ))}
          </DataTable>
        </div>
      ))}

      <div className="space-y-6">
        <h2 className="font-display text-[17px] font-semibold text-ecrn-ink">Status mapping (Bullhorn → ECRN)</h2>
        <StatusTable
          title="Candidate status"
          subtitle="Candidate.status sets the person's ECRN status. Send ecrnStatus instead to set an ECRN value directly."
          groups={CANDIDATE_STATUS_GROUPS}
        />
        <StatusTable
          title="Submission status"
          subtitle="JobSubmission.status sets the application status the member sees."
          groups={SUBMISSION_STATUS_GROUPS}
        />
        <StatusTable
          title="Job status"
          subtitle="JobOrder.status sets the job status. If the wording is unknown, isOpen decides (true is open, false is archived)."
          groups={JOB_STATUS_GROUPS}
        />
        <div>
          <h3 className="font-display text-[15px] font-semibold text-ecrn-ink">Employment type</h3>
          <p className="mt-0.5 mb-2 text-[12.5px] text-ecrn-secondary">JobOrder.employmentType becomes the job type on the job board.</p>
          <DataTable head={["Bullhorn says", "ECRN shows"]}>
            {EMPLOYMENT_TYPE_ROWS.map((r) => (
              <tr key={r.bullhorn}>
                <td className={tdClass}>{r.bullhorn}</td>
                <td className={tdClass}>{r.ecrn}</td>
              </tr>
            ))}
          </DataTable>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-[17px] font-semibold text-ecrn-ink">Events ECRN sends</h2>
          <p className="mt-0.5 mb-2 text-[13px] text-ecrn-secondary">Written by database triggers, so no action in the app can skip them.</p>
          <DataTable head={["Event", "Bullhorn entity", "When"]}>
            {OUTBOUND_EVENTS.map((e) => (
              <tr key={e.type}>
                <td className={`${tdClass} whitespace-nowrap font-mono text-[12.5px] text-ecrn-ink`}>{e.type}</td>
                <td className={`${tdClass} whitespace-nowrap`}>{e.bullhornEntity}</td>
                <td className={`${tdClass} text-ecrn-secondary`}>{e.when}</td>
              </tr>
            ))}
          </DataTable>
        </div>
        <div>
          <h2 className="font-display text-[17px] font-semibold text-ecrn-ink">Events ECRN accepts</h2>
          <p className="mt-0.5 mb-2 text-[13px] text-ecrn-secondary">Anything else is stored in the inbox and marked ignored.</p>
          <DataTable head={["Event", "Bullhorn entity", "What ECRN does"]}>
            {INBOUND_EVENTS.map((e) => (
              <tr key={e.type}>
                <td className={`${tdClass} whitespace-nowrap font-mono text-[12.5px] text-ecrn-ink`}>{e.type}</td>
                <td className={`${tdClass} whitespace-nowrap`}>{e.bullhornEntity}</td>
                <td className={`${tdClass} text-ecrn-secondary`}>{e.when}</td>
              </tr>
            ))}
          </DataTable>
        </div>
      </div>

      <Panel title="Scheduled delivery" subtitle="For whoever sets up the scheduler">
        <p className="text-[13px] leading-relaxed text-ecrn-secondary">
          A scheduler calls this address every few minutes with the header <span className="font-mono text-[12px]">authorization: Bearer CRON_SECRET</span>.
          It sends whatever is queued, the same as the button above.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-[8px] border border-ecrn-line bg-ecrn-paper px-2.5 py-1.5 font-mono text-[11.5px] text-ecrn-ink">
            POST {dispatchUrl}
          </code>
          <CopyButton value={dispatchUrl} />
        </div>
      </Panel>
    </div>
  );
}
