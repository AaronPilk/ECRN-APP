import type { BlogPost } from "./types";

/**
 * Small text and date helpers for the blog. No time zone surprises: post dates
 * are calendar days (YYYY-MM-DD), and wherever a clock time is required we use
 * 12:00 UTC so the day reads the same in every US time zone.
 */

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-11-20" → "2026-11-20T12:00:00+00:00" (ISO 8601 with offset, for structured data and Open Graph). */
export function isoNoon(day: string): string {
  return DAY.test(day) ? `${day}T12:00:00+00:00` : day;
}

/** "2026-11-20" → "Fri, 20 Nov 2026 12:00:00 GMT" (RFC 822, as RSS 2.0 requires). */
export function rfc822(day: string): string {
  const m = DAY.exec(day);
  if (!m) return day;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const weekday = WEEKDAYS[new Date(Date.UTC(y, mo - 1, d, 12)).getUTCDay()];
  return `${weekday}, ${m[3]} ${MONTHS[mo - 1]} ${y} 12:00:00 GMT`;
}

/** A full stop after one of these is not the end of a sentence ("U.S. Bureau", "No. 1", "J. Smith"). */
const NOT_AN_ENDING = /(?:\b(?:U\.S|U\.K|D\.C|e\.g|i\.e|vs|approx|est|No|St|Mt|Ft|Inc|Co|Corp|Ltd|Jr|Sr|Mr|Mrs|Ms|Dr)|\b[A-Z])$/;

/** The first full sentence of a paragraph, or more when that sentence is very short. */
export function firstSentence(text: string, minChars = 70): string {
  const clean = text.replace(/\s+/g, " ").trim();
  for (const m of clean.matchAll(/[.?!](?=\s+["“(]?[A-Z0-9$])/g)) {
    const at = m.index ?? 0;
    if (m[0] === "." && NOT_AN_ENDING.test(clean.slice(0, at))) continue;
    if (at + 1 < minChars) continue;
    return clean.slice(0, at + 1);
  }
  return clean;
}

/** Card and feed teaser: the first sentence or so of the answer. */
export function excerptOf(post: Pick<BlogPost, "answer">): string {
  return firstSentence(post.answer);
}

const SMALL_WORDS = new Set(["a", "an", "and", "as", "at", "but", "by", "for", "in", "of", "on", "or", "the", "to", "vs", "with"]);

/** "Pay & salary" → "Pay & Salary" (for <title> tags, which are title case on this site). */
export function titleCase(s: string): string {
  return s
    .split(" ")
    .map((w, i) => (i > 0 && SMALL_WORDS.has(w.toLowerCase()) ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/** Escape text for an XML document (RSS). Also drops characters XML 1.0 does not allow. */
export function xmlEscape(s: string): string {
  return s
    .replace(/[^\x09\x0A\x0D\x20-퟿-�\u{10000}-\u{10FFFF}]/gu, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
