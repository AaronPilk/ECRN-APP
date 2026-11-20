"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  INVITE_CODE_RE,
  UUID_RE,
  cleanInviteCode,
  parseList,
  parseTerritories,
  uniqueInviteCode,
  type BulkAddResult,
  type StaffField,
  type StaffFormState,
  type TeamRole,
} from "@/components/admin/team/shared";

/**
 * Team mutations: add, edit, deactivate / reactivate, and bulk add.
 *
 * Owners only: every action re-checks `requireAdmin()` and Row Level Security
 * on `staff` refuses everyone else anyway. Team members are never deleted
 * (deactivate instead) so sign-up credit and assignment history stay intact.
 * The Bullhorn sync may write the same rows, so nothing here assumes it is
 * the only writer: uniqueness is checked up front and again by the database.
 */

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

interface RosterRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  staff_role: TeamRole;
  manager_id: string | null;
  invite_code: string;
  external_crm_id: string | null;
  is_active: boolean;
}

const ROSTER_COLUMNS = "id, first_name, last_name, email, staff_role, manager_id, invite_code, external_crm_id, is_active";

async function loadRoster(sb: Supabase): Promise<RosterRow[]> {
  const { data, error } = await sb.from("staff").select(ROSTER_COLUMNS).limit(1000);
  if (error) throw new Error(`Could not load the team: ${error.message}`);
  return (data ?? []) as RosterRow[];
}

const rosterName = (r: Pick<RosterRow, "first_name" | "last_name">) => `${r.first_name} ${r.last_name}`.trim();
const field = (fd: FormData, key: string): string => {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
};

/** Other admin screens show team names and pickers, so refresh the whole admin area. */
function refreshAdmin() {
  revalidatePath("/admin/team");
  revalidatePath("/(app)/admin", "layout");
}

// ── add / edit one person ────────────────────────────────────────────

const StaffSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(80, "Keep this under 80 characters"),
  lastName: z.string().max(80, "Keep this under 80 characters"),
  title: z.string().max(120, "Keep this under 120 characters"),
  email: z.union([z.literal(""), z.string().max(254).email("That email doesn't look right")]),
  phone: z.string().max(40, "Keep this under 40 characters"),
  staffRole: z.enum(["owner", "account_manager", "recruiter"], { message: "Pick a role" }),
  managerId: z.union([z.literal(""), z.string().regex(UUID_RE, "Pick an account manager from the list")]),
  inviteCode: z.string().regex(INVITE_CODE_RE, "Use 3 to 24 letters or numbers, no spaces"),
  externalCrmId: z.string().max(64, "Keep this under 64 characters"),
});

function dbErrorToState(error: { code?: string; message: string }): StaffFormState {
  const msg = error.message ?? "";
  if (error.code === "23505" && msg.includes("invite_code")) {
    return { fieldErrors: { inviteCode: "Someone else just took that code. Pick another one." } };
  }
  if (error.code === "23505" && msg.includes("external_crm_id")) {
    return { fieldErrors: { externalCrmId: "Another team member already has this Bullhorn user ID." } };
  }
  if (error.code === "23514" && msg.includes("invite_code")) {
    return { fieldErrors: { inviteCode: "Use 3 to 24 letters or numbers, no spaces" } };
  }
  return { error: `Couldn't save: ${msg || "unknown error"}` };
}

/**
 * Create (no `staffId`) or update a team member. Redirects to their page on
 * success; returns field errors when something needs fixing.
 */
