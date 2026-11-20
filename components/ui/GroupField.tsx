import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

/** iOS-style grouped input row: label on the left, value right-aligned. */
export function GroupField({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className={cn("group-row cursor-text", className)}>
      <span className="text-[15px] text-ecrn-ink shrink-0">{label}</span>
      <input
        {...props}
        className="min-w-0 flex-1 text-right bg-transparent outline-none text-[16px] text-ecrn-ink placeholder:text-ecrn-secondary/70"
      />
    </label>
  );
}

export function GroupHeader({ title, hint, required }: { title: string; hint?: string; required?: boolean }) {
  return (
    <div className="mb-2">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-[18px] font-semibold text-ecrn-ink">{title}</h2>
        {required && <span className="text-[12px] text-ecrn-secondary">Required</span>}
      </div>
      {hint && <p className="mt-0.5 text-[13px] text-ecrn-secondary">{hint}</p>}
    </div>
  );
}
