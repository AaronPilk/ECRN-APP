import { requireAdmin } from "@/lib/auth/session";
import { getDemoDataCounts } from "@/lib/admin/demo";
import { AdminHeader, AdminPage } from "@/components/admin/ui";
import { ConnectionsPanel, DemoDataPanel, LaunchChecklist, OwnersPanel } from "@/components/admin/settings/panels";
import { getConnections, getLaunchFacts, listOwners } from "./data";

/**
 * Settings: who has admin access, the demo data switch, the launch checklist,
 * and what this deployment is connected to. Owners only.
 */
export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const me = await requireAdmin();
  const sp = await searchParams;

  const [owners, demo, facts] = await Promise.all([listOwners({ id: me.id, email: me.email }), getDemoDataCounts(), getLaunchFacts()]);
  const connections = getConnections();

  return (
    <AdminPage>
      <AdminHeader
        eyebrow="System"
        title="Settings"
        subtitle="Who has admin access, the demo data, what is connected, and what to finish before launch."
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,460px)]">
        <div className="min-w-0 space-y-6">
          <OwnersPanel owners={owners.owners} listSize={owners.listSize} loadError={owners.error} message={sp.message} error={sp.error} />
          <DemoDataPanel counts={demo.counts} error={demo.error} />
        </div>
        <div className="min-w-0 space-y-6">
          <LaunchChecklist connections={connections} facts={facts} demoTotal={demo.counts ? demo.counts.total : null} />
          <ConnectionsPanel connections={connections} />
        </div>
      </div>
    </AdminPage>
  );
}
