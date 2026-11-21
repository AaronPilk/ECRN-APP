import { cn } from "@/lib/utils/cn";
import { EcrnLogo } from "./Delta";

/**
 * The white ECRN artwork on its own, for dark surfaces (pass-1 API, kept).
 * The header, menu and footer now use <CoBrandLockup> from ./Delta, which
 * pairs it with Delta's mark and name.
 */
export function SiteLogo({ className }: { className?: string }) {
  return <EcrnLogo tone="dark" className={cn("h-[26px] sm:h-[30px]", className)} />;
}
