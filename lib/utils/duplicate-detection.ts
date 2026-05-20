import type { Candidate } from "@/types";

/**
 * Basic duplicate detection per the spec:
 *   - Email exact match (case-insensitive)
 *   - Phone exact match (digits-only comparison)
 *   - LinkedIn URL exact match (case-insensitive, normalized)
 *   - First+last+location fuzzy match (lowercased exact for V1)
 *
 * Returns the first existing candidate that matches, or null if unique.
 * Match strength is ordered most → least confident.
 */

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7 ? digits : null;
}

function normalizeLinkedin(url: string | null | undefined): string | null {
  if (!url) return null;
  return url
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");
}

function normalizeEmail(email: string | null | undefined): string | null {
  return email ? email.toLowerCase().trim() : null;
}

export type DuplicateMatchReason =
  | "email"
  | "phone"
  | "linkedin"
  | "name_location";

export interface DuplicateMatch {
  candidate: Candidate;
  reason: DuplicateMatchReason;
}

export interface DuplicateInput {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
}

export function findDuplicate(
  candidate: DuplicateInput,
  existing: Candidate[]
): DuplicateMatch | null {
  const email = normalizeEmail(candidate.email);
  const phone = normalizePhone(candidate.phone);
  const linkedin = normalizeLinkedin(candidate.linkedinUrl);
  const firstName = candidate.firstName.trim().toLowerCase();
  const lastName = candidate.lastName.trim().toLowerCase();
  const city = (candidate.locationCity ?? "").trim().toLowerCase();
  const state = (candidate.locationState ?? "").trim().toLowerCase();

  // 1) Email exact
  if (email) {
    for (const c of existing) {
      if (normalizeEmail(c.email) === email) {
        return { candidate: c, reason: "email" };
      }
    }
  }

  // 2) Phone exact
  if (phone) {
    for (const c of existing) {
      if (normalizePhone(c.phone) === phone) {
        return { candidate: c, reason: "phone" };
      }
    }
  }

  // 3) LinkedIn exact
  if (linkedin) {
    for (const c of existing) {
      if (normalizeLinkedin(c.linkedinUrl) === linkedin) {
        return { candidate: c, reason: "linkedin" };
      }
    }
  }

  // 4) Name + location fuzzy (V1: lowercased exact match)
  if (firstName && lastName && (city || state)) {
    for (const c of existing) {
      const cFirst = c.firstName.trim().toLowerCase();
      const cLast = c.lastName.trim().toLowerCase();
      const cCity = (c.locationCity ?? "").trim().toLowerCase();
      const cState = (c.locationState ?? "").trim().toLowerCase();
      const nameMatch = cFirst === firstName && cLast === lastName;
      const locationMatch =
        (city && cCity === city) || (state && cState === state);
      if (nameMatch && locationMatch) {
        return { candidate: c, reason: "name_location" };
      }
    }
  }

  return null;
}
