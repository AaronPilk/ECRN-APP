import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface LogoProps {
  className?: string;
  variant?: "default" | "light";
  showTagline?: boolean;
  /** Use the raster horizontal wordmark from /public/brand. Falls back to the SVG mark if false. */
  useWordmark?: boolean;
}

/**
 * ECRN logo.
 *
 * Two render modes:
 *   - `useWordmark` (default): renders the official horizontal white wordmark
 *     PNG (provided by Aaron). Best on dark backgrounds; we use it on the
 *     landing-page hero and the dark sidebar.
 *   - SVG mark: a recreation of the green triangle "mountain" mark plus the
 *     ECRN text — used in tight spots like the mobile top bar where we can't
 *     guarantee a dark backdrop.
 *
 * The triangle mark mirrors the brand: a tall isosceles outline with a smaller
 * solid triangle nested inside, in ECRN green.
 */
export function Logo({
  className,
  variant = "default",
  showTagline,
  useWordmark = false,
}: LogoProps) {
  if (useWordmark) {
    return (
      <div className={cn("inline-flex items-center", className)}>
        <Image
          src="/brand/ecrn-horizontal-white.png"
          alt="ECRN"
          width={180}
          height={48}
          priority
          className="h-9 w-auto object-contain"
        />
        {showTagline && (
          <span className="ml-3 hidden sm:inline-block text-[10px] uppercase tracking-[0.18em] text-white/60 font-medium">
            Power your connections
          </span>
        )}
      </div>
    );
  }

  const isLight = variant === "light";
  const textColor = isLight ? "#FFFFFF" : "#0A100C";
  const green = "#16C172";

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        {/* Outer triangle outline */}
        <path
          d="M16 4 L29 27 L3 27 Z"
          stroke={green}
          strokeWidth="2.5"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Inner solid triangle */}
        <path d="M16 12 L24 26 L8 26 Z" fill="#FFFFFF" />
      </svg>
      <div className="flex flex-col leading-tight">
        <span
          className="text-[17px] font-bold tracking-[0.12em]"
          style={{ color: textColor }}
        >
          ECRN
        </span>
        {showTagline && (
          <span
            className="text-[9px] uppercase tracking-[0.14em] font-medium"
            style={{ color: isLight ? "rgba(255,255,255,0.55)" : "#64746B" }}
          >
            Power your connections
          </span>
        )}
      </div>
    </div>
  );
}
