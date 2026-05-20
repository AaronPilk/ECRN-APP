import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getCurrentProfile } from "@/lib/auth/mock";
import { listAllProfiles } from "@/lib/data/repository";
import type { UserRole } from "@/types";
import { Download } from "lucide-react";

interface PageProps {
  searchParams?: { role?: UserRole | "all" };
}

const FILTERS: { key: UserRole | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "referral_partner", label: "Referral Partners" },
  { key: "candidate", label: "Candidates" },
  { key: "admin", label: "Admins" },
  { key: "company_contact", label: "Company contacts" },
];

const ROLE_VARIANT: Record<UserRole, "neutral" | "blue" | "green" | "dark" | "amber"> = {
  admin: "dark",
  referral_partner: "green",
  candidate: "blue",
  company_contact: "amber",
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const profile = (await getCurrentProfile())!;
  if (profile.role !== "admin") redirect("/dashboard");

  const all = await listAllProfiles();
  const filter = (searchParams?.role as UserRole | "all") ?? "all";
  const profiles = filter === "all" ? all : all.filter((p) => p.role === filter);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ecrn-ink">
            Users
          </h1>
          <p className="mt-1 text-slate-500">
            {profiles.length} user{profiles.length === 1 ? "" : "s"} in the network.
          </p>
        </div>
        <Link href="/admin/export/users">
          <Button variant="secondary" size="sm">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </Link>
      </div>

      <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const href = f.key === "all" ? "/admin/users" : `/admin/users?role=${f.key}`;
          return (
            <Link
              key={f.key}
              href={href}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                active
                  ? "bg-ecrn-black text-white border-ecrn-black"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {profiles.length === 0 ? (
        <Card className="p-10 text-center text-slate-500">No users in this view.</Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-slate-500 border-b border-slate-200/60">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 hidden md:table-cell">Email</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Phone</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Location</th>
                  <th className="px-4 py-3 hidden md:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr
                    key={p.id}
                    id={p.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-ecrn-ink">
                        {`${p.firstName ?? ""} ${p.lastName ?? ""}`.trim() || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={ROLE_VARIANT[p.role]}>
                        {p.role.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-700">
                      {p.email}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-700">
                      {p.phone ?? "—"}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-slate-700">
                      {[p.locationCity, p.locationState].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-500 text-xs">
                      {p.createdAt.slice(0, 10)}
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
