import { cn } from "@/lib/utils/cn";

type Variant = "neutral" | "amber" | "blue" | "green" | "red" | "dark" | "cobalt";

const variants: Record<Variant, string> = {
  neutral: "bg-slate-100 text-slate-700",
  amber: "bg-amber-50 text-amber-800 border-amber-200/60",
  // recruiting progress: Delta surface + navy/cobalt
  blue: "bg-delta-surface text-cobalt",
  green: "bg-ecrn-selected text-ecrn-green-text",
  red: "bg-red-50 text-red-700 border-red-200/60",
  dark: "bg-ecrn-black text-white",
  cobalt: "bg-cobalt text-white",
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
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[11.5px] font-medium border border-transparent whitespace-nowrap",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
