import Link from "next/link";
import { notFound } from "next/navigation";
import { JobForm } from "@/components/admin/JobForm";
import { AdminHeader, AdminPage, Notice } from "@/components/admin/ui";
import { FormMessage } from "@/components/ui/FormMessage";
import { requireAdmin } from "@/lib/auth/session";
import { getJobById } from "@/lib/data/repository";
import { getJobOwnership, getJobPrivate } from "@/lib/admin/jobs";
import { listStaff, splitStaff } from "@/lib/admin/staff";
import type { Staff } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}

/** Keep people who are already on the job in the pickers, even if they are no longer active. */
function withCurrent(options: Staff[], currentIds: string[], byId: Map<string, Staff>): Staff[] {
  const extra = currentIds
    .filter((id) => !options.some((s) => s.id === id))
    .map((id) => byId.get(id))
    .filter((s): s is Staff => Boolean(s));
  return extra.length > 0 ? [...options, ...extra] : options;
}

export default async function EditJobPage({ params, searchParams }: PageProps) {
  await requireAdmin();
  const [{ id }, sp] = await Promise.all([params, searchParams]);

  const job = await getJobById(id);
  if (!job) notFound();

  // The public jobs row hides the client name for confidential jobs, so the
  // form defaults come from job_private.
  const [staff, ownership, privateInfo] = await Promise.all([
    listStaff(),
    getJobOwnership(job.id),
    getJobPrivate(job.id),
  ]);
  const byId = new Map(staff.map((s) => [s.id, s]));
  const split = splitStaff(staff);
  const accountManagers = withCurrent(
    split.accountManagers,
    ownership.accountManagerId ? [ownership.accountManagerId] : [],
    byId
  );
  const recruiters = withCurrent(split.recruiters, ownership.recruiterIds, byId);
  const needsOwner = !ownership.accountManagerId && job.status === "open";

  return (
    <AdminPage className="max-w-3xl">
      <Link href="/admin/jobs" className="inline-block text-[13.5px] text-ecrn-secondary hover:text-ecrn-ink">
        ← All jobs
      </Link>
      <AdminHeader
        eyebrow="Jobs"
        title="Edit job"
        subtitle="Changes show to members right away when the status is Open and Public is on."
      />
      <FormMessage error={sp.error} />
      {needsOwner && (
        <Notice tone="amber">
          This open job has no owner. Applications to it sit in the routing queue until someone owns it. Pick an
          account manager under Ownership.
        </Notice>
      )}
      <JobForm
        job={job}
        accountManagers={accountManagers}
        recruiters={recruiters}
        ownership={ownership}
        privateInfo={privateInfo}
      />
    </AdminPage>
  );
}
