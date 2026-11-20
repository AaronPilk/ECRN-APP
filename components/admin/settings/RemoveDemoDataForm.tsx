"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { clearDemoDataAction } from "@/app/(app)/admin/settings/actions";
import { CONFIRM_WORD, DEMO_COUNT_KEYS, demoCountText, type ClearDemoState } from "./shared";

const IDLE: ClearDemoState = { status: "idle" };

/**
 * "Remove demo data": the owner types REMOVE, the server action clears the
 * demo rows in one transaction, and this shows exactly what was removed.
 * Stays mounted after the page refreshes so the summary does not disappear.
 */
export function RemoveDemoDataForm({ hasDemoData }: { hasDemoData: boolean }) {
  const [state, formAction, pending] = useActionState(clearDemoDataAction, IDLE);
  const [typed, setTyped] = useState("");

  if (state.status === "done") {
    const { removed } = state;
    const lines = DEMO_COUNT_KEYS.filter((k) => removed[k] > 0).map((k) => demoCountText(k, removed[k]));
    const u = removed.unassigned;
    return (
      <div role="status" className="mt-4 rounded-[14px] bg-ecrn-action-surface px-4 py-3 text-[13.5px] leading-relaxed text-ecrn-green-text">
        {removed.total === 0 ? (
          <p className="font-medium">There was no demo data to remove.</p>
        ) : (
          <>
            <p className="font-medium">Demo data removed.</p>
            <ul className="mt-1.5 grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
              {lines.map((line) => (
                <li key={line} className="tabular-nums">
                  {line}
                </li>
              ))}
            </ul>
          </>
        )}
        {u.jobs > 0 && (
          <p className="mt-2">
            {u.jobs === 1 ? "1 job no longer has an owner." : `${u.jobs.toLocaleString("en-US")} jobs no longer have an owner.`}{" "}
            <Link href="/admin/jobs" className="font-medium underline underline-offset-2">
              Set job owners
            </Link>
          </p>
        )}
        {u.candidates + u.jobApplications + u.jobReferrals > 0 && (
          <p className="mt-1">
            Records that were assigned to a demo team member are back in the{" "}
            <Link href="/admin/routing" className="font-medium underline underline-offset-2">
              routing queue
            </Link>
            .
          </p>
        )}
      </div>
    );
  }

  if (!hasDemoData) return null;

  const ready = typed.trim() === CONFIRM_WORD;
  return (
    <form action={formAction} className="mt-4 rounded-[14px] border border-red-200/80 bg-red-50/50 px-4 py-3.5">
      <p className="text-[14px] font-semibold text-ecrn-ink">Remove demo data</p>
      <p className="mt-0.5 text-[13px] leading-relaxed text-ecrn-secondary">
        Deletes every demo record listed above in one go. Real members, jobs and records are not touched. This cannot be undone.
      </p>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor="confirm-remove-demo" className="mb-1 block text-[12.5px] font-medium text-ecrn-ink">
            Type {CONFIRM_WORD} to confirm
          </label>
          <Input
            id="confirm-remove-demo"
            name="confirm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder={CONFIRM_WORD}
            className="h-[42px] w-[180px] rounded-[12px] font-mono text-[14px]"
          />
        </div>
        <Button type="submit" variant="danger" size="sm" className="h-[42px]" disabled={!ready} loading={pending}>
          Remove demo data
        </Button>
      </div>
      {state.status === "error" && (
        <p role="alert" className="mt-2 text-[13px] text-red-800">
          {state.message}
        </p>
      )}
    </form>
  );
}
