import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { saveJobAction } from "@/app/(app)/admin/actions";
import type { Job, Staff } from "@/types";

interface JobFormProps {
  job?: Job;
  /** Who can own a job: active account managers and owners (from `splitStaff`). */
  accountManagers?: Staff[];
  /** Active recruiters (from `splitStaff`). */
  recruiters?: Staff[];
  /** Current owner and recruiters when editing. */
  ownership?: { accountManagerId: string | null; recruiterIds: string[] };
  /** The real client name and notes from the admin-only `job_private` table. */
  privateInfo?: { clientCompany: string | null; internalNotes: string | null };
}

const selectClass =
  "w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200 text-[15px] text-ecrn-ink focus:outline-none focus:border-ecrn-green focus:ring-2 focus:ring-ecrn-green/20";

const fullName = (s: Staff) => `${s.firstName} ${s.lastName}`.trim();

/** Recruiters grouped under their account manager; the job owner's team comes first. */
function groupRecruiters(recruiters: Staff[], accountManagers: Staff[], ownerId: string | null) {
  const managers = new Map(accountManagers.map((m) => [m.id, m]));
  const groups = new Map<string, { key: string; label: string; members: Staff[] }>();
  for (const r of recruiters) {
    const manager = r.managerId ? managers.get(r.managerId) : undefined;
    // "other": their manager is not in the picker (for example, no longer active).
    const key = manager?.id ?? (r.managerId ? "other" : "none");
    if (!groups.has(key)) {
      const label = manager ? `${fullName(manager)}'s team` : key === "other" ? "Other recruiters" : "No account manager";
      groups.set(key, { key, label, members: [] });
    }
    groups.get(key)!.members.push(r);
  }
  const rank = (key: string) => (key === ownerId ? 0 : key === "other" ? 2 : key === "none" ? 3 : 1);
  return [...groups.values()].sort((a, b) => rank(a.key) - rank(b.key) || a.label.localeCompare(b.label));
}

