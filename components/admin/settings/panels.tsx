import Link from "next/link";
import type { ReactNode } from "react";
import { Check, Circle, Minus } from "lucide-react";
import { EmptyState, Notice, Panel, Pill, fmtDate, fmtNum, relTime } from "@/components/admin/ui";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormMessage";
import { Input } from "@/components/ui/Input";
import { addOwnerAction, removeOwnerAction } from "@/app/(app)/admin/settings/actions";
import type { Connections, LaunchFacts, OwnerRow } from "@/app/(app)/admin/settings/data";
import { cn } from "@/lib/utils/cn";
import { RemoveDemoDataForm } from "./RemoveDemoDataForm";
import { DEMO_COUNT_KEYS, DEMO_COUNT_LABEL, type DemoCounts } from "./shared";

/**
 * The four blocks of the Settings page. Server components: the only client
 * code is the "type REMOVE" form.
 */

const code = "rounded-[6px] bg-ecrn-paper px-1.5 py-0.5 font-mono text-[11.5px] text-ecrn-ink";
const linkClass = "font-medium text-ecrn-green-text underline-offset-2 hover:underline";

// ── owners ───────────────────────────────────────────────────────────

export function OwnersPanel({
  owners,
  listSize,
  loadError,
  message,
  error,
}: {
  owners: OwnerRow[];
  listSize: number;
  loadError: string | null;
  message?: string;
  error?: string;
}) {
  return (
    <div id="owners" className="scroll-mt-6">
      <Panel title="Owners (admin access)" subtitle="Anyone on this list becomes an admin when they sign up with that email.">
        <FormMessage error={error} message={message} className="mb-3" />
        {loadError ? (
          <Notice tone="amber">Couldn&apos;t load the owner list. {loadError}</Notice>
        ) : owners.length === 0 ? (
          <EmptyState title="No owners yet" body="Add the first owner email below." />
        ) : (
          <ul className="divide-y divide-ecrn-line">
            {owners.map((o) => (
              <OwnerItem key={o.email} owner={o} listSize={listSize} />
            ))}
          </ul>
        )}

        <form action={addOwnerAction} className="mt-4 flex flex-wrap items-end gap-2 border-t border-ecrn-line pt-4">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="owner-email" className="mb-1 block text-[12.5px] font-medium text-ecrn-ink">
              Add an owner
            </label>
            <Input
              id="owner-email"
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="off"
              placeholder="name@company.com"
              className="h-[42px] rounded-[12px] text-[14px]"
            />
          </div>
          <Button type="submit" size="sm" className="h-[42px]">
            Add owner
          </Button>
        </form>
        <p className="mt-2 text-[12.5px] text-ecrn-secondary">
          If that person already has an ECRN account, it gets admin access right away.
        </p>
      </Panel>
    </div>
  );
}

function OwnerItem({ owner: o, listSize }: { owner: OwnerRow; listSize: number }) {
  const lastOnList = o.onList && listSize <= 1;
  return (
    <li className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 py-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="break-all text-[14px] font-medium text-ecrn-ink">{o.email}</span>
          {o.isYou && <Pill tone="blue">You</Pill>}
          {o.isAdmin ? (
            <Pill tone="green">Admin</Pill>
          ) : o.account ? (
            <Pill tone="amber">Has an account, not an admin</Pill>
          ) : (
            <Pill>No account yet</Pill>
          )}
          {!o.onList && <Pill tone="amber">Not on the list</Pill>}
        </div>
        <p className="mt-0.5 text-[12.5px] text-ecrn-secondary">
          {o.account
            ? [o.account.name || null, `joined ${fmtDate(o.account.createdAt)}`, o.account.lastSeenAt ? `last seen ${relTime(o.account.lastSeenAt)}` : null]
                .filter(Boolean)
                .join(" · ")
            : "Becomes an admin when they sign up with this email."}
          {o.onList && o.addedAt ? ` Added ${fmtDate(o.addedAt)}.` : ""}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-3 text-[12.5px] text-ecrn-secondary">
        {o.onList && o.account && !o.isAdmin && (
          <form action={addOwnerAction}>
            <input type="hidden" name="email" value={o.email} />
            <Button type="submit" size="sm" variant="secondary">
              Give admin access
            </Button>
          </form>
        )}
        {o.isYou ? (
          <span>You can&apos;t remove yourself</span>
        ) : lastOnList ? (
          <span>Only owner on the list</span>
        ) : (
          <details className="text-right">
            <summary className="cursor-pointer list-none text-[13px] font-medium text-red-700 hover:underline [&::-webkit-details-marker]:hidden">
              Remove
            </summary>
            <form action={removeOwnerAction} className="mt-2 flex flex-wrap items-center justify-end gap-2">
              <input type="hidden" name="email" value={o.email} />
              <span>Take away admin access?</span>
              <Button type="submit" size="sm" variant="danger">
                Yes, remove
              </Button>
            </form>
          </details>
        )}
      </div>
    </li>
  );
}

