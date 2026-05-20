import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { getJobById } from "@/lib/data/repository";
import { submitReferralAction } from "../actions";

interface PageProps {
  searchParams?: { jobId?: string };
}

const TRADE_OPTIONS = [
  "electrical",
  "mechanical",
  "general_construction",
  "plumbing",
  "low_voltage",
  "other",
];

export default async function NewReferralPage({ searchParams }: PageProps) {
  const jobId = searchParams?.jobId;
  const job = jobId ? await getJobById(jobId) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      <div>
        <Link href="/referrals" className="text-sm text-slate-500 hover:text-ecrn-ink">
          ← My referrals
        </Link>
        <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-ecrn-ink">
          Add a referral
        </h1>
        <p className="mt-1 text-slate-500">
          Upload someone you know in the construction industry. The more detail you give us, the
          faster Delta can act on it.
        </p>
      </div>

      {job && (
        <Card className="p-4 bg-ecrn-green/5 border-ecrn-green/30">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-ecrn-green/15 text-ecrn-green grid place-items-center font-bold">
              ★
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.16em] text-emerald-700 font-semibold">
                Referring to a role
              </div>
              <div className="mt-1 text-[15px] font-semibold text-ecrn-ink">{job.title}</div>
              <div className="text-sm text-slate-600">
                {job.companyName ?? "Confidential client"}
                {job.referralPayoutDisplay && (
                  <>
                    {" · "}
                    <span className="text-emerald-700 font-medium">
                      Payout: {job.referralPayoutDisplay}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <CardContent className="py-6">
          <form action={submitReferralAction} className="space-y-5">
            {jobId && <input type="hidden" name="jobId" value={jobId} />}

            <Section title="Who is this person?">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName">First name *</Label>
                  <Input id="firstName" name="firstName" required autoFocus />
                </div>
                <div>
                  <Label htmlFor="lastName">Last name *</Label>
                  <Input id="lastName" name="lastName" required />
                </div>
              </div>
            </Section>

            <Section title="How can Delta reach them?">
              <p className="text-xs text-slate-500 mb-2">
                Email or phone (at least one). LinkedIn helps us avoid duplicates.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" inputMode="email" />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" name="phone" type="tel" inputMode="tel" />
                </div>
              </div>
              <div className="mt-3">
                <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
                <Input
                  id="linkedinUrl"
                  name="linkedinUrl"
                  type="url"
                  placeholder="https://www.linkedin.com/in/..."
                />
              </div>
            </Section>

            <Section title="What do they do?">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="currentJobTitle">Current title</Label>
                  <Input id="currentJobTitle" name="currentJobTitle" placeholder="e.g. Electrical PM" />
                </div>
                <div>
                  <Label htmlFor="yearsExperience">Years of experience</Label>
                  <Input
                    id="yearsExperience"
                    name="yearsExperience"
                    type="number"
                    min="0"
                    max="60"
                  />
                </div>
              </div>
              <div className="mt-3">
                <Label htmlFor="trade">Trade</Label>
                <select
                  id="trade"
                  name="trade"
                  className="w-full h-11 px-3.5 rounded-xl bg-white border border-slate-200 text-[15px] text-ecrn-ink focus:outline-none focus:border-ecrn-green focus:ring-2 focus:ring-ecrn-green/20"
                  defaultValue=""
                >
                  <option value="">Select a trade…</option>
                  {TRADE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            </Section>

            <Section title="Where are they?">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="locationCity">City</Label>
                  <Input id="locationCity" name="locationCity" placeholder="Tampa" />
                </div>
                <div>
                  <Label htmlFor="locationState">State</Label>
                  <Input id="locationState" name="locationState" placeholder="FL" />
                </div>
              </div>
            </Section>

            <Section title="Anything else Delta should know?">
              <Textarea
                id="notes"
                name="notes"
                rows={4}
                placeholder="How do you know them? What are they looking for?"
              />
            </Section>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Button type="submit" variant="dark" size="lg" fullWidth>
                Submit referral
              </Button>
              <Link href="/referrals" className="sm:w-auto">
                <Button type="button" variant="ghost" size="lg" fullWidth>
                  Cancel
                </Button>
              </Link>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              If someone has already referred this person, your submission will be marked as a
              duplicate attempt — the original referrer keeps ownership. Our team reviews
              duplicate claims manually.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 mb-3">
        {title}
      </h2>
      {children}
    </div>
  );
}
