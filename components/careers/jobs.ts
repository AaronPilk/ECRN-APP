import type { Job } from "@/types";

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Open jobs whose title contains one of the role's keywords, case-insensitive.
 * Keywords match as whole words (an optional plural "s" is allowed), so "vp"
 * does not match inside another word and "foreman" does not match "foremanship".
 */
export function jobsForRole(jobs: Job[], keywords: string[]): Job[] {
  const tests = keywords
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean)
    .map((k) => new RegExp(`(^|[^a-z0-9])${escapeRegExp(k)}s?($|[^a-z0-9])`));
  if (!tests.length) return [];
  return jobs.filter((j) => {
    const title = (j.title ?? "").toLowerCase();
    return tests.some((re) => re.test(title));
  });
}
