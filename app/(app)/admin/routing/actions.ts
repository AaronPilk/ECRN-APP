"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listStaff } from "@/lib/admin/staff";
import { updateApplicationStatus } from "@/lib/data/repository";
import { APPLICATION_STATUSES, ASSIGN_ENTITIES, isUuid, type AssignEntity } from "@/lib/admin/routing";
import type { ApplicationStatus } from "@/types";

/**
 * Ownership mutations: assign an account manager / recruiter by hand, re-run
 * automatic routing, and change an application's status.
 *
 * Every action re-checks the admin role, validates its input, and sends the
 * admin back to the screen they came from with a short result in the URL.
 */

/** Result params these actions add. Stripped before adding a new one. */
const RESULT_PARAMS = ["error", "assigned", "routed", "updated"];

const TABLE: Record<AssignEntity, string> = {
  candidate: "candidates",
  job_application: "job_applications",
  job_referral: "job_referrals",
};

const MAX_TARGETS = 25;

/** Ownership shows up on most admin screens, so refresh all of them. */
function revalidateAdmin(): void {
  revalidatePath("/(app)/admin", "layout");
  for (const path of ["/admin", "/admin/routing", "/admin/applications", "/admin/candidates"]) revalidatePath(path);
}

/** Placeholder origin for parsing site-relative paths. Never shown or requested. */
const ORIGIN = "http://ecrn.local";

/** Only ever send people back to an admin screen on this site. */
function safeReturnTo(value: FormDataEntryValue | null, fallback: string): string {
  const s = typeof value === "string" ? value : "";
  if (!s.startsWith("/") || s.startsWith("//") || s.includes("\\")) return fallback;
  try {
    const url = new URL(s, ORIGIN);
    if (url.origin !== ORIGIN || !/^\/admin(?:\/|$)/.test(url.pathname)) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

function withResult(path: string, result: Record<string, string>): string {
  const url = new URL(path, ORIGIN);
  for (const key of RESULT_PARAMS) url.searchParams.delete(key);
  for (const [key, value] of Object.entries(result)) url.searchParams.set(key, value);
  return `${url.pathname}${url.search}${url.hash}`;
}

/** "" → null (nobody), a staff id → that id, anything else → undefined (bad input). */
function staffChoice(value: FormDataEntryValue | null): string | null | undefined {
  if (value === null || value === "") return null;
  return isUuid(value) ? value : undefined;
}

function parseTargets(formData: FormData): { entity: AssignEntity; id: string }[] | null {
  const seen = new Set<string>();
  const out: { entity: AssignEntity; id: string }[] = [];
  for (const raw of formData.getAll("target")) {
    if (typeof raw !== "string") return null;
    const [entity, id, ...rest] = raw.split(":");
    if (rest.length || !ASSIGN_ENTITIES.includes(entity as AssignEntity) || !isUuid(id)) return null;
    if (seen.has(raw)) continue;
    seen.add(raw);
    out.push({ entity: entity as AssignEntity, id });
  }
  return out.length > 0 && out.length <= MAX_TARGETS ? out : null;
}

/**
 * Give one or more items (a person, an application, a job referral) to an
 * account manager and/or recruiter. Posted by <AssignControl />.
 *
 * Fields: `target` = "entity:uuid" (repeatable), `accountManagerId`,
 * `recruiterId` (either may be blank), `returnTo`.
 */
export async function assignAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const back = safeReturnTo(formData.get("returnTo"), "/admin/routing");

  const targets = parseTargets(formData);
  let accountManagerId = staffChoice(formData.get("accountManagerId"));
  const recruiterId = staffChoice(formData.get("recruiterId"));
  if (!targets || accountManagerId === undefined || recruiterId === undefined) {
    redirect(withResult(back, { error: "That assignment could not be read. Reload the page and try again." }));
  }

  const staff = new Map((await listStaff()).map((s) => [s.id, s]));
  const manager = accountManagerId ? staff.get(accountManagerId) : null;
  const recruiter = recruiterId ? staff.get(recruiterId) : null;
  if (accountManagerId && !manager) {
    redirect(withResult(back, { error: "That account manager is no longer on the team. Pick someone else." }));
  }
  if (recruiterId && !recruiter) {
    redirect(withResult(back, { error: "That recruiter is no longer on the team. Pick someone else." }));
  }

  // An account manager who keeps the person for themselves owns it too.
  // (For a recruiter, the database fills in their manager.)
  if (!accountManagerId && recruiter && recruiter.staffRole !== "recruiter") accountManagerId = recruiter.id;

  const sb = await createSupabaseServerClient();

  if (!accountManagerId && !recruiterId) {
    // Both blank means "send back to the queue". Refuse it when there is nothing to clear.
    const current = await Promise.all(
      targets.map((t) =>
        sb.from(TABLE[t.entity]).select("account_manager_id, recruiter_id").eq("id", t.id).maybeSingle()
      )
    );
    const anythingToClear = current.some((r) => r.data?.account_manager_id || r.data?.recruiter_id);
    if (!anythingToClear) {
      redirect(withResult(back, { error: "Pick an account manager or a recruiter first." }));
    }
  }

  let failure: string | null = null;
  for (const t of targets) {
    const { error } = await sb.rpc("admin_assign", {
      p_entity: t.entity,
      p_id: t.id,
      p_account_manager: accountManagerId,
      p_recruiter: recruiterId,
    });
    if (error) {
      failure = error.message;
      break;
    }
  }

  revalidateAdmin();
  if (failure) redirect(withResult(back, { error: `The assignment was not saved: ${failure}` }));

  const outcome =
    !accountManagerId && !recruiterId
      ? "cleared"
      : !accountManagerId && recruiter && !recruiter.managerId
        ? "no_manager"
        : "ok";
  redirect(withResult(back, { assigned: outcome }));
}

/** Re-run the automatic rules for everyone who still has no owner. */
export async function autoRouteAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const back = safeReturnTo(formData.get("returnTo"), "/admin/routing");
  const sb = await createSupabaseServerClient();
  const { data, error } = await sb.rpc("admin_route_unassigned");
  if (error) redirect(withResult(back, { error: `Auto-routing did not run: ${error.message}` }));
  revalidateAdmin();
  const routed = typeof data === "number" && Number.isFinite(data) ? Math.max(0, Math.round(data)) : 0;
  redirect(withResult(back, { routed: String(routed) }));
}

/** Inline status change on the applications list. */
export async function setApplicationStatusAction(formData: FormData): Promise<void> {
  const admin = await requireAdmin();
  const back = safeReturnTo(formData.get("returnTo"), "/admin/applications");
  const applicationId = formData.get("applicationId");
  const status = formData.get("status");
  if (!isUuid(applicationId) || !APPLICATION_STATUSES.includes(status as ApplicationStatus)) {
    redirect(withResult(back, { error: "That status change could not be read. Reload the page and try again." }));
  }

  let failure: string | null = null;
  try {
    await updateApplicationStatus(applicationId, status as ApplicationStatus, admin.id);
  } catch (e) {
    failure = e instanceof Error ? e.message : "unknown error";
  }
  revalidateAdmin();
  if (failure) redirect(withResult(back, { error: `The status was not saved: ${failure}` }));
  redirect(withResult(back, { updated: "status" }));
}
