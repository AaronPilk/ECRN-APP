import { cn } from "@/lib/utils/cn";

type Variant = "neutral" | "amber" | "blue" | "green" | "red" | "dark";

const variants: Record<Variant, string> = {
  neutral: "bg-slate-100 text-slate-700",
  amber: "bg-amber-50 text-amber-800 border-amber-200/60",
  blue: "bg-blue-50 text-blue-700 border-blue-200/60",
  green: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
  red: "bg-red-50 text-red-700 border-red-200/60",
  dark: "bg-delta-navy text-white",
};

export function Badge({
  variant = "neutral",
  className,
  children,
}: {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-transparent",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
