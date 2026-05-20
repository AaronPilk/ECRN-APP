import { ComingSoon } from "@/components/ComingSoon";

export default function AdminUsersPage() {
  return (
    <ComingSoon
      title="Users"
      description="All accounts across referral partners, candidates, and admins. Role management + activity log. Coming in Batch 4."
      batch={4}
      backHref="/admin"
    />
  );
}
