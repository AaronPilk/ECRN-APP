"use client";

import { useActionState } from "react";
import { Check, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { claimInviteCodeAction, type ClaimInviteCodeState } from "@/app/(app)/profile/actions";

const INITIAL: ClaimInviteCodeState = { ok: false };

/**
 * "Working with a Delta recruiter?" One field and a button, for members who
 * joined without a recruiter's link. Renders nothing once they have a
 * recruiter, except right after connecting, when it confirms who that is.
 */
export function InviteCodeCard({ hasRecruiter }: { hasRecruiter: boolean }) {
  const [state, formAction, pending] = useActionState(claimInviteCodeAction, INITIAL);

  if (state.ok) {
    return (
      <div role="status" className="group-surface p-5 flex items-center gap-3">
        <span className="w-10 h-10 rounded-[12px] bg-ecrn-action-surface grid place-items-center shrink-0">
          <Check className="w-5 h-5 text-ecrn-green-text" />
        </span>
        <div className="min-w-0">
          <p className="font-display text-[17px] font-semibold text-ecrn-ink">You&apos;re connected with {state.name}</p>
          <p className="text-[13.5px] text-ecrn-secondary">Your account is now linked to your Delta recruiter.</p>
        </div>
      </div>
    );
  }

  if (hasRecruiter) return null;

  return (
    <div className="group-surface p-5">
      <div className="flex items-start gap-3">
        <span className="w-10 h-10 rounded-[12px] bg-delta-surface grid place-items-center shrink-0">
          <UserPlus className="w-5 h-5 text-cobalt" />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-[18px] font-semibold text-ecrn-ink">Working with a Delta recruiter?</h2>
          <p className="text-[13.5px] text-ecrn-secondary">Enter their code to connect with them.</p>
        </div>
      </div>

      <form action={formAction} className="mt-4 flex gap-2">
        <Input
          name="code"
          defaultValue={state.code ?? ""}
          required
          maxLength={24}
          autoComplete="off"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Recruiter code"
          aria-label="Recruiter code"
          aria-invalid={state.error ? true : undefined}
          className="h-[46px] min-w-0 flex-1 uppercase placeholder:normal-case"
        />
        <Button type="submit" loading={pending} className="shrink-0">
          Connect
        </Button>
      </form>

      {state.error && (
        <p role="alert" className="mt-2 text-[13px] text-red-700">
          {state.error}
        </p>
      )}
    </div>
  );
}
