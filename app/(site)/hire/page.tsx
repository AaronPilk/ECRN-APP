import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { JsonLd } from "@/components/site/SiteChrome";
import { breadcrumbJsonLd, pageMeta } from "@/lib/site";
import { FormMessage } from "@/components/ui/FormMessage";
import { createCompanyLead } from "@/lib/data/repository";

async function submitHiringNeed(formData: FormData) {
  "use server";
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  if (!get("companyName") || !get("contactName") || !/^\S+@\S+\.\S+$/.test(get("email"))) {
    redirect(`/hire?error=${encodeURIComponent("Company, contact name, and a valid email are required.")}`);
  }
  try {
    await createCompanyLead({
      companyName: get("companyName"),
      contactName: get("contactName"),
      email: get("email"),
      phone: get("phone") || null,
      location: get("location") || null,
      roleNeeded: get("roleNeeded") || null,
      numberOfCandidates: get("numberOfCandidates") ? Number(get("numberOfCandidates")) : null,
      compensationRange: get("compensationRange") || null,
      jobDescription: get("jobDescription") || null,
      notes: get("notes") || null,
    });
  } catch {
    redirect(`/hire?error=${encodeURIComponent("Something went wrong saving that. Please try again.")}`);
  }
  redirect("/hire/thanks");
}

export const metadata = pageMeta({
  title: "Hire Electrical Construction Talent | ECRN for Employers",
  description:
    "Hire vetted electrical construction professionals sourced from industry referrals. Tell Delta Construction Partners what you need; a recruiter will reach out.",
  path: "/hire",
});

interface PageProps {
  searchParams: Promise<{ welcome?: string; error?: string }>;
}

export default async function HirePage(props: PageProps) {
  const searchParams = await props.searchParams;
  return (
    <div>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "For employers", path: "/hire" }])} />
      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
        <FormMessage error={searchParams.error} className="mb-4" />
        {searchParams?.welcome && (
          <p className="mb-4 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-xl p-3">
            Welcome! Your account is created. Submit your first hiring need below.
          </p>
        )}
        <p className="font-mono text-[12px] uppercase tracking-[0.16em] text-ecrn-green-text">For employers</p>
        <h1 className="mt-3 font-display text-[38px] sm:text-[48px] leading-[1.05] font-semibold tracking-[-0.035em] text-ecrn-ink">
          Hire electrical construction talent through ECRN
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-ecrn-secondary">
          Tell us what you&apos;re hiring for and Delta Construction Partners&apos; recruiters will reach out. ECRN candidates come from
          industry referrals, the source the best hires come from, and every one is vetted by Delta before you see them.
        </p>
        <ul className="mt-5 grid sm:grid-cols-3 gap-3 text-[14px]">
          {["30+ recruiters", "National contractor network", "Building relationships since 2008"].map((x) => (
            <li key={x} className="rounded-[14px] border border-ecrn-line bg-white px-4 py-3 font-medium text-ecrn-ink">{x}</li>
          ))}
        </ul>

        <Card className="mt-8 p-6">
          <h2 className="font-display text-[22px] font-semibold text-ecrn-ink mb-4">Tell us what you need</h2>
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

            <Button type="submit" fullWidth size="lg">
              Submit hiring need
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