export async function saveStaffAction(formData: FormData): Promise<StaffFormState> {
  await requireAdmin();

  const parsed = StaffSchema.safeParse({
    firstName: field(formData, "firstName"),
    lastName: field(formData, "lastName"),
    title: field(formData, "title"),
    email: field(formData, "email"),
    phone: field(formData, "phone"),
    staffRole: field(formData, "staffRole"),
    managerId: field(formData, "managerId"),
    inviteCode: cleanInviteCode(field(formData, "inviteCode")),
    externalCrmId: field(formData, "externalCrmId"),
  });

  const fieldErrors: Partial<Record<StaffField, string>> = {};
  if (!parsed.success) {
    const flat = parsed.error.flatten().fieldErrors as Partial<Record<StaffField, string[]>>;
    for (const key of Object.keys(flat) as StaffField[]) {
      const first = flat[key]?.[0];
      if (first) fieldErrors[key] = first;
    }
  }

  const territories = parseTerritories(field(formData, "territories"));
  if (territories.invalid.length) {
    fieldErrors.territories = `Not a state code: ${territories.invalid.slice(0, 6).join(", ")}. Use two letters, like FL, GA, TX.`;
  }
  const specialties = parseList(field(formData, "specialties")).slice(0, 30);
  if (specialties.some((s) => s.length > 60)) fieldErrors.specialties = "Keep each specialty under 60 characters";

  if (!parsed.success) return { error: "Check the highlighted fields.", fieldErrors };
  const d = parsed.data;

  const staffId = field(formData, "staffId");
  if (staffId && !UUID_RE.test(staffId)) return { error: "This team member could not be found." };

  const sb = await createSupabaseServerClient();
  let roster: RosterRow[];
  try {
    roster = await loadRoster(sb);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not load the team." };
  }
  const existing = staffId ? roster.find((r) => r.id === staffId) ?? null : null;
  if (staffId && !existing) return { error: "This team member no longer exists. Go back to the team list." };
  const others = roster.filter((r) => r.id !== staffId);

  // Friendly uniqueness checks (the database enforces the code and Bullhorn ID as well).
  const codeOwner = others.find((r) => r.invite_code.toUpperCase() === d.inviteCode);
  if (codeOwner) {
    const taken = new Set(others.map((r) => r.invite_code.toUpperCase()));
    const alt = uniqueInviteCode(d.firstName, d.lastName, taken);
    fieldErrors.inviteCode = `${d.inviteCode} already belongs to ${rosterName(codeOwner)}. Try ${alt}.`;
  }
  if (d.email) {
    const emailOwner = others.find((r) => (r.email ?? "").toLowerCase() === d.email.toLowerCase());
    if (emailOwner) fieldErrors.email = `${rosterName(emailOwner)} is already on the team with this email.`;
  }
  if (d.externalCrmId) {
    const crmOwner = others.find((r) => r.external_crm_id === d.externalCrmId);
    if (crmOwner) fieldErrors.externalCrmId = `${rosterName(crmOwner)} already has this Bullhorn user ID.`;
  }

  // Only recruiters report to an account manager.
  let managerId: string | null = null;
  if (d.staffRole === "recruiter" && d.managerId) {
    const manager = others.find((r) => r.id === d.managerId);
    if (!manager) fieldErrors.managerId = "Pick an account manager from the list";
    else if (manager.staff_role === "recruiter") fieldErrors.managerId = "Pick an account manager or owner, not another recruiter.";
    else managerId = manager.id;
  }
  if (existing && existing.staff_role !== "recruiter" && d.staffRole === "recruiter") {
    const reports = others.filter((r) => r.manager_id === existing.id).length;
    if (reports > 0) {
      fieldErrors.staffRole = `${reports} ${reports === 1 ? "person reports" : "people report"} to ${d.firstName}. Move them to another account manager first.`;
    }
  }

  if (Object.keys(fieldErrors).length) return { error: "Check the highlighted fields.", fieldErrors };

  const payload = {
    first_name: d.firstName,
    last_name: d.lastName,
    title: d.title || null,
    email: d.email || null,
    phone: d.phone || null,
    staff_role: d.staffRole,
    manager_id: managerId,
    invite_code: d.inviteCode,
    specialties,
    territories: territories.codes,
    external_crm_id: d.externalCrmId || null,
    is_active: formData.get("isActive") === "on",
  };

  let savedId: string;
  if (existing) {
    const { data, error } = await sb.from("staff").update(payload).eq("id", existing.id).select("id").maybeSingle();
    if (error) return dbErrorToState(error);
    if (!data) return { error: "This team member no longer exists. Go back to the team list." };
    savedId = String((data as { id: string }).id);
  } else {
    const { data, error } = await sb.from("staff").insert(payload).select("id").single();
    if (error) return dbErrorToState(error);
    savedId = String((data as { id: string }).id);
  }

  refreshAdmin();
  const name = `${d.firstName} ${d.lastName}`.trim();
  redirect(`/admin/team/${savedId}?message=${encodeURIComponent(existing ? `${name} was updated.` : `${name} was added. Their sign-up link is ready to share.`)}`);
}

// ── deactivate / reactivate ──────────────────────────────────────────

