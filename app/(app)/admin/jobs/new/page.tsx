import Link from "next/link";
import { JobForm } from "@/components/admin/JobForm";
import { AdminHeader, AdminPage } from "@/components/admin/ui";
import { FormMessage } from "@/components/ui/FormMessage";
import { requireAdmin } from "@/lib/auth/session";
import { listStaff, splitStaff } from "@/lib/admin/staff";

interface PageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function NewJobPage({ searchParams }: PageProps) {
  await requireAdmin();
  const sp = await searchParams;
  const { accountManagers, recruiters } = splitStaff(await listStaff());

  return (
    <AdminPage className="max-w-3xl">
      <Link href="/admin/jobs" className="inline-block text-[13.5px] text-ecrn-secondary hover:text-ecrn-ink">
        ← All jobs
      </Link>
      <AdminHeader
        eyebrow="Jobs"
        title="Create job"
        subtitle="Save it as a draft, or set the status to Open to show it to members. Pick an account manager so applications and referrals have an owner from day one."
      />
      <FormMessage error={sp.error} />
      <JobForm accountManagers={accountManagers} recruiters={recruiters} />
    </AdminPage>
  );
}
