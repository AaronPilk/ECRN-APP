"use client";

import { useState, useTransition } from "react";
import { Button, type ButtonProps } from "@/components/ui/Button";

/**
 * A button that runs a server action and shows the sentence it returns
 * (for example "Sent 4, failed 0."). The page refreshes its numbers itself
 * because the action revalidates the route.
 */
export function ActionButton({
  action,
  label,
  variant = "primary",
  disabled,
  disabledHint,
}: {
  action: () => Promise<{ message: string }>;
  label: string;
  variant?: ButtonProps["variant"];
  disabled?: boolean;
  disabledHint?: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <Button
        type="button"
        size="sm"
        variant={variant}
        loading={pending}
        disabled={disabled}
        onClick={() =>
          start(async () => {
            try {
              setMessage((await action()).message);
            } catch {
              setMessage("That did not work. Try again.");
            }
          })
        }
      >
        {label}
      </Button>
      {(message || (disabled && disabledHint)) && (
        <span role="status" className="text-[12.5px] text-ecrn-secondary">
          {message ?? disabledHint}
        </span>
      )}
    </div>
  );
}