// ── demo data ────────────────────────────────────────────────────────

export function DemoDataPanel({ counts, error }: { counts: DemoCounts | null; error: string | null }) {
  const kept = counts ? counts.kept.demoAccounts + counts.kept.sampleCandidates : 0;
  return (
    <div id="demo-data" className="scroll-mt-6">
      <Panel
        title="Demo data"
        subtitle="A fictional team, members, candidates and activity, loaded so the dashboards have something to show before launch."
        action={counts ? <Pill tone={counts.total > 0 ? "amber" : "green"}>{counts.total > 0 ? "Loaded" : "None"}</Pill> : undefined}
      >
        {!counts ? (
          <Notice tone="amber">Couldn&apos;t check for demo data. {error}</Notice>
        ) : (
          <>
            {counts.total > 0 ? (
              <div>
                <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                  {DEMO_COUNT_KEYS.map((key) => (
                    <div key={key} className="rounded-[12px] border border-ecrn-line px-3 py-2">
                      <dd className="font-display text-[20px] font-semibold leading-tight tabular-nums tracking-[-0.02em] text-ecrn-ink">
                        {fmtNum(counts[key])}
                      </dd>
                      <dt className="text-[12px] text-ecrn-secondary first-letter:uppercase">{DEMO_COUNT_LABEL[key].many}</dt>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-[13px] leading-relaxed text-ecrn-secondary">
                  Demo members use <span className={code}>seed.N@demo.goecrn.com</span> emails and 555 phone numbers. Their sync events are marked
                  skipped, so nothing demo is waiting to go to Bullhorn. Remove the demo data before you connect Staffing Referrals.
                </p>
              </div>
            ) : (
              <EmptyState title="No demo data" body="There is nothing to remove. Everything in the dashboards comes from real activity." />
            )}
            <RemoveDemoDataForm hasDemoData={counts.total > 0} />
            {kept > 0 && (
              <p className="mt-3 text-[12.5px] leading-relaxed text-ecrn-secondary">
                Not part of this: the {fmtNum(counts.kept.demoAccounts)} older demo {counts.kept.demoAccounts === 1 ? "account" : "accounts"}, {fmtNum(counts.kept.sampleCandidates)} sample {counts.kept.sampleCandidates === 1 ? "candidate" : "candidates"} that belong
                to them, and the sample jobs. Those stay until you remove them yourself.
              </p>
            )}
          </>
        )}
      </Panel>
    </div>
  );
}

// ── launch checklist ─────────────────────────────────────────────────

type StepStatus = "done" | "todo" | "manual";

interface Step {
  title: string;
  body: ReactNode;
  status: StepStatus;
  link?: { href: string; label: string };
}

const STATUS_PILL: Record<StepStatus, { tone: "green" | "amber" | "neutral"; label: string }> = {
  done: { tone: "green", label: "Done" },
  todo: { tone: "amber", label: "To do" },
  manual: { tone: "neutral", label: "Check by hand" },
};

export function LaunchChecklist({
  connections: c,
  facts,
  demoTotal,
}: {
  connections: Connections;
  facts: LaunchFacts;
  /** Demo rows still in the database. Null when the count could not be loaded. */
  demoTotal: number | null;
}) {
  const hasDemoTeam = (facts.demoTeamMembers ?? 0) > 0;
  const jobsStatus: StepStatus =
    facts.openJobs == null || facts.openJobsWithoutOwner == null
      ? "manual"
      : !hasDemoTeam && facts.openJobs > 0 && facts.openJobsWithoutOwner === 0
        ? "done"
        : "todo";
  const jobsHint =
    facts.openJobs == null || facts.openJobsWithoutOwner == null
      ? null
      : hasDemoTeam
        ? "Right now the open jobs are owned by demo team members."
        : facts.openJobs === 0
          ? "There are no open jobs yet."
          : facts.openJobsWithoutOwner > 0
            ? `${fmtNum(facts.openJobsWithoutOwner)} of ${fmtNum(facts.openJobs)} open jobs have no owner.`
            : null;
  const keysSet = c.serviceKey && c.staffingWebhook && c.staffingSecret;

  const steps: Step[] = [
    {
      title: "Use normal account sign-in",
      body: "Members and owners use the same email and password login. Their account opens the member app or admin dashboard automatically.",
      status: c.demoMode ? "todo" : "done",
    },
    {
      title: "Remove demo data",
      body: "Clear the fictional team, members and candidates so the numbers are only real ones.",
      status: demoTotal == null ? "manual" : demoTotal > 0 ? "todo" : "done",
      link: { href: "#demo-data", label: "Demo data" },
    },
    {
      title: "Add your real team, or connect Bullhorn",
      body: "Each account manager and recruiter gets a personal sign-up link, so you can see who brings people in. Once Bullhorn is connected, the team can come from there instead.",
      status: facts.realTeamMembers == null ? "manual" : facts.realTeamMembers > 0 ? "done" : "todo",
      link: { href: "/admin/team", label: "Team" },
    },
    {
      title: "Set job owners",
      body: (
        <>
          Every open job needs an account manager, so sign-ups, referrals and applications go to the right person.
          {jobsHint ? ` ${jobsHint}` : ""}
        </>
      ),
      status: jobsStatus,
      link: { href: "/admin/jobs", label: "Jobs" },
    },
    {
      title: "Connect email",
      body: "Add custom SMTP in the Supabase dashboard (Authentication settings) so sign-in and password emails come from your own domain. The built-in sender is for testing and only allows a few emails an hour.",
      status: "manual",
    },
    {
      title: "Add the server keys when you have them",
      body: (
        <>
          <span className={code}>SUPABASE_SECRET_KEY</span> lets ECRN receive updates from Bullhorn.{" "}
          <span className={code}>STAFFING_REFERRALS_WEBHOOK_URL</span> and <span className={code}>STAFFING_REFERRALS_SECRET</span> turn on
          delivery to Staffing Referrals. Do this after the demo data is gone.
        </>
      ),
      status: keysSet ? "done" : "todo",
      link: { href: "/admin/sync", label: "Integrations" },
    },
  ];
  const done = steps.filter((s) => s.status === "done").length;

  return (
    <Panel title="Launch checklist" subtitle={`${done} of ${steps.length} done. Work through these before real members arrive.`}>
      <ol className="space-y-3.5">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span
              aria-hidden
              className={cn(
                "mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border text-[11.5px] font-semibold tabular-nums",
                s.status === "done" ? "border-ecrn-green bg-ecrn-selected text-ecrn-green-text" : "border-ecrn-line bg-white text-ecrn-secondary"
              )}
            >
              {s.status === "done" ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="text-[14px] font-semibold text-ecrn-ink">{s.title}</span>
                <Pill tone={STATUS_PILL[s.status].tone}>{STATUS_PILL[s.status].label}</Pill>
              </div>
              <p className="mt-0.5 text-[13px] leading-relaxed text-ecrn-secondary">{s.body}</p>
              {s.link &&
                (s.link.href.startsWith("#") ? (
                  <a href={s.link.href} className={cn(linkClass, "mt-1 inline-block text-[13px]")}>
                    Go to {s.link.label}
                  </a>
                ) : (
                  <Link href={s.link.href} className={cn(linkClass, "mt-1 inline-block text-[13px]")}>
                    Go to {s.link.label}
                  </Link>
                ))}
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

// ── connections ──────────────────────────────────────────────────────

export function ConnectionsPanel({ connections: c }: { connections: Connections }) {
  const rows: { name: string; ok: boolean; optional?: boolean; okLabel?: string; offLabel?: string; warnWhenOn?: boolean; detail: ReactNode }[] = [
    {
      name: "Database",
      ok: c.supabase,
      detail: "Supabase: accounts, data and the access rules that keep members' information private.",
    },
    {
      name: "Account sign-in",
      ok: !c.demoMode,
      okLabel: "Normal login",
      offLabel: "Check configuration",
      detail: "Sign in with your email and password. Your account determines whether you see the member app or the admin dashboard.",
    },
    {
      name: "Staffing Referrals delivery",
      ok: c.staffingWebhook,
      detail: (
        <>
          Sends sign-ups, referrals and applications on to Bullhorn. <span className={code}>STAFFING_REFERRALS_WEBHOOK_URL</span>
        </>
      ),
    },
    {
      name: "Shared secret",
      ok: c.staffingSecret,
      detail: (
        <>
          Signs what ECRN sends and checks what comes back. <span className={code}>STAFFING_REFERRALS_SECRET</span>
        </>
      ),
    },
    {
      name: "Server key",
      ok: c.serviceKey,
      detail: (
        <>
          Needed to receive updates from Bullhorn and for scheduled delivery. <span className={code}>SUPABASE_SECRET_KEY</span>
        </>
      ),
    },
    {
      name: "Bullhorn direct API",
      ok: c.bullhornApi,
      optional: true,
      detail: "Optional second route to Bullhorn, without Staffing Referrals.",
    },
    {
      name: "SendGrid",
      ok: c.sendgrid,
      optional: true,
      detail: (
        <>
          Notification email. <span className={code}>SENDGRID_API_KEY</span>
        </>
      ),
    },
    {
      name: "Resend",
      ok: c.resend,
      optional: true,
      detail: (
        <>
          Another option for notification email. <span className={code}>RESEND_API_KEY</span>
        </>
      ),
    },
    {
      name: "Twilio SMS",
      ok: c.twilio,
      optional: true,
      detail: (
        <>
          Text notifications. <span className={code}>TWILIO_ACCOUNT_SID</span>
        </>
      ),
    },
  ];

  return (
    <Panel
      title="Connections"
      subtitle="What this deployment is connected to. Only yes or no is shown, never the keys."
      action={
        <Link href="/admin/sync" className={linkClass}>
          Integrations
        </Link>
      }
    >
      <ul className="divide-y divide-ecrn-line">
        {rows.map((r) => {
          const tone = r.warnWhenOn ? (r.ok ? "amber" : "green") : r.ok ? "green" : r.optional ? "neutral" : "amber";
          const label = r.ok ? (r.okLabel ?? "Connected") : (r.offLabel ?? "Not connected");
          const good = r.warnWhenOn ? !r.ok : r.ok;
          return (
            <li key={r.name} className="flex items-start gap-3 py-2.5">
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full",
                  good ? "bg-ecrn-selected text-ecrn-green-text" : "bg-slate-100 text-slate-500"
                )}
              >
                {good ? <Check className="h-3 w-3" /> : r.optional ? <Minus className="h-3 w-3" /> : <Circle className="h-2 w-2" />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[13.5px] font-medium text-ecrn-ink">{r.name}</span>
                  <Pill tone={tone}>{label}</Pill>
                </div>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-ecrn-secondary">{r.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[12.5px] leading-relaxed text-ecrn-secondary">
        These are environment variables, set where the app is hosted (or in <span className={code}>.env.local</span> on your own machine). A
        change takes effect on the next deploy.
      </p>
    </Panel>
  );
}
