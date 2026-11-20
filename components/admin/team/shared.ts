/**
 * Types and small pure helpers shared by the Team forms (client) and the
 * Team server actions. No server-only or client-only code in here.
 */

export type TeamRole = "owner" | "account_manager" | "recruiter";

export const TEAM_ROLES: { value: TeamRole; label: string }[] = [
  { value: "recruiter", label: "Recruiter" },
  { value: "account_manager", label: "Account manager" },
  { value: "owner", label: "Owner" },
];

/** Stored form: 3 to 24 capital letters or digits. */
export const INVITE_CODE_RE = /^[A-Z0-9]{3,24}$/;
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Letters and digits only, uppercase, accents removed. */
function alnum(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/** What the person typed, tidied up the way we store it. */
export function cleanInviteCode(raw: string): string {
  return raw.trim().toUpperCase();
}

/**
 * Suggested code: first name + last initial, e.g. "Mike Smith" → MIKES.
 * Returns "" when there is not enough to make a valid code yet.
 */
export function suggestInviteCode(firstName: string, lastName: string): string {
  const first = alnum(firstName);
  const last = alnum(lastName);
  if (!first) return "";
  let code = (first.slice(0, 23) + last.slice(0, 1)).slice(0, 24);
  // Very short names: borrow more of the last name so the code reaches 3 characters.
  if (code.length < 3) code = (first + last).slice(0, 3);
  return code.length >= 3 ? code : "";
}

/** A valid code nobody else has: the suggestion, then MIKES2, MIKES3… */
export function uniqueInviteCode(firstName: string, lastName: string, taken: Set<string>): string {
  let base = suggestInviteCode(firstName, lastName) || alnum(firstName + lastName);
  if (base.length < 3) base = (base + "ECRN").slice(0, 4);
  if (!taken.has(base)) return base;
  for (let n = 2; n < 10000; n++) {
    const suffix = String(n);
    const code = base.slice(0, 24 - suffix.length) + suffix;
    if (!taken.has(code)) return code;
  }
  return base.slice(0, 16) + Date.now().toString(36).toUpperCase().slice(-8);
}

/** "Electrical, Low voltage,  electrical" → ["Electrical", "Low voltage"] */
export function parseList(raw: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(/[,;\n]/)) {
    const v = part.trim().replace(/\s+/g, " ");
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

/** State codes the app knows places for (50 states, DC, Puerto Rico). */
export const US_STATE_CODES = new Set(
  (
    "AK,AL,AR,AZ,CA,CO,CT,DC,DE,FL,GA,HI,IA,ID,IL,IN,KS,KY,LA,MA,MD,ME,MI,MN,MO,MS,MT," +
    "NC,ND,NE,NH,NJ,NM,NV,NY,OH,OK,OR,PA,PR,RI,SC,SD,TN,TX,UT,VA,VT,WA,WI,WV,WY"
  ).split(",")
);

/** "fl, ga tx" → { codes: ["FL","GA","TX"], invalid: [] } */
export function parseTerritories(raw: string): { codes: string[]; invalid: string[] } {
  const codes: string[] = [];
  const invalid: string[] = [];
  for (const part of raw.split(/[\s,;]+/)) {
    const v = part.trim().toUpperCase();
    if (!v) continue;
    if (US_STATE_CODES.has(v)) {
      if (!codes.includes(v)) codes.push(v);
    } else if (!invalid.includes(v)) {
      invalid.push(v);
    }
  }
  return { codes, invalid };
}

// ── form state ───────────────────────────────────────────────────────

export type StaffField =
  | "firstName"
  | "lastName"
  | "title"
  | "email"
  | "phone"
  | "staffRole"
  | "managerId"
  | "inviteCode"
  | "specialties"
  | "territories"
  | "externalCrmId";

/** Returned by the save action only when something needs fixing. */
export interface StaffFormState {
  error?: string;
  fieldErrors?: Partial<Record<StaffField, string>>;
}

export interface BulkAddResult {
  /** Set when nothing could be processed at all. */
  error?: string;
  added: { name: string; code: string; role: TeamRole; manager: string | null }[];
  skipped: { line: number; text: string; reason: string }[];
  /** Lines worth fixing and pasting again (duplicates are left out). */
  retryText: string;
}

/** Example shown in the bulk add box. */
export const BULK_ADD_EXAMPLE = [
  "Dana Whitfield, dana@example.com, account manager",
  "Mike Smith, mike@example.com, recruiter, dana@example.com",
  "Priya Patel, priya@example.com",
].join("\n");
