"use client";

import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { cn } from "@/lib/utils/cn";
import { saveStaffAction } from "@/app/(app)/admin/team/actions";
import { TEAM_ROLES, cleanInviteCode, suggestInviteCode, type StaffField, type StaffFormState, type TeamRole } from "./shared";

export interface TeamMemberFormValues {
  id?: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  staffRole: TeamRole;
  managerId: string;
  inviteCode: string;
  specialties: string;
  territories: string;
  externalCrmId: string;
  isActive: boolean;
}

export interface ManagerOption {
  id: string;
  name: string;
  /** e.g. "Account manager", "Owner", "Account manager, inactive". */
  note: string;
}

const inputClass = "h-11 text-[16px] sm:text-[15px]";
const selectClass =
  "w-full h-11 px-3.5 rounded-[14px] bg-white border border-ecrn-line text-[16px] sm:text-[15px] text-ecrn-ink " +
  "focus:outline-none focus:border-ecrn-green focus:ring-2 focus:ring-ecrn-green/20 disabled:bg-slate-50 disabled:text-slate-400";

/**
 * Add / edit form for one team member. The invite code fills itself in from
 * the name (first name + last initial) until the owner types their own.
 */
export function TeamMemberForm({
  initial,
  managers,
  origin,
  cancelHref,
}: {
  initial: TeamMemberFormValues;
  managers: ManagerOption[];
  /** e.g. https://ecrn.com, used to preview the sign-up link. */
  origin: string;
  cancelHref: string;
}) {
  const isEdit = Boolean(initial.id);
  const [state, setState] = useState<StaffFormState>({});
  const [pending, startTransition] = useTransition();

  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [role, setRole] = useState<TeamRole>(initial.staffRole);
  const [code, setCode] = useState(initial.inviteCode);
  // Once a code exists (editing) or the owner types one, stop suggesting.
  const [codeEdited, setCodeEdited] = useState(Boolean(initial.inviteCode));

  const onName = (first: string, last: string) => {
    setFirstName(first);
    setLastName(last);
    if (!codeEdited) setCode(suggestInviteCode(first, last));
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        // Redirects to the person's page on success; only comes back with errors.
        const result = await saveStaffAction(formData);
        if (result) setState(result);
      } catch (e) {
        unstable_rethrow(e); // let the redirect through
        setState({ error: "Couldn't reach the server. Check your connection and try again." });
      }
    });
  };

  const err = (name: StaffField) => state.fieldErrors?.[name];
  const codeChanged = isEdit && cleanInviteCode(code) !== initial.inviteCode.toUpperCase();
  const previewCode = cleanInviteCode(code);

  return (
    <form onSubmit={onSubmit} className="space-y-7 pt-1.5">
      {initial.id && <input type="hidden" name="staffId" value={initial.id} />}

      {state.error && (
        <div role="alert" className="p-3 rounded-xl text-sm border leading-relaxed bg-red-50 border-red-200/70 text-red-800">
          {state.error}
        </div>
      )}

      <Section title="Who they are">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="First name *" htmlFor="firstName" error={err("firstName")}>
            <Input
              id="firstName"
              name="firstName"
              value={firstName}
              onChange={(e) => onName(e.target.value, lastName)}
              required
              maxLength={80}
              autoComplete="off"
              className={inputClass}
              aria-invalid={Boolean(err("firstName"))}
            />
          </Field>
          <Field label="Last name" htmlFor="lastName" error={err("lastName")}>
            <Input
              id="lastName"
              name="lastName"
              value={lastName}
              onChange={(e) => onName(firstName, e.target.value)}
              maxLength={80}
              autoComplete="off"
              className={inputClass}
            />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Title" htmlFor="title" error={err("title")}>
            <Input id="title" name="title" defaultValue={initial.title} maxLength={120} placeholder="Senior Recruiter" autoComplete="off" className={inputClass} />
          </Field>
          <Field label="Email" htmlFor="email" error={err("email")} hint="Also used to match this person when Bullhorn is connected.">
            <Input id="email" name="email" type="email" defaultValue={initial.email} maxLength={254} autoComplete="off" className={inputClass} aria-invalid={Boolean(err("email"))} />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Phone" htmlFor="phone" error={err("phone")}>
            <Input id="phone" name="phone" type="tel" defaultValue={initial.phone} maxLength={40} autoComplete="off" className={inputClass} />
          </Field>
        </div>
      </Section>

      <Section title="Role">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Role *" htmlFor="staffRole" error={err("staffRole")}>
            <select id="staffRole" name="staffRole" value={role} onChange={(e) => setRole(e.target.value as TeamRole)} className={selectClass}>
              {TEAM_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Account manager"
            htmlFor="managerId"
            error={err("managerId")}
            hint={role === "recruiter" ? "Who this recruiter works under. Their sign-ups go to this account manager." : "Only recruiters report to an account manager."}
          >
            <select id="managerId" name="managerId" defaultValue={initial.managerId} disabled={role !== "recruiter"} className={selectClass}>
              <option value="">No account manager</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.note})
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Sign-up link">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field
            label="Invite code *"
            htmlFor="inviteCode"
            error={err("inviteCode")}
            hint="3 to 24 letters or numbers. People can type it when they sign up."
          >
            <Input
              id="inviteCode"
              name="inviteCode"
              value={code}
              onChange={(e) => {
                setCodeEdited(true);
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 24));
              }}
              required
              minLength={3}
              maxLength={24}
              pattern="[A-Za-z0-9]{3,24}"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              className={cn(inputClass, "font-mono tracking-wider uppercase")}
              aria-invalid={Boolean(err("inviteCode"))}
            />
          </Field>
          <div className="sm:pt-[26px]">
            <div className="rounded-[14px] bg-ecrn-paper border border-ecrn-line px-3.5 py-2.5 min-h-11">
              <p className="text-[11.5px] text-ecrn-secondary">Their link</p>
              <p className="font-mono text-[13px] text-ecrn-ink break-all">
                {origin}/r/{previewCode || "CODE"}
              </p>
            </div>
            {!isEdit && !codeEdited && previewCode && (
              <p className="mt-1.5 text-[12px] text-ecrn-secondary">Suggested from the name. Change it if you like.</p>
            )}
          </div>
        </div>
        {codeChanged && (
          <p className="rounded-[12px] bg-amber-50 text-amber-900 px-3.5 py-2.5 text-[13px]">
            Changing the code breaks the old link and any printed QR codes for {initial.inviteCode}. People who already signed up stay credited.
          </p>
        )}
      </Section>

      <Section title="Routing">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Specialties" htmlFor="specialties" error={err("specialties")} hint="Separate with commas, like Electrical, Low voltage, Data centers.">
            <Input id="specialties" name="specialties" defaultValue={initial.specialties} autoComplete="off" className={inputClass} />
          </Field>
          <Field
            label="Territories"
            htmlFor="territories"
            error={err("territories")}
            hint="Two-letter state codes, like FL, GA, TX. New people in these states go to this account manager automatically."
          >
            <Input id="territories" name="territories" defaultValue={initial.territories} autoComplete="off" autoCapitalize="characters" className={cn(inputClass, "uppercase placeholder:normal-case")} />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Bullhorn user ID" htmlFor="externalCrmId" error={err("externalCrmId")} hint="Optional. Links this person to their Bullhorn account for the sync.">
            <Input id="externalCrmId" name="externalCrmId" defaultValue={initial.externalCrmId} maxLength={64} autoComplete="off" className={inputClass} />
          </Field>
          <div className="sm:pt-[26px]">
            <label className="flex items-start gap-3 rounded-[14px] border border-ecrn-line bg-white px-3.5 py-2.5 cursor-pointer">
              <input type="checkbox" name="isActive" defaultChecked={initial.isActive} className="mt-0.5 h-[18px] w-[18px] accent-[#16C172]" />
              <span>
                <span className="block text-[14px] font-medium text-ecrn-ink">Active</span>
                <span className="block text-[12.5px] text-ecrn-secondary">Their link and code credit new sign-ups, and they can be given people.</span>
              </span>
            </label>
          </div>
        </div>
      </Section>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button type="submit" size="sm" loading={pending} className="h-10 px-5">
          {isEdit ? "Save changes" : "Add team member"}
        </Button>
        <Link
          href={cancelHref}
          className="inline-flex items-center h-10 px-4 rounded-[12px] text-sm font-medium text-ecrn-secondary hover:text-ecrn-ink hover:bg-ecrn-paper"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="t-eyebrow">{title}</legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p className="mt-1.5 text-[12.5px] text-red-700" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[12px] text-ecrn-secondary">{hint}</p>
      ) : null}
    </div>
  );
}
