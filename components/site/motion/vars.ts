import type { CSSProperties } from "react";

/**
 * Typed helper for the `--site-*` custom properties that site.css reads.
 * Safe in server components.
 *
 *   style={siteVars({ i: 2 })}            → { "--site-i": 2 }       stagger index
 *   style={siteVars({ level: 0.5 })}      → { "--site-level": 0.5 }
 */
export function siteVars(vars: Record<string, string | number>, base?: CSSProperties): CSSProperties {
  const out: Record<string, string | number> = {};
  for (const key in vars) out[`--site-${key}`] = vars[key];
  return { ...base, ...(out as CSSProperties) };
}
