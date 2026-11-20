"use client";

import { ActionButton } from "@/components/admin/integrations/ActionButton";
import { dispatchNowAction } from "@/app/(app)/admin/sync/actions";

/** "Send queued events now": delivers the outbox to Staffing Referrals (admin only). */
export function DispatchButton({ disabled, disabledHint }: { disabled?: boolean; disabledHint?: string }) {
  return <ActionButton action={dispatchNowAction} label="Send queued events now" disabled={disabled} disabledHint={disabledHint} />;
}
