import { ComingSoon } from "@/components/ComingSoon";

export default function AdminSettingsPage() {
  return (
    <ComingSoon
      title="Settings & integrations"
      description="Notification providers, Bullhorn / CRM sync, admin allowlist, and export tools. Coming in Batches 7–8."
      batch={7}
      backHref="/admin"
    />
  );
}
