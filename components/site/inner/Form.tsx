"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Label, control and optional hint for the site's forms. The control itself
 * (an <input className="inner-input"> or <textarea>) stays in the page, so
 * its name, type and validation are visible where the server action lives.
 */
export function Field({
  id,
  label,
  required = false,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="inner-label">
        <span>{label}</span>
        {required ? <span className="text-[13px] font-medium text-ecrn-secondary">Required</span> : null}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-[13px] leading-snug text-ecrn-secondary">{hint}</p> : null}
    </div>
  );
}

/**
 * Full-width submit button. While the server action runs it says so and
 * ignores a second tap; without JavaScript it is a plain submit button.
 */
export function SubmitButton({ children, pendingLabel = "Sending…" }: { children: ReactNode; pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="site-btn site-btn-primary inline-flex w-full disabled:cursor-wait">
      {pending ? (
        <span>{pendingLabel}</span>
      ) : (
        <>
          <span>{children}</span>
          <ArrowRight aria-hidden className="h-4 w-4" />
        </>
      )}
    </button>
  );
}