/** Form fields: `staffId`, `active` ("1" to reactivate, anything else to deactivate). */
export async function setStaffActiveAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const staffId = field(formData, "staffId");
  const active = field(formData, "active") === "1";
  if (!UUID_RE.test(staffId)) redirect(`/admin/team?error=${encodeURIComponent("That team member could not be found.")}`);

  const sb = await createSupabaseServerClient();
  const { data, error } = await sb
    .from("staff")
    .update({ is_active: active })
    .eq("id", staffId)
    .select("id, first_name, last_name")
    .maybeSingle();

  if (error) redirect(`/admin/team/${staffId}?error=${encodeURIComponent(`Couldn't update: ${error.message}`)}`);
  if (!data) redirect(`/admin/team?error=${encodeURIComponent("That team member could not be found.")}`);

  refreshAdmin();
  const name = rosterName(data as Pick<RosterRow, "first_name" | "last_name">);
  const message = active
    ? `${name} is active again. Their link and code work.`
    : `${name} is now inactive. Their link and code no longer credit new sign-ups; their history is kept.`;
  redirect(`/admin/team/${staffId}?message=${encodeURIComponent(message)}`);
}

// ── bulk add ─────────────────────────────────────────────────────────

const MAX_BULK_LINES = 200;
const EMAIL_RE = /^[^\s@,]+@[^\s@,]+\.[^\s@,]+$/;

const ROLE_WORDS: Record<string, TeamRole> = {
  recruiter: "recruiter",
  recruiters: "recruiter",
  rec: "recruiter",
  "account manager": "account_manager",
  "acct manager": "account_manager",
  manager: "account_manager",
  am: "account_manager",
  owner: "owner",
};
const roleFromWord = (raw: string): TeamRole | null => ROLE_WORDS[raw.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim()] ?? null;

interface BulkEntry {
  line: number;
  text: string;
  firstName: string;
  lastName: string;
  email: string | null;
  role: TeamRole;
  managerRef: string;
}

/**
 * Paste one person per line: `First Last, email, role, manager code`.
 * Role defaults to recruiter. The manager can be given by code, email or
 * full name, and can be someone from the same paste. People already on the
 * team (same email) are skipped, so pasting a list twice is safe.
 */
