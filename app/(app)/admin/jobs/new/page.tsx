import Link from "next/link";
import { redirect } from "next/navigation";
import { JobForm } from "@/components/admin/JobForm";
import { getCurrentProfile } from "@/lib/auth/mock";

export default async function NewJobPage() {
  const profile = (await getCurrentProfile())!;
  if (profile.role !== "admin") redirect("/dashboard");

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <Link href="/admin/jobs" className="text-sm text-slate-500 hover:text-ecrn-ink">
        ← All jobs
      </Link>
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ecrn-ink">
          Create job
        </h1>
        <p className="mt-1 text-slate-500">
          Save as draft, or set status to Open to make it visible to referral partners and candidates.
        </p>
      </div>
      <JobForm />
    </div>
  );
}
