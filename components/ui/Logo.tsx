import { cn } from "@/lib/utils/cn";

interface LogoProps {
  className?: string;
  variant?: "default" | "light";
  showTagline?: boolean;
}

/**
 * ECRN wordmark. SVG-based so it's crisp at any size and we don't depend
 * on remote assets at runtime.
 *
 * `variant="light"` renders white-on-dark for use over dark hero sections;
 * the default is dark-on-light for in-app surfaces.
 */
export function Logo({ className, variant = "default", showTagline }: LogoProps) {
  const color = variant === "light" ? "#FFFFFF" : "#0B1220";
  const accent = "#F5B419";
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
        <rect width="32" height="32" rx="8" fill={color} />
        {/* Lightning bolt — nods to electrical / energy */}
        <path
          d="M18 6 L9 18 L15 18 L13 26 L23 13 L17 13 L18 6 Z"
          fill={accent}
        />
      </svg>
      <div className="flex flex-col leading-tight">
        <span
          className="text-[17px] font-bold tracking-tight"
          style={{ color }}
        >
          ECRN
        </span>
        {showTagline && (
          <span className="text-[10px] uppercase tracking-[0.14em] text-slate-500 font-medium">
            Built for leaders
          </span>
        )}
      </div>
    </div>
  );
}
