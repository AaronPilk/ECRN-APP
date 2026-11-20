import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { STAFF_ROLE_LABEL, listStaff, splitStaff, staffName } from "@/lib/admin/staff";
import { getRequestOrigin } from "@/lib/admin/team";
import { AdminHeader, AdminPage, Panel } from "@/components/admin/ui";
import { BulkAddForm } from "@/components/admin/team/BulkAddForm";
import { TeamMemberForm, type ManagerOption } from "@/components/admin/team/TeamMemberForm";
import { UUID_RE, type TeamRole } from "@/components/admin/team/shared";

/** Add one team member, or paste a list to add several. Owners only. */
export default async function NewTeamMemberPage({
  searchParams,
}: {
  searchParams: Promise<{ manager?: string; role?: string; bulk?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const [staff, origin] = await Promise.all([listStaff(), getRequestOrigin()]);

  const managers: ManagerOption[] = splitStaff(staff).accountManagers.map((s) => ({
    id: s.id,
    name: staffName(s),
    note: STAFF_ROLE_LABEL[s.staffRole],
  }));

  // "Add a recruiter" on an account manager's card arrives with ?manager=<id>.
  const presetManager = sp.manager && UUID_RE.test(sp.manager) && managers.some((m) => m.id === sp.manager) ? sp.manager : "";
  const presetRole: TeamRole = sp.role === "account_manager" || sp.role === "owner" ? sp.role : "recruiter";

  return (
    <AdminPage className="max-w-[920px]">
      <Link href="/admin/team" className="inline-block text-[13px] text-ecrn-secondary hover:text-ecrn-ink">
        ← Team
      </Link>
      <AdminHeader
        title="Add team member"
        subtitle="They get a personal sign-up link and code right away. Recruiters don't log in to ECRN; this is how their sign-ups are counted."
      />

      <Panel>
        <TeamMemberForm
          origin={origin}
          cancelHref="/admin/team"
          managers={managers}
          initial={{
            firstName: "",
            lastName: "",
            title: "",
            email: "",
            phone: "",
            staffRole: presetManager ? "recruiter" : presetRole,
            managerId: presetManager,
            inviteCode: "",
            specialties: "",
            territories: "",
            externalCrmId: "",
            isActive: true,
          }}
        />
      </Panel>

      <BulkAddForm defaultOpen={sp.bulk === "1"} />
    </AdminPage>
  );
}