export function JobForm({ job, accountManagers = [], recruiters = [], ownership, privateInfo }: JobFormProps) {
  const ownerId = ownership?.accountManagerId ?? job?.accountManagerId ?? null;
  const selectedRecruiters = new Set(ownership?.recruiterIds ?? []);
  const recruiterGroups = groupRecruiters(recruiters, accountManagers, ownerId);

  return (
    <Card>
      <CardContent className="py-6">
        <form action={saveJobAction} className="space-y-5">
          {job && <input type="hidden" name="jobId" value={job.id} />}

          <Section title="Role">
            <Field label="Job title *" htmlFor="title">
              <Input id="title" name="title" defaultValue={job?.title ?? ""} required />
            </Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Company name" htmlFor="companyName">
                <Input
                  id="companyName"
                  name="companyName"
                  defaultValue={privateInfo?.clientCompany ?? job?.companyName ?? ""}
                  placeholder="The real client name"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Only admins see this unless “Reveal company name” is on.
                </p>
              </Field>
              <Field label="Job type" htmlFor="jobType">
                <Input
                  id="jobType"
                  name="jobType"
                  defaultValue={job?.jobType ?? ""}
                  placeholder="Full-time / Contract"
                />
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Trade" htmlFor="trade">
                <select id="trade" name="trade" defaultValue={job?.trade ?? ""} className={selectClass}>
                  <option value="">Select trade…</option>
                  <option value="electrical">Electrical</option>
                  <option value="mechanical">Mechanical</option>
                  <option value="general_construction">General construction</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="low_voltage">Low voltage</option>
                  <option value="other">Other</option>
                </select>
              </Field>
              <Field label="Urgency" htmlFor="urgency">
                <select id="urgency" name="urgency" defaultValue={job?.urgency ?? "normal"} className={selectClass}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Ownership">
            <p className="text-[13px] leading-relaxed text-slate-500">
              Applications and referrals for this job go to the account manager, who hands them to a recruiter.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Account manager (owns this job)" htmlFor="accountManagerId">
                <select
                  id="accountManagerId"
                  name="accountManagerId"
                  defaultValue={ownerId ?? ""}
                  className={selectClass}
                >
                  <option value="">Not set</option>
                  {accountManagers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {fullName(s)}
                      {s.staffRole === "owner" ? " (owner)" : ""}
                      {s.isActive ? "" : " (inactive)"}
                    </option>
                  ))}
                </select>
                {accountManagers.length === 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    No account managers yet.{" "}
                    <Link href="/admin/team" className="underline hover:text-ecrn-ink">
                      Add your team
                    </Link>{" "}
                    to give this job an owner.
                  </p>
                )}
              </Field>
              <Field label="Bullhorn job ID" htmlFor="externalCrmId">
                <Input
                  id="externalCrmId"
                  name="externalCrmId"
                  defaultValue={job?.externalCrmId ?? ""}
                  placeholder="Optional"
                  autoComplete="off"
                  maxLength={64}
                />
                <p className="text-xs text-slate-500 mt-1">
                  The job order&apos;s ID in Bullhorn. Used to match this job once Bullhorn is connected.
                </p>
              </Field>
            </div>

            <fieldset>
              <legend className="block text-sm font-medium text-ecrn-ink mb-1.5">Recruiters working this job</legend>
              {recruiterGroups.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 px-3.5 py-3 text-[13px] text-slate-500">
                  No recruiters yet. Add them on the{" "}
                  <Link href="/admin/team" className="underline hover:text-ecrn-ink">
                    Team page
                  </Link>
                  .
                </p>
              ) : (
                <div className="max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
                  {recruiterGroups.map((group) => (
                    <div key={group.key} className="px-3.5 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-2">
                        {group.label}
                      </p>
                      <div className="grid sm:grid-cols-2 gap-x-4 gap-y-2">
                        {group.members.map((r) => (
                          <label key={r.id} className="flex items-start gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              name="recruiterIds"
                              value={r.id}
                              defaultChecked={selectedRecruiters.has(r.id)}
                              className="mt-0.5 w-4 h-4 rounded accent-ecrn-green shrink-0"
                            />
                            <span className="text-sm text-ecrn-ink min-w-0">
                              {fullName(r)}
                              {!r.isActive && <span className="text-slate-500"> (inactive)</span>}
                              {r.title && <span className="block text-xs text-slate-500 truncate">{r.title}</span>}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </fieldset>
          </Section>

          <Section title="Location">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="City" htmlFor="locationCity">
                <Input
                  id="locationCity"
                  name="locationCity"
                  defaultValue={job?.locationCity ?? ""}
                />
              </Field>
              <Field label="State" htmlFor="locationState">
                <Input
                  id="locationState"
                  name="locationState"
                  defaultValue={job?.locationState ?? ""}
                />
              </Field>
            </div>
          </Section>

          <Section title="Compensation">
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Comp min ($)" htmlFor="compensationMin">
                <Input
                  id="compensationMin"
                  name="compensationMin"
                  type="number"
                  min="0"
                  defaultValue={job?.compensationMin ?? ""}
                />
              </Field>
              <Field label="Comp max ($)" htmlFor="compensationMax">
                <Input
                  id="compensationMax"
                  name="compensationMax"
                  type="number"
                  min="0"
                  defaultValue={job?.compensationMax ?? ""}
                />
              </Field>
              <Field label="Display (string)" htmlFor="compensationDisplay">
                <Input
                  id="compensationDisplay"
                  name="compensationDisplay"
                  defaultValue={job?.compensationDisplay ?? ""}
                  placeholder="$120–150K + bonus"
                />
              </Field>
            </div>
          </Section>

          <Section title="Referral payout">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Payout amount ($)" htmlFor="referralPayoutAmount">
                <Input
                  id="referralPayoutAmount"
                  name="referralPayoutAmount"
                  type="number"
                  min="0"
                  max="10000"
                  step="50"
                  placeholder="5000"
                  defaultValue={job?.referralPayoutAmount != null ? job.referralPayoutAmount / 100 : ""}
                />
                <p className="text-xs text-slate-500 mt-1">Typically $1,000–$10,000 per placement.</p>
              </Field>
              <Field label="Payout label (optional)" htmlFor="referralPayoutDisplay">
                <Input
                  id="referralPayoutDisplay"
                  name="referralPayoutDisplay"
                  defaultValue={job?.referralPayoutDisplay ?? ""}
                  placeholder="Auto-filled from the amount"
                />
              </Field>
            </div>
          </Section>

          <Section title="About the role">
            <Field label="Description" htmlFor="description">
              <Textarea
                id="description"
                name="description"
                rows={5}
                defaultValue={job?.description ?? ""}
              />
            </Field>
            <Field label="Requirements" htmlFor="requirements">
              <Textarea
                id="requirements"
                name="requirements"
                rows={4}
                defaultValue={job?.requirements ?? ""}
              />
            </Field>
            <Field label="Internal notes (admin-only)" htmlFor="internalNotes">
              <Textarea
                id="internalNotes"
                name="internalNotes"
                rows={3}
                defaultValue={privateInfo?.internalNotes ?? job?.internalNotes ?? ""}
                placeholder="Notes never shown to candidates or partners."
              />
            </Field>
          </Section>

          <Section title="Visibility">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Status" htmlFor="status">
                <select id="status" name="status" defaultValue={job?.status ?? "draft"} className={selectClass}>
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="paused">Paused</option>
                  <option value="filled">Filled</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>
              <div className="space-y-2 pt-7">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isPublic"
                    defaultChecked={job?.isPublic ?? false}
                    className="w-4 h-4 rounded accent-ecrn-green"
                  />
                  <span className="text-sm text-ecrn-ink">
                    Public: partners and candidates can see this job
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isCompanyPublic"
                    defaultChecked={job?.isCompanyPublic ?? false}
                    className="w-4 h-4 rounded accent-ecrn-green"
                  />
                  <span className="text-sm text-ecrn-ink">
                    Reveal company name to public
                  </span>
                </label>
              </div>
            </div>
          </Section>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Button type="submit" variant="dark" size="lg" fullWidth>
              {job ? "Save changes" : "Create job"}
            </Button>
            <Link href="/admin/jobs" className="sm:w-auto">
              <Button type="button" variant="ghost" size="lg" fullWidth>
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 mb-3">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
