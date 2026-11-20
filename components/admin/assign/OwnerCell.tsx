import { Pill } from "@/components/admin/ui";

/** Who has it: account manager on top, recruiter underneath. */
export function OwnerCell({ accountManager, recruiter }: { accountManager: string | null; recruiter: string | null }) {
  if (!accountManager && !recruiter) return <Pill tone="amber">Unassigned</Pill>;
  return (
    <div className="min-w-0">
      <div className="font-medium text-ecrn-ink">
        {accountManager ?? <span className="font-normal text-amber-800">No account manager</span>}
      </div>
      <div className="mt-0.5 text-[12.5px] text-ecrn-secondary">
        {recruiter ?? <span className="text-amber-800">No recruiter yet</span>}
      </div>
    </div>
  );
}

/** One name, or a quiet "none" marker. For tables with separate owner and recruiter columns. */
export function StaffNameCell({ name, missing }: { name: string | null; missing: string }) {
  return name ? <span className="text-ecrn-ink">{name}</span> : <span className="text-[12.5px] text-amber-800">{missing}</span>;
}
