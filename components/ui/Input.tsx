import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full h-11 px-3.5 rounded-xl",
        "bg-white border border-slate-200",
        "text-[15px] text-ecrn-ink placeholder:text-slate-400",
        "transition-all duration-150",
        "focus:outline-none focus:border-ecrn-green focus:ring-2 focus:ring-ecrn-green/20",
        "disabled:bg-slate-50 disabled:text-slate-400",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full min-h-[96px] px-3.5 py-3 rounded-xl resize-y",
      "bg-white border border-slate-200",
      "text-[15px] text-ecrn-ink placeholder:text-slate-400",
      "transition-all duration-150",
      "focus:outline-none focus:border-ecrn-green focus:ring-2 focus:ring-ecrn-green/20",
      "disabled:bg-slate-50 disabled:text-slate-400",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
