import { cache } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { listStaff, splitStaff, staffName, STAFF_ROLE_LABEL } from "@/lib/admin/staff";
import { assignAction } from "@/app/(app)/admin/routing/actions";
import type { AssignEntity } from "@/lib/admin/routing";
import type { Staff } from "@/types";
import { RecruiterSelect, SubmitButton } from "./AssignClient";

/**
 * Pick the account manager and recruiter for a person, an application, or a
 * job referral. A plain form post to `assignAction`, so it works without
 * client JavaScript. Drop it into any admin screen:
 *
 *   <AssignControl entity="candidate" id={c.id} accountManagerId={c.accountManagerId}
 *                  recruiterId={c.recruiterId} returnTo="/admin/candidates" />
 *
 * It loads the team itself (one cached query per page, however many rows).
 */

export interface AssignTarget {
  entity: AssignEntity;
  id: string;
}

interface AssignControlProps extends AssignTarget {
  accountManagerId?: string | null;
  recruiterId?: string | null;
  /** Admin path (with its query string) to come back to after saving. */
  returnTo: string;
  /** More items that should go to the same people in the same save. */
  also?: AssignTarget[];
  /** Who or what this is for, read out by screen readers. */
  subject?: string;
  /** "stack" fits a table cell, "row" suits a panel. */
  layout?: "stack" | "row";
  className?: string;
}

export interface RecruiterOption {
  id: string;
  name: string;
  /** The account manager picked along with this person. */
  managerId: string;
}

export interface AssignOptions {
  accountManagers: Staff[];
  groups: { key: string; label: string; options: RecruiterOption[] }[];
  byId: Map<string, Staff>;
}

/**
 * The pickers' contents: active account managers, and recruiters grouped under
 * their account manager. Built once per request and shared by every control
 * on the page (and by filters that want the same grouping).
 */
export const getAssignOptions = cache(async (): Promise<AssignOptions> => {
  const all = await listStaff();
  const byId = new Map(all.map((s) => [s.id, s]));
  const { accountManagers, recruiters } = splitStaff(all);

  const groups: AssignOptions["groups"] = accountManagers.map((m) => ({
    key: m.id,
    label: `${staffName(m)}'s team`,
    options: [
      // An account manager can keep someone and work them personally.
      { id: m.id, name: `${staffName(m)} (${STAFF_ROLE_LABEL[m.staffRole].toLowerCase()})`, managerId: m.id },
      ...recruiters.filter((r) => r.managerId === m.id).map((r) => ({ id: r.id, name: staffName(r), managerId: m.id })),
    ],
  }));
  const managed = new Set(accountManagers.map((m) => m.id));
  const loose = recruiters.filter((r) => !r.managerId || !managed.has(r.managerId));
  if (loose.length > 0) {
    groups.push({
      key: "none",
      label: "No account manager yet",
      options: loose.map((r) => ({ id: r.id, name: staffName(r), managerId: "" })),
    });
  }
  return { accountManagers, groups, byId };
});

const selectClass =
  "h-9 w-full min-w-0 rounded-[10px] border border-ecrn-line bg-white px-2.5 text-[13px] text-ecrn-ink " +
  "focus:outline-none focus:border-ecrn-green focus:ring-2 focus:ring-ecrn-green/20";

export async function AssignControl({
  entity,
  id,
  accountManagerId = null,
  recruiterId = null,
  returnTo,
  also = [],
  subject,
  layout = "stack",
  className,
}: AssignControlProps) {
  const { accountManagers, groups, byId } = await getAssignOptions();

  if (byId.size === 0) {
    return (
      <p className={cn("text-[12.5px] text-ecrn-secondary", className)}>
        <Link href="/admin/team" className="font-medium text-ecrn-green-text hover:underline">
          Add your team
        </Link>{" "}
        to assign people.
      </p>
    );
  }

  // Someone who is assigned but has since been made inactive (or changed role)
  // still has to be an option, or saving would silently drop them.
  const currentManager = accountManagerId ? byId.get(accountManagerId) : undefined;
  const extraManager = currentManager && !accountManagers.some((m) => m.id === currentManager.id) ? currentManager : null;
  const currentRecruiter = recruiterId ? byId.get(recruiterId) : undefined;
  const extraRecruiter =
    currentRecruiter && !groups.some((g) => g.options.some((o) => o.id === currentRecruiter.id)) ? currentRecruiter : null;

  const targets = [{ entity, id }, ...also];
  const about = subject ? ` for ${subject}` : "";
  const row = layout === "row";

  return (
    <form
      // Remount when the saved owner changes so the pickers always show what is stored.
      key={`${accountManagerId ?? ""}:${recruiterId ?? ""}`}
      action={assignAction}
      className={cn(row ? "flex flex-wrap items-end gap-2.5" : "flex w-[190px] max-w-full flex-col gap-1.5", className)}
    >
      {targets.map((t) => (
        <input key={`${t.entity}:${t.id}`} type="hidden" name="target" value={`${t.entity}:${t.id}`} />
      ))}
      <input type="hidden" name="returnTo" value={returnTo} />

      <label className={cn("block min-w-0", row && "w-full sm:w-[230px]")}>
        <span className={row ? "mb-1 block text-[12px] font-medium text-ecrn-secondary" : "sr-only"}>
          Account manager{row ? "" : about}
        </span>
        <select name="accountManagerId" defaultValue={accountManagerId ?? ""} className={selectClass}>
          <option value="">No account manager</option>
          {accountManagers.map((m) => (
            <option key={m.id} value={m.id}>
              {staffName(m)}
            </option>
          ))}
          {extraManager && <option value={extraManager.id}>{staffName(extraManager)} (current)</option>}
        </select>
      </label>

      <label className={cn("block min-w-0", row && "w-full sm:w-[230px]")}>
        <span className={row ? "mb-1 block text-[12px] font-medium text-ecrn-secondary" : "sr-only"}>
          Recruiter{row ? "" : about}
        </span>
        <RecruiterSelect name="recruiterId" defaultValue={recruiterId ?? ""} className={selectClass}>
          <option value="">No recruiter</option>
          {groups.map((g) => (
            <optgroup key={g.key} label={g.label}>
              {g.options.map((o) => (
                <option key={o.id} value={o.id} data-manager={o.managerId}>
                  {o.name}
                </option>
              ))}
            </optgroup>
          ))}
          {extraRecruiter && (
            <option value={extraRecruiter.id} data-manager={extraRecruiter.managerId ?? ""}>
              {staffName(extraRecruiter)} (current)
            </option>
          )}
        </RecruiterSelect>
      </label>

      <SubmitButton
        className={
          row ? undefined : "w-full border border-[#A7E9C4] bg-ecrn-action-surface text-ecrn-green-text hover:bg-ecrn-selected"
        }
      >
        Save
      </SubmitButton>
    </form>
  );
}
