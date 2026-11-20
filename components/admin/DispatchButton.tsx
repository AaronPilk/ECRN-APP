"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { dispatchNowAction } from "@/app/(app)/admin/sync/actions";

export function DispatchButton() {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Button size="sm" loading={pending} onClick={() => start(async () => setMsg((await dispatchNowAction()).message))}>
        Send queued events now
      </Button>
      {msg && <span className="text-sm text-slate-600">{msg}</span>}
    </div>
  );
}
