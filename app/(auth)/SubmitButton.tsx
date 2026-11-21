"use client";

import { useFormStatus } from "react-dom";
import { Button, type ButtonProps } from "@/components/ui/Button";

/** Immediate feedback while the server signs in or saves an auth form. */
export function SubmitButton({ children, pendingLabel = "Please wait…", ...props }: ButtonProps & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button {...props} type="submit" loading={pending} aria-busy={pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
