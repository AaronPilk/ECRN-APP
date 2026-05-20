import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { JobForm } from "@/components/admin/JobForm";
import { getCurrentProfile } from "@/lib/auth/mock";
import { getJobById } from "@/lib/data/repository";

interface PageProps {
  params: { id: string };
}

export default async function EditJobPage({ params }: PageProps) {
  const profile = (await getCurrentProfile())!;
  if (profile.role !== "admin") redirect("/dashboard");

  const job = await getJobById(params.id);
  if (!job) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <Link href="/admin/jobs" className="text-sm text-slate-500 hover:text-ecrn-ink">
        ← All jobs
      </Link>
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ecrn-ink">
          Edit job
        </h1>
        <p className="mt-1 text-slate-500">
          Changes are visible immediately to partners and candidates if Status = Open and Public = on.
        </p>
      </div>
      <JobForm job={job} />
    </div>
  );
}
