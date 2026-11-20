import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgeCheck, BookUser, Briefcase, Lock, MapPin, Users } from "lucide-react";
import { Container, CtaLink, Eyebrow, FaqList, FinalCta } from "@/components/site/Blocks";
import { JsonLd } from "@/components/site/SiteChrome";
import { FAQS, STEPS, TIERS, faqJsonLd, pageMeta } from "@/lib/site";
import { listPublicJobs } from "@/lib/data/repository";
import { jobLocation, jobPayout, jobSalary } from "@/lib/jobs";

export const revalidate = 600;

export const metadata = pageMeta({
  title: "ECRN: Electrical Construction Jobs & Referral Rewards",
  description:
    "Find electrical construction jobs or refer people you know and earn up to $10,000 when they're hired. Free to join. Powered by Delta Construction Partners.",
  path: "/",
});

const HOME_FAQS = FAQS.slice(0, 6);

export default async function HomePage() {
  const jobs = (await listPublicJobs().catch(() => [])).slice(0, 4);

  return (
    <>
      <JsonLd data={faqJsonLd(HOME_FAQS)} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-ecrn-black text-white">
        <Image src="/brand/jobsite.webp" alt="Aerial view of an electrical construction job site" fill priority sizes="100vw" className="object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-r from-ecrn-black via-ecrn-black/80 to-ecrn-black/30" aria-hidden />
        <Container className="relative py-20 sm:py-28">
          <Eyebrow light>Electrical Construction Referral Network</Eyebrow>
          <h1 className="mt-4 font-display text-[42px] sm:text-[68px] leading-[1.02] font-semibold tracking-[-0.04em] max-w-3xl">
            Get paid up to $10,000 when your referral is hired.
          </h1>
          <p className="mt-6 text-[18px] sm:text-[20px] leading-relaxed text-white/85 max-w-2xl">
            ECRN is the free network for electrical construction professionals. Refer the people you know, or find your own next
            role. Delta Construction Partners handles everything from vetting to placement.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <CtaLink href="/signup">
              Sign up free <ArrowRight className="w-4 h-4" />
            </CtaLink>
            <CtaLink href="/how-it-works" variant="ghost">
              See how it works
            </CtaLink>
          </div>
          <p className="mt-6 font-display text-[18px] text-[#91F9B3]">Power your connections.</p>
        </Container>
      </section>

      {/* Proof strip */}
      <section className="bg-ecrn-carbon text-white">
        <Container className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
          {[
            ["Up to $10K", "per referred hire, paid after the guarantee period"],
            ["30+ recruiters", "at Delta Construction Partners working every referral"],
            ["No cap", "refer as many people as you want; every placement pays"],
          ].map(([big, small]) => (
            <div key={big} className="py-7 sm:px-8 first:sm:pl-0">
              <p className="font-display text-[30px] font-semibold text-ecrn-reward-dark">{big}</p>
              <p className="mt-1 text-[14.5px] text-white/70">{small}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* Two ways */}
      <section className="py-16 sm:py-24">
        <Container>
          <Eyebrow>One account, two ways to win</Eyebrow>
          <h2 className="mt-3 font-display text-[34px] sm:text-[46px] leading-[1.05] font-semibold tracking-[-0.03em] text-ecrn-ink max-w-3xl">
            Refer the people you know. Or find your own next role.
          </h2>
          <p className="mt-4 text-[17px] text-ecrn-secondary max-w-2xl">
            Every ECRN member can do both from the same account, on the web or in the app for iPhone and Android.
          </p>
          <div className="mt-10 grid md:grid-cols-2 gap-5">
            <div className="rounded-[22px] p-7 text-white shadow-pass" style={{ background: "linear-gradient(120deg,#00244B,#063889 60%,#0655CE)" }}>
              <BookUser className="w-7 h-7 text-ecrn-reward-dark" />
              <h3 className="mt-4 font-display text-[26px] font-semibold">Refer and earn</h3>
              <p className="mt-2 text-white/80 text-[16px] leading-relaxed">
                Pick people straight from your phone&apos;s contacts. ECRN fills in their details. When Delta places them, you earn up
                to $10,000.
              </p>
              <Link href="/referral-rewards" className="mt-5 inline-flex items-center gap-1 font-semibold text-ecrn-reward-dark">
                See referral rewards <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="rounded-[22px] p-7 text-white shadow-pass" style={{ background: "linear-gradient(150deg,#14472F,#0C2F1F 70%,#0A100C)" }}>
              <Briefcase className="w-7 h-7 text-[#91F9B3]" />
              <h3 className="mt-4 font-display text-[26px] font-semibold">Find your next role</h3>
              <p className="mt-2 text-white/80 text-[16px] leading-relaxed">
                See jobs closest to you, apply in one tap with your profile, and let Delta&apos;s recruiters do the legwork.
              </p>
              <p className="mt-3 flex items-center gap-2 text-[14px] text-white/80">
                <Lock className="w-4 h-4 text-[#91F9B3]" /> Employed? Look privately. Your employer never sees it.
              </p>
              <Link href="/jobs" className="mt-5 inline-flex items-center gap-1 font-semibold text-[#91F9B3]">
                Browse open jobs <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-24 bg-white border-y border-ecrn-line">
        <Container>
          <Eyebrow>The process</Eyebrow>
          <h2 className="mt-3 font-display text-[34px] sm:text-[46px] leading-[1.05] font-semibold tracking-[-0.03em] text-ecrn-ink">
            One network. Four steps. Real compensation.
          </h2>
          <ol className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((s) => (
              <li key={s.n} className="rounded-[18px] border border-ecrn-line bg-ecrn-paper p-6">
                <span className="font-mono text-[13px] text-ecrn-green-text">{s.n}</span>
                <h3 className="mt-3 font-display text-[20px] font-semibold text-ecrn-ink">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-ecrn-secondary">{s.body}</p>
              </li>
            ))}
          </ol>
          <Link href="/how-it-works" className="mt-8 inline-flex items-center gap-1 font-semibold text-ecrn-green-text">
            How ECRN works, step by step <ArrowRight className="w-4 h-4" />
          </Link>
        </Container>
      </section>

      {/* Tiers */}
      <section className="py-16 sm:py-24">
        <Container>
          <Eyebrow>Referral compensation</Eyebrow>
          <h2 className="mt-3 font-display text-[34px] sm:text-[46px] leading-[1.05] font-semibold tracking-[-0.03em] text-ecrn-ink">
            What you earn when your referral is hired
          </h2>
          <p className="mt-4 text-[17px] text-ecrn-secondary max-w-2xl">
            Payouts rise with the level of the role filled, up to $10,000 for executive leadership. Amounts are estimates, confirmed
            in writing before payout.
          </p>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIERS.map((t) => (
              <div key={t.tier} className="rounded-[18px] bg-white border border-ecrn-line p-6">
                <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-ecrn-secondary">{t.tier}</p>
                <h3 className="mt-2 font-display text-[19px] font-semibold text-ecrn-ink">{t.name}</h3>
                <p className="mt-1 font-display text-[28px] font-semibold text-cobalt">{t.amount}</p>
                <p className="mt-2 text-[14px] text-ecrn-secondary">{t.roles.join(" · ")}</p>
              </div>
            ))}
          </div>
          <Link href="/referral-rewards" className="mt-8 inline-flex items-center gap-1 font-semibold text-ecrn-green-text">
            Payout tiers and conditions <ArrowRight className="w-4 h-4" />
          </Link>
        </Container>
      </section>

      {/* Jobs preview */}
      {jobs.length > 0 && (
        <section className="py-16 sm:py-24 bg-white border-y border-ecrn-line">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <Eyebrow>Open roles</Eyebrow>
                <h2 className="mt-3 font-display text-[34px] sm:text-[46px] leading-[1.05] font-semibold tracking-[-0.03em] text-ecrn-ink">
                  Electrical construction jobs hiring now
                </h2>
              </div>
              <Link href="/jobs" className="inline-flex items-center gap-1 font-semibold text-ecrn-green-text">
                All open jobs <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <ul className="mt-8 grid md:grid-cols-2 gap-4">
              {jobs.map((j) => (
                <li key={j.id}>
                  <Link href={`/jobs/${j.id}`} className="block h-full rounded-[18px] border border-ecrn-line bg-ecrn-paper p-6 hover:border-ecrn-green">
                    <h3 className="font-display text-[20px] font-semibold text-ecrn-ink">{j.title}</h3>
                    <p className="mt-1 flex items-center gap-1 text-[14.5px] text-ecrn-secondary">
                      <MapPin className="w-4 h-4" /> {jobLocation(j)}
                      {jobSalary(j) ? ` · ${jobSalary(j)}` : ""}
                    </p>
                    {jobPayout(j) && <p className="mt-2 text-[14px] text-cobalt">Refer someone and earn up to {jobPayout(j)}</p>}
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      )}

      {/* Why ECRN */}
      <section className="py-16 sm:py-24">
        <Container>
          <Eyebrow>Why ECRN</Eyebrow>
          <h2 className="mt-3 font-display text-[34px] sm:text-[46px] leading-[1.05] font-semibold tracking-[-0.03em] text-ecrn-ink">
            Setting the standard for excellence
          </h2>
          <div className="mt-10 grid sm:grid-cols-2 gap-x-10 gap-y-8">
            {[
              [Users, "Built for electrical construction", "Not a generic platform. Built for and by the professionals who live in this industry every day."],
              [BadgeCheck, "Powered by Delta Construction Partners", "Delta's 30+ recruiters and national contractor relationships guide every referral to its next opportunity."],
              [Briefcase, "Structured compensation up to $10,000", "See exactly where your referral stands, from first contact to their start, through the guarantee period, to your payday."],
              [Lock, "Private when you need it", "Employed and curious? Only Delta's recruiters see that you're open to a move."],
            ].map(([Icon, title, body]) => {
              const I = Icon as typeof Users;
              return (
                <div key={title as string} className="flex gap-4">
                  <span className="w-11 h-11 shrink-0 rounded-[12px] bg-ecrn-action-surface grid place-items-center">
                    <I className="w-5 h-5 text-ecrn-green-text" />
                  </span>
                  <div>
                    <h3 className="font-display text-[19px] font-semibold text-ecrn-ink">{title as string}</h3>
                    <p className="mt-1 text-[15.5px] leading-relaxed text-ecrn-secondary">{body as string}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-24 bg-white border-t border-ecrn-line">
        <Container className="max-w-4xl">
          <Eyebrow>FAQ</Eyebrow>
          <h2 className="mt-3 mb-8 font-display text-[34px] sm:text-[46px] leading-[1.05] font-semibold tracking-[-0.03em] text-ecrn-ink">
            Questions worth asking
          </h2>
          <FaqList faqs={HOME_FAQS} />
          <Link href="/faq" className="mt-8 inline-flex items-center gap-1 font-semibold text-ecrn-green-text">
            All questions <ArrowRight className="w-4 h-4" />
          </Link>
        </Container>
      </section>

      <FinalCta />
    </>
  );
}
