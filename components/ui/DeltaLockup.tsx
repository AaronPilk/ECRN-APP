import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { CoBrandLockup } from "@/components/site/Delta";

/**
 * ECRN | Delta Construction Partners: the same lockup as the website header
 * (components/site/Delta.tsx), at the member app's size. It fits beside a
 * 36 px avatar in the app's top bar from a 320 px phone up (about 243 px
 * wide at 360, 261 px at 390). `light` = the version for dark surfaces.
 */
export function DeltaLockup({ className, light }: { className?: string; light?: boolean }) {
  return <CoBrandLockup size="app" tone={light ? "dark" : "light"} className={cn("min-w-0", className)} />;
}

/** Delta's mark on its own (for "Recruiting for…" panels). */
export function DeltaMark({ className }: { className?: string }) {
  return (
    <Image src="/brand/delta-mark.png" alt="Delta Construction Partners" width={40} height={32} className={cn("h-6 w-auto", className)} />
  );
}
