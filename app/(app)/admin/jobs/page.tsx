import { ComingSoon } from "@/components/ComingSoon";

export default function AdminJobsPage() {
  return (
    <ComingSoon
      title="Manage jobs"
      description="Create, edit, publish, and archive jobs. Set referral payouts and urgency. Coming in Batch 3 / Batch 4."
      batch={3}
      backHref="/admin"
    />
  );
}
