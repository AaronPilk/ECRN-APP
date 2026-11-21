import { cn } from "@/lib/utils/cn";

/**
 * The white ECRN wordmark, for dark surfaces. A plain <img> on purpose: the
 * site serves images as-is, the intrinsic size reserves the space, and it
 * stays out of the hero photo's way (no preload). This is a resized copy of
 * the supplied artwork, with no redrawing or recoloring.
 */
export function SiteLogo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/ecrn-horizontal-white-512.png" alt="ECRN, Power Your Connections" width={512} height={129} decoding="async" className={cn("h-[26px] w-auto sm:h-[30px]", className)} />
  );
}
