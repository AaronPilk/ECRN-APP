import { ComingSoon } from "@/components/ComingSoon";

export default function AdminPayoutsPage() {
  return (
    <ComingSoon
      title="Payouts"
      description="Approve, deny, or mark referral payouts as paid. Coming in Batch 6."
      batch={6}
      backHref="/admin"
    />
  );
}
