import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { listPublicJobs } from "@/lib/data/repository";

export default async function JobsPage() {
  const jobs = await listPublicJobs();
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ecrn-ink">Open roles</h1>
        <p className="mt-1 text-slate-500">
          {jobs.length} role{jobs.length === 1 ? "" : "s"} available right now.
        </p>
      </div>

      <div className="space-y-3">
        {jobs.map((j) => (
          <Card key={j.id} className="hover:shadow-float transition-shadow">
            <CardContent className="py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-semibold text-ecrn-ink">{j.title}</h3>
                    {j.urgency === "critical" && <Badge variant="red">Urgent</Badge>}
                    {j.urgency === "high" && <Badge variant="amber">High priority</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {j.companyName ?? "Confidential client"} ·{" "}
                    {[j.locationCity, j.locationState].filter(Boolean).join(", ")}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">{j.description}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {j.compensationDisplay && (
                      <span className="inline-flex items-center gap-1">
                        💼 {j.compensationDisplay}
                      </span>
                    )}
                    {j.referralPayoutDisplay && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                        ★ Referral payout: {j.referralPayoutDisplay}
                      </span>
                    )}
                  </div>
                </div>
                <Link href={`/jobs/${j.id}`} className="shrink-0">
                  <Button size="sm" variant="dark">
                    View role
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
        {jobs.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-slate-500">No open roles right now. Check back soon.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
