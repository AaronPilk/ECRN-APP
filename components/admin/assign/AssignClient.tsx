"use client";

import type { ReactNode, SelectHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";

/**
 * Small extras for <AssignControl />. The form works as a plain post without
 * any of this: these only save a click and show that a save is in flight.
 */

/**
 * Recruiter picker. Choosing a recruiter also selects their account manager,
 * unless the admin already picked a different one by hand.
 */
export function RecruiterSelect({ children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select
      {...props}
      onChange={(e) => {
        const select = e.currentTarget;
        const manager = select.form?.elements.namedItem("accountManagerId");
        if (!(manager instanceof HTMLSelectElement)) return;
        const suggested = select.selectedOptions[0]?.dataset.manager ?? "";
        const filledByUs = manager.dataset.auto === "1";

        if (suggested && (manager.value === "" || filledByUs)) {
          if (!Array.from(manager.options).some((o) => o.value === suggested)) return;
          manager.value = suggested;
          manager.dataset.auto = "1";
          // The moment the admin changes it themselves, stop following the recruiter.
          manager.addEventListener("change", () => delete manager.dataset.auto, { once: true });
        } else if (!select.value && filledByUs) {
          manager.value = "";
          delete manager.dataset.auto;
        }
      }}
    >
      {children}
    </select>
  );
}

/** Submit button that shows the save in progress. */
export function SubmitButton({
  children,
  pendingLabel = "Saving…",
  className,
}: {
  children: ReactNode;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(
        "inline-flex h-9 items-center justify-center whitespace-nowrap rounded-[10px] bg-ecrn-black px-3.5 text-[13px] font-medium text-white",
        "transition-colors hover:bg-ecrn-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ecrn-green focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
