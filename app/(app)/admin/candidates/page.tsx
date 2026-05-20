import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ReferralStatusBadge } from "@/components/referrals/StatusBadge";
import { getCurrentProfile } from "@/lib/auth/mock";
import {
  getProfileById,
  searchCandidates,
} from "@/lib/data/repository";
import type { CandidateSource, ReferralStatus } from "@/types";
import { Download, Search } from "lucide-react";

interface PageProps {
  searchParams?: {
    q?: string;
    status?: string;
    source?: string;
    trade?: string;
  };
}

const STATUS_FILTERS: { key: ReferralStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "contacted", label: "Contacted" },
  { key: "qualified", label: "Qualified" },
  { key: "interviewing", label: "Interviewing" },
  { key: "placed", label: "Placed" },
  { key: "duplicate_review", label: "Duplicate review" },
];

const SOURCE_FILTERS: { key: CandidateSource | "all"; label: string }[] = [
  { key: "all", label: "All sources" },
  { key: "referred", label: "Referred" },
  { key: "direct_application", label: "Direct apply" },
  { key: "company_submission", label: "Company sub" },
  { key: "admin_import", label: "Admin import" },
];

export default async function AdminCandidatesPage({ searchParams }: PageProps) {
  const profile = (await getCurrentProfile())!;
  if (profile.role !== "admin") redirect("/dashboard");

  const candidates = await searchCandidates({
    search: searchParams?.q,
    status: searchParams?.status as ReferralStatus | "all" | undefined,
    source: searchParams?.source as CandidateSource | "all" | undefined,
    trade: searchParams?.trade,
  });

  // Enrich with referrer name for the table
  const rows = await Promise.all(
    candidates.map(async (c) => ({
      candidate: c,
      referrer: c.primaryReferrerUserId
        ? await getProfileById(c.primaryReferrerUserId)
        : null,
    }))
  );

  const activeStatus = (searchParams?.status as string) || "all";
  const activeSource = (searchParams?.source as string) || "all";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ecrn-ink">
            All candidates
          </h1>
          <p className="mt-1 text-slate-500">
            {candidates.length} candidate{candidates.length === 1 ? "" : "s"} in the network.
          </p>
        </div>
        <Link href="/admin/export/candidates">
          <Button variant="secondary" size="sm">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </Link>
      </div>

      {/* Search */}
      <form className="flex gap-2" action="/admin/candidates" method="GET">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            name="q"
            placeholder="Search name, email, phone, title, city…"
            defaultValue={searchParams?.q ?? ""}
            className="pl-10"
          />
        </div>
        {searchParams?.status && (
          <input type="hidden" name="status" value={searchParams.status} />
        )}
        {searchParams?.source && (
          <input type="hidden" name="source" value={searchParams.source} />
        )}
        <Button type="submit" variant="dark" size="md">
          Search
        </Button>
      </form>

      {/* Status filter chips */}
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
        {STATUS_FILTERS.map((f) => (
          <FilterChip
            key={f.key}
            label={f.label}
            href={buildHref(searchParams, "status", f.key)}
            active={activeStatus === f.key}
          />
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
        {SOURCE_FILTERS.map((f) => (
          <FilterChip
            key={f.key}
            label={f.label}
            href={buildHref(searchParams, "source", f.key)}
            active={activeSource === f.key}
          />
        ))}
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <Card className="p-10 text-center text-slate-500">
          No candidates match these filters.
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200/60">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 hidden md:table-cell">Title</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Location</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Referrer</th>
                  <th className="px-4 py-3 hidden md:table-cell">Added</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ candidate: c, referrer }) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/candidates/${c.id}`}
                        className="font-semibold text-ecrn-ink hover:text-ecrn-green"
                      >
                        {c.firstName} {c.lastName}
                      </Link>
                      <div className="text-xs text-slate-500">
                        {c.email ?? c.phone ?? "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ReferralStatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-700">
                      {c.currentJobTitle ?? "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-700">
                      {[c.locationCity, c.locationState].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-700">
                      {referrer
                        ? `${referrer.firstName ?? ""} ${referrer.lastName ?? ""}`.trim() ||
                          referrer.email
                        : c.sourceType === "direct_application"
                          ? "Direct"
                          : "—"}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-500 text-xs">
                      {c.createdAt.slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function FilterChip({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        active
          ? "bg-ecrn-black text-white border-ecrn-black"
          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
      }`}
    >
      {label}
    </Link>
  );
}

function buildHref(
  current: PageProps["searchParams"] | undefined,
  key: string,
  value: string
): string {
  const params = new URLSearchParams();
  if (current?.q) params.set("q", current.q);
  if (current?.status) params.set("status", current.status);
  if (current?.source) params.set("source", current.source);
  if (current?.trade) params.set("trade", current.trade);
  if (value === "all") {
    params.delete(key);
  } else {
    params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `/admin/candidates?${qs}` : "/admin/candidates";
}
