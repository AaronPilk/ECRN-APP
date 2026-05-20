import { forwardRef, type LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "block text-sm font-medium text-ecrn-ink mb-1.5",
        className
      )}
      {...props}
    >
      {children}
    </label>
  )
);
Label.displayName = "Label";
