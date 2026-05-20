import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Logo } from "@/components/ui/Logo";
import { createCompanyLead, logActivity } from "@/lib/data/repository";

async function submitHiringNeed(formData: FormData) {
  "use server";
  const lead = await createCompanyLead({
    companyName: String(formData.get("companyName") ?? ""),
    contactName: String(formData.get("contactName") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: (formData.get("phone") as string) || null,
    location: (formData.get("location") as string) || null,
    roleNeeded: (formData.get("roleNeeded") as string) || null,
    numberOfCandidates: formData.get("numberOfCandidates")
      ? Number(formData.get("numberOfCandidates"))
      : null,
    startDate: null,
    compensationRange: (formData.get("compensationRange") as string) || null,
    jobDescription: (formData.get("jobDescription") as string) || null,
    urgency: "normal",
    notes: (formData.get("notes") as string) || null,
    assignedToUserId: null,
    externalCrmId: null,
  });
  await logActivity({
    actorUserId: null,
    entityType: "company_lead",
    entityId: lead.id,
    action: "created",
    metadata: { source: "public_form" },
  });
  redirect("/hire/thanks");
}

interface PageProps {
  searchParams?: { welcome?: string };
}

export default function HirePage({ searchParams }: PageProps) {
  return (
    <div className="min-h-screen bg-ecrn-mist">
      <header className="px-5 sm:px-8 py-5 flex items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
        <Link
          href="/"
          className="text-sm text-slate-500 hover:text-ecrn-ink"
        >
          ← Back to home
        </Link>
      </header>

      <main className="max-w-2xl mx-auto px-5 sm:px-8 py-8">
        {searchParams?.welcome && (
          <p className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-xl p-3">
            Welcome! Your account is created. Submit your first hiring need below.
          </p>
        )}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ecrn-ink">
          Get the right people, faster.
        </h1>
        <p className="mt-2 text-slate-600">
          Tell us what you&apos;re hiring for. Delta&apos;s recruiting team — 18+ years across the
          country&apos;s top electrical and construction firms — will reach out.
        </p>

        <Card className="mt-7 p-6">
          <form action={submitHiringNeed} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="companyName">Company name *</Label>
                <Input id="companyName" name="companyName" required />
              </div>
              <div>
                <Label htmlFor="contactName">Contact name *</Label>
                <Input id="contactName" name="contactName" required />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" type="tel" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" placeholder="City, State" />
              </div>
              <div>
                <Label htmlFor="roleNeeded">Role needed</Label>
                <Input id="roleNeeded" name="roleNeeded" placeholder="e.g. Electrical PM" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="numberOfCandidates">How many candidates?</Label>
                <Input
                  id="numberOfCandidates"
                  name="numberOfCandidates"
                  type="number"
                  min="1"
                  defaultValue="1"
                />
              </div>
              <div>
                <Label htmlFor="compensationRange">Compensation range</Label>
                <Input id="compensationRange" name="compensationRange" placeholder="$120–150K" />
              </div>
            </div>

            <div>
              <Label htmlFor="jobDescription">Job description</Label>
              <Textarea id="jobDescription" name="jobDescription" rows={5} />
            </div>

            <div>
              <Label htmlFor="notes">Anything else?</Label>
              <Textarea id="notes" name="notes" rows={3} />
            </div>

            <Button type="submit" variant="dark" fullWidth size="lg">
              Submit hiring need
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
}