export async function bulkAddStaffAction(formData: FormData): Promise<BulkAddResult> {
  await requireAdmin();
  const result: BulkAddResult = { added: [], skipped: [], retryText: "" };
  const retry: string[] = [];
  const skip = (line: number, text: string, reason: string, canRetry = true) => {
    result.skipped.push({ line, text, reason });
    if (canRetry) retry.push(text);
  };

  const raw = formData.get("people");
  const lines = (typeof raw === "string" ? raw : "").split(/\r?\n/);
  const filled = lines.filter((l) => l.trim()).length;
  if (!filled) return { ...result, error: "Paste at least one person, one per line." };
  if (filled > MAX_BULK_LINES) {
    return { ...result, error: `That's ${filled} lines. Paste up to ${MAX_BULK_LINES} at a time.`, retryText: typeof raw === "string" ? raw : "" };
  }

  const sb = await createSupabaseServerClient();
  let roster: RosterRow[];
  try {
    roster = await loadRoster(sb);
  } catch (e) {
    return { ...result, error: e instanceof Error ? e.message : "Could not load the team.", retryText: typeof raw === "string" ? raw : "" };
  }

  const takenCodes = new Set(roster.map((r) => r.invite_code.toUpperCase()));
  const knownEmails = new Set(roster.filter((r) => r.email).map((r) => (r.email as string).toLowerCase()));
  const knownNamesWithoutEmail = new Set(roster.filter((r) => !r.email).map((r) => rosterName(r).toLowerCase()));
  const seenEmails = new Set<string>();
  const seenNames = new Set<string>();

  // 1. Read the lines.
  const entries: BulkEntry[] = [];
  let seenFirstLine = false;
  lines.forEach((rawLine, i) => {
    const text = rawLine.trim();
    if (!text) return;
    const lineNo = i + 1;
    const parts = (text.includes("\t") ? text.split("\t") : text.split(",")).map((p) => p.trim());
    const name = (parts[0] ?? "").replace(/\s+/g, " ");

    // A pasted header row ("Name, Email, Role, Manager") is not a person.
    if (!seenFirstLine) {
      seenFirstLine = true;
      if (/^(name|full name|first last|first name)$/i.test(name)) return;
    }

    if (!name) return skip(lineNo, text, "No name");
    if (name.length > 120) return skip(lineNo, text, "Name is too long");

    let emailRaw = parts[1] ?? "";
    let roleRaw = parts[2] ?? "";
    let managerRef = parts[3] ?? "";
    // "Mike Smith, recruiter, DANAW": no email, so everything sits one place to the left.
    if (emailRaw && !emailRaw.includes("@") && roleFromWord(emailRaw) && parts.length <= 3) {
      managerRef = roleRaw;
      roleRaw = emailRaw;
      emailRaw = "";
    }
    if (emailRaw && (!EMAIL_RE.test(emailRaw) || emailRaw.length > 254)) {
      return skip(lineNo, text, `"${emailRaw}" doesn't look like an email`);
    }
    const role = roleRaw ? roleFromWord(roleRaw) : "recruiter";
    if (!role) return skip(lineNo, text, `Role "${roleRaw}" isn't recognized. Use recruiter, account manager or owner.`);

    const email = emailRaw || null;
    if (email) {
      const key = email.toLowerCase();
      if (knownEmails.has(key)) return skip(lineNo, text, "Already on the team (same email)", false);
      if (seenEmails.has(key)) return skip(lineNo, text, "Listed twice in this paste (same email)", false);
      seenEmails.add(key);
    } else {
      const key = name.toLowerCase();
      if (knownNamesWithoutEmail.has(key)) return skip(lineNo, text, "Already on the team (same name, no email)", false);
      if (seenNames.has(key)) return skip(lineNo, text, "Listed twice in this paste (same name, no email)", false);
      seenNames.add(key);
    }

    const [firstName, ...rest] = name.split(" ");
    entries.push({ line: lineNo, text, firstName: firstName.slice(0, 80), lastName: rest.join(" ").slice(0, 80), email, role, managerRef });
  });

  // 2. Save. Account managers and owners first so recruiters in the same paste can point at them.
  const insertBatch = async (batch: { entry: BulkEntry; managerId: string | null; managerName: string | null }[]) => {
    if (!batch.length) return;
    const rows = batch.map(({ entry, managerId }) => {
      const code = uniqueInviteCode(entry.firstName, entry.lastName, takenCodes);
      takenCodes.add(code);
      return {
        first_name: entry.firstName,
        last_name: entry.lastName,
        email: entry.email,
        staff_role: entry.role,
        manager_id: managerId,
        invite_code: code,
      };
    });
    const { data, error } = await sb.from("staff").insert(rows).select(ROSTER_COLUMNS);
    if (error) {
      for (const { entry } of batch) skip(entry.line, entry.text, `Couldn't save: ${error.message}`);
      return;
    }
    const saved = (data ?? []) as RosterRow[];
    roster.push(...saved);
    batch.forEach(({ entry, managerName }, idx) => {
      result.added.push({
        name: `${entry.firstName} ${entry.lastName}`.trim(),
        code: rows[idx].invite_code,
        role: entry.role,
        manager: managerName,
      });
    });
  };

  await insertBatch(entries.filter((e) => e.role !== "recruiter").map((entry) => ({ entry, managerId: null, managerName: null })));

  const findManager = (ref: string): RosterRow | null => {
    const key = ref.trim().toLowerCase();
    return (
      roster.find((r) => r.invite_code.toLowerCase() === key) ??
      roster.find((r) => (r.email ?? "").toLowerCase() === key) ??
      roster.find((r) => rosterName(r).toLowerCase() === key) ??
      null
    );
  };
  const recruiters: { entry: BulkEntry; managerId: string | null; managerName: string | null }[] = [];
  for (const entry of entries.filter((e) => e.role === "recruiter")) {
    if (!entry.managerRef) {
      recruiters.push({ entry, managerId: null, managerName: null });
      continue;
    }
    const manager = findManager(entry.managerRef);
    if (!manager) {
      skip(entry.line, entry.text, `Account manager "${entry.managerRef}" wasn't found. Use their code, email or full name.`);
    } else if (manager.staff_role === "recruiter") {
      skip(entry.line, entry.text, `${rosterName(manager)} is a recruiter, not an account manager`);
    } else {
      recruiters.push({ entry, managerId: manager.id, managerName: rosterName(manager) });
    }
  }
  await insertBatch(recruiters);

  result.skipped.sort((a, b) => a.line - b.line);
  result.retryText = retry.join("\n");
  if (result.added.length) refreshAdmin();
  return result;
}
