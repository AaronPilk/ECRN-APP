import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { saveJobAction } from "@/app/(app)/admin/actions";
import type { Job } from "@/types";

interface JobFormProps {
  job?: Job;
}

export function JobForm({ job }: JobFormProps) {
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
                  defaultValue={job?.companyName ?? ""}
                  placeholder="Confidential or actual name"
                />
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
                <select
                  id="trade"
                  name="trade"
                  defaultValue={job?.trade ?? ""}
                  className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200 text-[15px] text-ecrn-ink focus:outline-none focus:border-ecrn-green focus:ring-2 focus:ring-ecrn-green/20"
                >
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
                <select
                  id="urgency"
                  name="urgency"
                  defaultValue={job?.urgency ?? "normal"}
                  className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200 text-[15px] text-ecrn-ink focus:outline-none focus:border-ecrn-green focus:ring-2 focus:ring-ecrn-green/20"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </Field>
            </div>
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
              <Field label="Payout amount (cents)" htmlFor="referralPayoutAmount">
                <Input
                  id="referralPayoutAmount"
                  name="referralPayoutAmount"
                  type="number"
                  min="0"
                  step="100"
                  defaultValue={job?.referralPayoutAmount ?? ""}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Stored in cents — $5,000 = 500000.
                </p>
              </Field>
              <Field label="Payout display" htmlFor="referralPayoutDisplay">
                <Input
                  id="referralPayoutDisplay"
                  name="referralPayoutDisplay"
                  defaultValue={job?.referralPayoutDisplay ?? ""}
                  placeholder="$5,000"
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
                defaultValue={job?.internalNotes ?? ""}
                placeholder="Notes never shown to candidates or partners."
              />
            </Field>
          </Section>

          <Section title="Visibility">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Status" htmlFor="status">
                <select
                  id="status"
                  name="status"
                  defaultValue={job?.status ?? "draft"}
                  className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200 text-[15px] text-ecrn-ink focus:outline-none focus:border-ecrn-green focus:ring-2 focus:ring-ecrn-green/20"
                >
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
                    Public — partners and candidates can see this job
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
