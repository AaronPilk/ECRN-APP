"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "./Button";

/** Keep inside its form so server-action submission immediately shows progress. */
export function SubmitButton({ children, loading, disabled, pendingLabel, ...props }: ButtonProps & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button {...props} type="submit" loading={loading || pending} disabled={disabled || pending}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
