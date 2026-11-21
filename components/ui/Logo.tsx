import { cn } from "@/lib/utils/cn";

interface LogoProps {
  className?: string;
  variant?: "default" | "light";
  /** The official asset includes the tagline. Retained for older callers. */
  showTagline?: boolean;
  /** Retained for older callers; every placement now uses the official wordmark. */
  useWordmark?: boolean;
}

/**
 * Aaron's official ECRN wordmark, including its original triangle and tagline.
 * The default places the white artwork on a dark tile for light app headers.
 * `light` is for a surface that is already dark.
 */
export function Logo({
  className,
  variant = "default",
}: LogoProps) {
  return (
    <div className={cn("inline-flex shrink-0 items-center", variant === "default" && "rounded-lg bg-ecrn-black px-2 py-2", className)}>
      <img
        src="/brand/ecrn-horizontal-white-512.png"
        alt="ECRN, Power Your Connections"
        width={512}
        height={129}
        decoding="async"
        className="h-[22px] w-auto object-contain"
      />
    </div>
  );
}
