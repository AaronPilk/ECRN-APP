import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { STAFF_ROLE_LABEL, listStaff, staffName } from "@/lib/admin/staff";
import { getRequestOrigin } from "@/lib/admin/team";
import { AdminHeader, AdminPage, Panel } from "@/components/admin/ui";
import { TeamMemberForm, type ManagerOption } from "@/components/admin/team/TeamMemberForm";
import { UUID_RE } from "@/components/admin/team/shared";

/** Edit a team member. Owners only. */
export default async function EditTeamMemberPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const [staff, origin] = await Promise.all([listStaff(), getRequestOrigin()]);
  const person = staff.find((s) => s.id === id);
  if (!person) notFound();

  // Active account managers and owners, plus the current manager even if they are now inactive.
  const managers: ManagerOption[] = staff
    .filter((s) => s.id !== person.id && s.staffRole !== "recruiter" && (s.isActive || s.id === person.managerId))
    .map((s) => ({
      id: s.id,
      name: staffName(s),
      note: s.isActive ? STAFF_ROLE_LABEL[s.staffRole] : `${STAFF_ROLE_LABEL[s.staffRole]}, inactive`,
    }));

  return (
    <AdminPage className="max-w-[920px]">
      <Link href={`/admin/team/${person.id}`} className="inline-block text-[13px] text-ecrn-secondary hover:text-ecrn-ink">
        ← {staffName(person)}
      </Link>
      <AdminHeader title={`Edit ${staffName(person)}`} subtitle="To remove someone from the team, untick Active. Their sign-ups and history are kept." />

      <Panel>
        <TeamMemberForm
          origin={origin}
          cancelHref={`/admin/team/${person.id}`}
          managers={managers}
          initial={{
            id: person.id,
            firstName: person.firstName,
            lastName: person.lastName,
            title: person.title ?? "",
            email: person.email ?? "",
            phone: person.phone ?? "",
            staffRole: person.staffRole,
            managerId: managers.some((m) => m.id === person.managerId) ? (person.managerId ?? "") : "",
            inviteCode: person.inviteCode,
            specialties: person.specialties.join(", "),
            territories: person.territories.join(", "),
            externalCrmId: person.externalCrmId ?? "",
            isActive: person.isActive,
          }}
        />
      </Panel>
    </AdminPage>
  );
}
