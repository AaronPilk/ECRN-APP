import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dark";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-ecrn-green text-ecrn-black hover:bg-ecrn-green-bright active:bg-ecrn-green-dark shadow-soft",
  secondary:
    "bg-white text-ecrn-ink border border-slate-200 hover:bg-slate-50 active:bg-slate-100 shadow-soft",
  ghost: "bg-transparent text-ecrn-ink hover:bg-slate-100 active:bg-slate-200",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-soft",
  dark: "bg-ecrn-black text-white hover:bg-ecrn-ink active:bg-black shadow-soft",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-xl",
  md: "h-11 px-5 text-[15px] rounded-2xl",
  lg: "h-13 px-6 text-base rounded-2xl py-3.5",
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
          "inline-flex items-center justify-center gap-2 font-medium",
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
