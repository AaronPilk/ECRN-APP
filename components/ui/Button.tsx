import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dark" | "deep" | "soft";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  // Rev 03: #36DC86 → #16C172 gradient with a light inner edge
  primary:
    "bg-gradient-to-b from-ecrn-action-bright to-ecrn-green text-ecrn-action-ink border border-[#13B66B] shadow-action hover:brightness-[1.03] active:brightness-95",
  secondary:
    "bg-white text-ecrn-ink border border-ecrn-line hover:bg-ecrn-paper active:bg-slate-100",
  ghost: "bg-transparent text-ecrn-ink hover:bg-slate-100 active:bg-slate-200",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
  dark: "bg-ecrn-black text-white hover:bg-ecrn-ink active:bg-black",
  // "Apply directly" — deep action green
  deep: "bg-ecrn-green-text text-white hover:brightness-110 active:brightness-95",
  // "From contacts" — tinted secondary
  soft: "bg-ecrn-action-surface text-ecrn-green-text border border-[#A7E9C4] hover:brightness-[0.98]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-[12px]",
  md: "h-[46px] px-4 text-[15px] rounded-[15px]",
  lg: "h-[52px] px-6 text-base rounded-[15px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth,
      loading,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap",
          "transition-all duration-150 select-none",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ecrn-green focus-visible:ring-offset-2",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
