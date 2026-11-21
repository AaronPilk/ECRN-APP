import { cn } from "@/lib/utils/cn";

/**
 * The white ECRN wordmark, for dark surfaces. A plain <img> on purpose: the
 * site serves images as-is, the intrinsic size reserves the space, and it
 * stays out of the hero photo's way (no preload).
 */
export function SiteLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/ecrn-horizontal-white.png" alt="ECRN" width={1920} height={482} decoding="async" className={cn("h-[26px] w-auto sm:h-[30px]", className)} />
  );
}
