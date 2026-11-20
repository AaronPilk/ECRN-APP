import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { Logo } from "./Logo";

/** "ECRN | Powered by Delta Construction Partners" — the rev 03 app header lockup. */
export function DeltaLockup({ className, light }: { className?: string; light?: boolean }) {
  return (
    <div className={cn("inline-flex items-center gap-3 min-w-0", className)}>
      <Logo variant={light ? "light" : "default"} />
      <span className={cn("h-7 w-px", light ? "bg-white/25" : "bg-ecrn-line")} aria-hidden />
      <div className="leading-[1.15] min-w-0">
        <div className={cn("text-[10px]", light ? "text-white/60" : "text-ecrn-secondary")}>Powered by</div>
        <div className={cn("text-[11.5px] font-medium truncate", light ? "text-[#C5DEFF]" : "text-cobalt")}>
          Delta Construction Partners
        </div>
      </div>
    </div>
  );
}

/** Delta's mark on its own (for "Recruiting for…" panels). */
export function DeltaMark({ className }: { className?: string }) {
  return (
    <Image src="/brand/delta-mark.png" alt="Delta Construction Partners" width={40} height={32} className={cn("h-6 w-auto", className)} />
  );
}
