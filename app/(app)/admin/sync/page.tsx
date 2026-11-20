import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DispatchButton } from "@/components/admin/DispatchButton";
import { getCurrentProfile } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isStaffingReferralsConfigured, toBullhorn, type OutboxRow } from "@/lib/integrations/staffing-referrals";

const STATUS_VARIANT = { queued: "amber", sent: "green", failed: "red", skipped: "neutral" } as const;

export default async function AdminSyncPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const me = await getCurrentProfile();
  if (me?.role !== "admin") redirect("/dashboard");
  const sp = await searchParams;
  const sb = await createSupabaseServerClient();

  const counts: Record<string, number> = {};
  for (const s of ["queued", "sent", "failed"]) {
    const { count } = await sb.from("integration_outbox").select("id", { count: "exact", head: true }).eq("status", s);
    counts[s] = count ?? 0;
  }
  let q = sb.from("integration_outbox").select("*").order("created_at", { ascending: false }).limit(50);
  if (sp.status && ["queued", "sent", "failed"].includes(sp.status)) q = q.eq("status", sp.status);
  const { data } = await q;
  const rows = (data ?? []) as OutboxRow[];
  const configured = isStaffingReferralsConfigured();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ecrn-ink">Bullhorn sync</h1>
        <p className="mt-1 text-slate-500 max-w-2xl">
          Everything that happens in ECRN is queued here for Staffing Referrals, which feeds Bullhorn (and Sense for texts and
          emails). Recruiters keep working in Bullhorn.
        </p>
      </div>

      <Card>
        <CardContent className="py-5 space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant={configured ? "green" : "amber"}>{configured ? "Connected" : "Not connected yet"}</Badge>
            <span className="text-sm text-slate-600">
              {configured
                ? "Events are delivered to the Staffing Referrals webhook."
                : "Add STAFFING_REFERRALS_WEBHOOK_URL (and STAFFING_REFERRALS_SECRET) in hosting to start delivery. Nothing is lost meanwhile."}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(["queued", "sent", "failed"] as const).map((s) => (
              <a key={s} href={`/admin/sync?status=${s}`} className="rounded-xl border border-ecrn-line p-3 hover:bg-ecrn-paper">
                <div className="text-xs uppercase tracking-wide text-slate-500">{s}</div>
                <div className="text-2xl font-semibold text-ecrn-ink tabular-nums">{counts[s]}</div>
              </a>
            ))}
          </div>
          {configured && <DispatchButton />}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="px-5 py-3 border-b border-ecrn-line flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Recent events</h2>
          {sp.status && (
            <a href="/admin/sync" className="text-sm text-ecrn-green-text">
              Show all
            </a>
          )}
        </div>
        {rows.length === 0 ? (
          <p className="p-5 text-sm text-slate-500">No events yet. They appear as people sign up, refer, and apply.</p>
        ) : (
          <ul className="divide-y divide-ecrn-line">
            {rows.map((r) => {
              const shaped = toBullhorn(r);
              const d = shaped.data ?? {};
              const who = [d.firstName, d.lastName].filter(Boolean).join(" ") || d.companyName || d.jobOrder?.title || "";
              return (
                <li key={r.id} className="px-5 py-3">
                  <details>
                    <summary className="flex items-center gap-3 cursor-pointer list-none">
                      <Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge>
                      <span className="font-mono text-xs text-slate-500 w-44 shrink-0">{r.event_type}</span>
                      <span className="text-sm text-ecrn-ink truncate flex-1">
                        {d.entity} {who && `· ${who}`}
                        {d.customText?.confidential && " · confidential"}
                      </span>
                      <span className="text-xs text-slate-400 shrink-0">
                        {new Date(r.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                    </summary>
                    {r.last_error && <p className="mt-2 text-xs text-red-700">Last error: {r.last_error}</p>}
                    <pre className="mt-2 text-[11px] leading-4 bg-ecrn-paper border border-ecrn-line rounded-lg p-3 overflow-x-auto">
                      {JSON.stringify(shaped, null, 2)}
                    </pre>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
