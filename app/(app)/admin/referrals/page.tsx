import { ComingSoon } from "@/components/ComingSoon";

export default function AdminReferralsPage() {
  return (
    <ComingSoon
      title="Referrals"
      description="All referrals with referrer attribution, duplicate review queue, and status pipeline. Coming in Batch 4."
      batch={4}
      backHref="/admin"
    />
  );
}
