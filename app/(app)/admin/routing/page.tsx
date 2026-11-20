import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { listStaff } from "@/lib/admin/staff";
import { firstParam, getRoutingStats, isUuid } from "@/lib/admin/routing";
import { AdminHeader, AdminPage, FilterTabs, Notice, Panel, StatCard, fmtNum, fmtPct } from "@/components/admin/ui";
import { SubmitButton } from "@/components/admin/assign/AssignClient";
import { AssignResult } from "@/components/admin/assign/AssignResult";
import { autoRouteAction } from "./actions";
import { NeedsOwner } from "./_components/NeedsOwner";
import { NeedsRecruiter } from "./_components/NeedsRecruiter";
import { RecentlyRouted } from "./_components/RecentlyRouted";

export const metadata = { title: "Routing" };

type Tab = "owner" | "recruiter" | "recent";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * The routing queue: who still needs an owner, who an account manager still
 * has to hand to a recruiter, and where everyone went recently.
 */
export default async function AdminRoutingPage({ searchParams }: PageProps) {
  await requireAdmin();
  const sp = await searchParams;
  const tabParam = firstParam(sp.tab);
  const tab: Tab = tabParam === "recruiter" || tabParam === "recent" ? tabParam : "owner";
  const amParam = firstParam(sp.am);
  const am = tab === "recruiter" && isUuid(amParam) ? amParam : null;

  const [stats, staff] = await Promise.all([getRoutingStats(), listStaff()]);

  const here =
    tab === "owner" ? "/admin/routing" : `/admin/routing?tab=${tab}${am ? `&am=${am}` : ""}`;
  const routedParam = firstParam(sp.routed);
  const routed = routedParam && /^\d{1,9}$/.test(routedParam) ? Number(routedParam) : null;

  return (
    <AdminPage>
      <AdminHeader
        eyebrow="Overview"
        title="Routing"
        subtitle="Every sign-up, referral and application goes to the account manager who owns the job, who hands it to one of their recruiters. This is where you see it happen and step in."
        actions={
          <form action={autoRouteAction}>
            <input type="hidden" name="returnTo" value={here} />
            <SubmitButton pendingLabel="Routing…" className="h-[42px] rounded-[12px] px-4 text-[14px]">
              Auto-route everyone
            </SubmitButton>
          </form>
        }
      />

      <AssignResult assigned={firstParam(sp.assigned)} error={firstParam(sp.error)} />
      {routed !== null && (
        <Notice tone={routed > 0 ? "green" : "blue"}>
          {routed > 0
            ? `Auto-routing ran. ${fmtNum(routed)} ${routed === 1 ? "person" : "people"} got an owner.`
            : "Auto-routing ran, and nobody new could be placed. Set an owner on their job, add territories on the Team page, or assign them by hand below."}
        </Notice>
      )}
      {staff.length === 0 && (
        <Notice tone="amber">
          There is no team yet, so nothing can be routed.{" "}
          <Link href="/admin/team" className="font-medium underline">
            Add your account managers and recruiters
          </Link>
          , set who owns each job, then run Auto-route everyone.
        </Notice>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Needs an owner"
          value={fmtNum(stats.needsOwner)}
          hint="People with no account manager"
          tone={stats.needsOwner > 0 ? "amber" : "default"}
          href="/admin/routing"
        />
        <StatCard
          label="Needs a recruiter"
          value={fmtNum(stats.needsRecruiter)}
          hint="With an account manager, not handed off yet"
          tone={stats.needsRecruiter > 0 ? "cobalt" : "default"}
          href="/admin/routing?tab=recruiter"
        />
        <StatCard
          label="Routed in the last 7 days"
          value={fmtNum(stats.routedLast7Days)}
          hint="People routed or handed to a recruiter this week"
          href="/admin/routing?tab=recent"
        />
        <StatCard
          label="Routed automatically"
          value={fmtPct(stats.ownedAutomatically, stats.ownedTotal)}
          hint={
            stats.ownedTotal > 0
              ? `${fmtNum(stats.ownedAutomatically)} of ${fmtNum(stats.ownedTotal)} people with an owner were placed by the rules`
              : "Nobody has an owner yet"
          }
          tone="green"
        />
      </div>

      {/* Below the widest screens the explainer folds away so the queue keeps its full width. */}
      <details className="rounded-[16px] border border-ecrn-line bg-white 2xl:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
          <span className="font-display text-[15px] font-semibold text-ecrn-ink">How routing works</span>
          <span className="text-[13px] font-medium text-ecrn-green-text">Show the three rules</span>
        </summary>
        <div className="px-5 pb-5">
          <RoutingRules wide />
        </div>
      </details>

      <div className="grid items-start gap-6 2xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
          <FilterTabs
            tabs={[
              { label: "Needs an owner", href: "/admin/routing", active: tab === "owner", count: stats.needsOwner },
              {
                label: "Needs a recruiter",
                href: "/admin/routing?tab=recruiter",
                active: tab === "recruiter",
                count: stats.needsRecruiter,
              },
              { label: "Recently routed", href: "/admin/routing?tab=recent", active: tab === "recent" },
            ]}
          />
          {tab === "owner" && <NeedsOwner total={stats.needsOwner} returnTo={here} />}
          {tab === "recruiter" && <NeedsRecruiter am={am} returnTo={here} />}
          {tab === "recent" && <RecentlyRouted />}
        </div>

        <Panel
          title="How routing works"
          subtitle="The database applies these in order, the moment someone arrives."
          className="hidden 2xl:block"
        >
          <RoutingRules />
        </Panel>
      </div>
    </AdminPage>
  );
}

/** The three automatic rules in plain words. `wide` lays them side by side. */
function RoutingRules({ wide = false }: { wide?: boolean }) {
  return (
    <>
      <ol className={wide ? "grid gap-4 text-[13.5px] leading-relaxed text-ecrn-ink md:grid-cols-3" : "space-y-3 text-[13.5px] leading-relaxed text-ecrn-ink"}>
        <Rule n={1} title="The job's owner">
          Someone who applies or is referred to a job goes to the account manager who owns that job.
        </Rule>
        <Rule n={2} title="The recruiter who brought them in">
          With no job owner, they go to the recruiter credited with their sign-up (or their referrer&apos;s sign-up), under
          that recruiter&apos;s account manager.
        </Rule>
        <Rule n={3} title="Territory">
          Otherwise they go to an account manager whose territory covers their state. A matching specialty breaks a tie.
        </Rule>
      </ol>
      <div className="mt-4 space-y-2 border-t border-ecrn-line pt-3 text-[13px] leading-relaxed text-ecrn-secondary">
        <p>No match means they wait under Needs an owner until you assign them.</p>
        <p>
          An assignment made by hand or coming from Bullhorn is never overwritten. Only a territory match gives way, and only
          when that person later applies or is referred to a job with an owner.
        </p>
        <p>The account manager then picks one of their recruiters under Needs a recruiter.</p>
      </div>
    </>
  );
}

function Rule({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ecrn-selected font-display text-[12px] font-semibold text-ecrn-green-text">
        {n}
      </span>
      <div className="min-w-0">
        <div className="font-medium">{title}</div>
        <p className="text-[13px] text-ecrn-secondary">{children}</p>
      </div>
    </li>
  );
}
