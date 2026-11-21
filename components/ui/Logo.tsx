import { cn } from "@/lib/utils/cn";

interface LogoProps {
  className?: string;
  /** "light" = white type for dark backgrounds; "default" = ink type for light backgrounds. */
  variant?: "default" | "light";
  /** Kept for older call sites; the official artwork already includes the tagline. */
  showTagline?: boolean;
  /** Kept for older call sites; the official artwork is always used. */
  useWordmark?: boolean;
}

/**
 * The official ECRN logo (green triangle + ECRN + "Power your connections"),
 * from the artwork supplied by Aaron. Two files: white type for dark
 * backgrounds, ink type for light backgrounds. Size it with a height class.
 */
export function Logo({ className, variant = "default" }: LogoProps) {
  const src = variant === "light" ? "/brand/ecrn-logo-white.webp" : "/brand/ecrn-logo-ink.webp";
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="ECRN" width={800} height={203} decoding="async" className={cn("block h-7 w-auto shrink-0", className)} />
  );
}
