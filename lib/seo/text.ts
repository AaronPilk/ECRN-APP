/**
 * Small text helpers for the sitemap, llms.txt and llms-full.txt.
 * Content fields use the inline markdown subset described in lib/blog/types.ts.
 * For "the first sentence of an answer" use firstSentence() in lib/blog/format.ts,
 * the same one the blog cards use.
 */

/** Strip the inline markdown subset down to plain text. */
export function plain(inline: string): string {
  return inline
    .replace(/\[\^\d+\]/g, "") // source marks: [^3]
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1") // [text](url) → text
    .replace(/\*\*([^*]+)\*\*/g, "$1") // **bold**
    .replace(/\*([^*\s][^*]*)\*/g, "$1") // *italic*
    .replace(/\s+/g, " ")
    .replace(/ ([.,;:!?])/g, "$1")
    .trim();
}

/** The later of several YYYY-MM-DD days. Ignores anything that is not a date. */
export function latestDay(days: Array<string | undefined>, fallback: string): string {
  const valid = days.filter((d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}/.test(d)).map((d) => d.slice(0, 10));
  return valid.length ? valid.sort()[valid.length - 1] : fallback;
}
