import "@/components/site/inner/inner.css";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Container, CtaLink, DELTA, DeltaLogo, DeltaMark, PageHero } from "@/components/site/Blocks";
import { JsonLd } from "@/components/site/SiteChrome";
import { Reveal } from "@/components/site/motion";
import { Field, SubmitButton } from "@/components/site/inner/Form";
import { Band, Crumbs, Heading, PhotoFrame, StepList } from "@/components/site/inner/Kit";
import { TIERS, breadcrumbJsonLd, pageMeta } from "@/lib/site";
import { createCompanyLead } from "@/lib/data/repository";

async function submitHiringNeed(formData: FormData) {
  "use server";
  const get = (k: string) => String(formData.get(k) ?? "").trim();
  if (!get("companyName") || !get("contactName") || !/^\S+@\S+\.\S+$/.test(get("email"))) {
    redirect(`/hire?error=${encodeURIComponent("Company, contact name, and a valid email are required.")}`);
  }
  const count = get("numberOfCandidates") ? Number(get("numberOfCandidates")) : null;
  if (count !== null && (!Number.isInteger(count) || count < 1 || count > 2147483647)) {
    redirect(`/hire?error=${encodeURIComponent("Enter a whole number of candidates, at least 1.")}`);
  }
  try {
    await createCompanyLead({
      companyName: get("companyName"),
      contactName: get("contactName"),
      email: get("email"),
      phone: get("phone") || null,
      location: get("location") || null,
      roleNeeded: get("roleNeeded") || null,
      numberOfCandidates: count,
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

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "For employers", path: "/hire" },
];

/** What Delta brings to a contractor. Facts from the site contract only. */
const FOR_CONTRACTORS = [
  {
    title: "Candidates from referrals",
    body: "Electrical construction professionals refer people they know in the trade. Delta's recruiters take it from there.",
  },
  {
    title: "Vetted before you meet them",
    body: "Delta's recruiters vet every candidate and handle the interviews and follow-up.",
  },
  {
    title: "People who aren't on job boards",
    body: "Employed professionals can tell Delta privately that they're open to the right move. Only Delta's recruiters see it.",
  },
];

const ROLES = TIERS.flatMap((t) => t.roles);

const AFTER_STEPS = [
  { title: "Delta's recruiting team gets it", body: "Your request goes straight to Delta Construction Partners' recruiters." },
  { title: "A recruiter reaches out", body: "A Delta recruiter contacts you to talk through the role." },
  { title: "You meet vetted candidates", body: "You interview people Delta's recruiters have already vetted, sourced through industry referrals." },
];

export default async function HirePage(props: PageProps) {
  const searchParams = await props.searchParams;
  const error = searchParams.error;
  const welcome = Boolean(searchParams?.welcome);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <PageHero
        eyebrow="For employers"
        title="Hire electrical construction talent through ECRN"
        image="data-center-hall"
        intro={
          <p>
            Tell us what you&apos;re hiring for and a Delta Construction Partners recruiter will reach out. ECRN candidates come from
            industry referrals, and Delta vets every one before you meet them.
          </p>
        }
      >
        <CtaLink href="#hiring-form" className="w-full sm:w-auto">
          Tell us what you need <ArrowRight aria-hidden className="h-4 w-4" />
        </CtaLink>
      </PageHero>

      {error || welcome ? (
        <div className="site-tone-light bg-ecrn-paper">
          <Container className="pt-5">
            {error ? (
              <div
                role="alert"
                className="rounded-[18px] bg-[#FEF3F2] p-4 text-[15px] leading-[1.55] text-[#7A271A] shadow-[inset_0_0_0_1px_#FECDCA] [--site-accent:#7A271A] sm:p-5"
              >
                <p className="font-display font-semibold">Your request wasn&apos;t sent</p>
                <p className="mt-0.5">{error}</p>
                <a href="#hiring-form" className="inner-tlink">
                  Go to the form
                </a>
              </div>
            ) : (
              <div
                role="status"
                className="rounded-[18px] bg-ecrn-action-surface p-4 text-[15px] leading-[1.55] text-ecrn-action-ink shadow-[inset_0_0_0_1px_#A7E9C4] [--site-accent:#07653E] sm:p-5"
              >
                <p className="font-display font-semibold">Your account is created</p>
                <p className="mt-0.5">Tell us about your first hiring need below.</p>
                <a href="#hiring-form" className="inner-tlink">
                  Go to the form
                </a>
              </div>
            )}
          </Container>
        </div>
      ) : null}

      <Crumbs items={CRUMBS} />

      {/* Who Delta is and what it does for a contractor (phones: heading, photo, facts). */}
      <Band first id="delta" labelledBy="delta-title">
        <div className="grid gap-8 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-10">
          <Reveal className="lg:col-start-1 lg:row-start-1">
            <DeltaLogo tone="light" size={30} />
            <Heading
              id="delta-title"
              className="mt-6"
              title="Delta Construction Partners does the recruiting"
              intro="ECRN is powered by Delta Construction Partners, a construction recruiting firm with 30+ recruiters. It has been recruiting since 2008 and has relationships with contractors nationally."
            />
          </Reveal>

          <Reveal className="lg:sticky lg:top-[calc(var(--site-header-total)+2rem)] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
            <PhotoFrame
              image="office-overlook-night"
              ratio="4 / 3"
              sizes="(min-width: 1024px) 560px, calc(100vw - 40px)"
              caption={
                <>
                  <DeltaMark className="h-5" />
                  <span className="text-[13.5px] leading-tight">
                    <span className="block font-display font-semibold text-white">{DELTA.name}</span>
                    <span className="mt-0.5 block text-white/80">Construction recruiting since {DELTA.since}</span>
                  </span>
                </>
              }
            />
            <dl className="mt-3 grid grid-cols-2 gap-3">
              {[
                [DELTA.since, "Recruiting since"],
                [DELTA.recruiters, "Recruiters"],
              ].map(([value, label]) => (
                <div key={label} className="site-card flex flex-col-reverse rounded-[18px] px-4 py-4 sm:px-5">
                  <dt className="mt-1 text-[14px] leading-snug text-ecrn-secondary">{label}</dt>
                  <dd className="font-display text-[28px] font-semibold leading-none tracking-[-0.035em] tabular-nums text-cobalt sm:text-[32px]">{value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal className="lg:col-start-1 lg:row-start-2">
            <ul className="border-t border-ecrn-line">
              {FOR_CONTRACTORS.map((f) => (
                <li key={f.title} className="border-b border-ecrn-line py-4">
                  <h3 className="inner-h3">{f.title}</h3>
                  <p className="inner-body mt-1">{f.body}</p>
                </li>
              ))}
              <li className="border-b border-ecrn-line py-4">
                <h3 className="inner-h3">From the field to the front office</h3>
                <p className="inner-body mt-1">ECRN covers field, field leadership, office and executive roles:</p>
                <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Roles Delta recruits for through ECRN">
                  {ROLES.map((r) => (
                    <li key={r} className="inline-flex min-h-8 items-center rounded-full bg-delta-surface px-3 py-1 font-display text-[13px] font-medium text-navy">
                      {r}
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
            <a
              href={DELTA.url}
              target="_blank"
              rel="noopener"
              className="mt-3 inline-flex min-h-11 items-center gap-1.5 font-display text-[15px] font-semibold text-cobalt underline decoration-cobalt/30 underline-offset-4"
            >
              {DELTA.domain}
              <ArrowUpRight aria-hidden className="h-4 w-4" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </Reveal>
        </div>
      </Band>

      {/* What happens after they press send. */}
      <Band tone="white" labelledBy="after-title" className="border-y border-ecrn-line">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <Reveal>
            <Heading id="after-title" title="What happens after you submit" intro="Every request is read by Delta's recruiting team." />
          </Reveal>
          <Reveal index={1}>
            <StepList steps={AFTER_STEPS} />
          </Reveal>
        </div>
      </Band>

      {/* The request. Field names and validation are the server action's (above). */}
      <Band id="hiring-form" labelledBy="form-title">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div className="lg:sticky lg:top-[calc(var(--site-header-total)+2.5rem)] lg:self-start">
            <Heading
              id="form-title"
              title="Tell us what you need"
              intro="Only your company, your name and an email are required. Add what you can about the role."
            />
          </div>

          <form action={submitHiringNeed} className="site-card rounded-[24px] p-5 sm:p-8">
            <fieldset className="inner-fieldset">
              <legend className="inner-legend">About you</legend>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="companyName" label="Company name" required>
                  <input id="companyName" name="companyName" required autoComplete="organization" autoCapitalize="words" enterKeyHint="next" className="inner-input" />
                </Field>
                <Field id="contactName" label="Your name" required>
                  <input id="contactName" name="contactName" required autoComplete="name" autoCapitalize="words" enterKeyHint="next" className="inner-input" />
                </Field>
                <Field id="email" label="Work email" required>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="next"
                    className="inner-input"
                  />
                </Field>
                <Field id="phone" label="Phone">
                  <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" enterKeyHint="next" className="inner-input" />
                </Field>
              </div>
            </fieldset>

            <fieldset className="inner-fieldset mt-8 border-t border-ecrn-line pt-7">
              <legend className="inner-legend">The role</legend>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="roleNeeded" label="Role you're hiring for">
                  <input
                    id="roleNeeded"
                    name="roleNeeded"
                    placeholder="e.g. Electrical project manager"
                    autoComplete="off"
                    autoCapitalize="sentences"
                    enterKeyHint="next"
                    className="inner-input"
                  />
                </Field>
                <Field id="location" label="Job location">
                  <input id="location" name="location" placeholder="City, state" autoComplete="off" autoCapitalize="words" enterKeyHint="next" className="inner-input" />
                </Field>
                <Field id="numberOfCandidates" label="How many people">
                  <input
                    id="numberOfCandidates"
                    name="numberOfCandidates"
                    type="number"
                    min="1"
                    step="1"
                    defaultValue="1"
                    inputMode="numeric"
                    enterKeyHint="next"
                    className="inner-input tabular-nums"
                  />
                </Field>
                <Field id="compensationRange" label="Pay range">
                  <input
                    id="compensationRange"
                    name="compensationRange"
                    placeholder="e.g. $120K to $150K"
                    autoComplete="off"
                    enterKeyHint="next"
                    className="inner-input"
                  />
                </Field>
              </div>
            </fieldset>

            <fieldset className="inner-fieldset mt-8 border-t border-ecrn-line pt-7">
              <legend className="inner-legend">Details</legend>
              <div className="grid gap-5">
                <Field id="jobDescription" label="Job description">
                  <textarea id="jobDescription" name="jobDescription" rows={5} autoCapitalize="sentences" className="inner-input" />
                </Field>
                <Field id="notes" label="Anything else?">
                  <textarea id="notes" name="notes" rows={3} autoCapitalize="sentences" className="inner-input" />
                </Field>
              </div>
            </fieldset>

            <div className="mt-8">
              <SubmitButton>Send to Delta&apos;s recruiters</SubmitButton>
              <p className="mt-3 text-pretty text-[14px] leading-relaxed text-ecrn-secondary">A {DELTA.name} recruiter will reach out.</p>
              <Link href="/privacy" className="inner-tlink text-[14px]">
                How we handle your details
              </Link>
            </div>
          </form>
        </div>
        <p className="mt-10 text-[15px] text-ecrn-secondary">
          Looking for work instead?{" "}
          <Link href="/jobs" className="inner-tlink">
            Browse open jobs
          </Link>
        </p>
      </Band>
    </>
  );
}
