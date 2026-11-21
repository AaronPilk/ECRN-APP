import "@/components/site/inner/inner.css";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Mail } from "lucide-react";
import { PageHero } from "@/components/site/Blocks";
import { SUPPORT_EMAIL } from "@/components/legal/LegalPage";
import { JsonLd } from "@/components/site/SiteChrome";
import { Band, Crumbs, DeltaNote } from "@/components/site/inner/Kit";
import { breadcrumbJsonLd, pageMeta } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "Account, Referral and Payout Support | ECRN",
  description:
    "Get help with ECRN: referral payouts, duplicate referrals, account access, deleting your account, and hiring through Delta Construction Partners.",
  path: "/support",
});

const CRUMBS = [
  { name: "Home", path: "/" },
  { name: "Support", path: "/support" },
];

const TOPICS: { id: string; title: string; items: { q: string; a: ReactNode; link?: { href: string; label: string } }[] }[] = [
  {
    id: "referrals",
    title: "Referrals and payouts",
    items: [
      {
        q: "How do referral payouts work?",
        a: (
          <>
            Refer someone you know. If Delta places them in a role, you&apos;re eligible for that role&apos;s referral payout (up to $10,000,
            depending on the role). Track status under Earnings.
          </>
        ),
        link: { href: "/referral-rewards", label: "Payout tiers and timing" },
      },
      {
        q: "Someone already referred my contact. What happens?",
        a: (
          <>
            The first referrer keeps ownership. Your submission shows as &ldquo;Under review&rdquo; and our team checks every duplicate by
            hand.
          </>
        ),
      },
    ],
  },
  {
    id: "account",
    title: "Your account",
    items: [
      {
        q: "I forgot my password.",
        a: <>On the login screen tap &ldquo;Forgot password?&rdquo; or &ldquo;Email me a link&rdquo; to sign in without one.</>,
        link: { href: "/login", label: "Go to log in" },
      },
      {
        q: "How do I delete my account?",
        a: <>In the app go to Profile → Delete account. It&apos;s permanent and takes effect immediately.</>,
      },
    ],
  },
  {
    id: "hiring",
    title: "Hiring",
    items: [
      {
        q: "I'm hiring. How do I work with Delta?",
        a: <>Submit your hiring need on the employer page and a recruiter will reach out.</>,
        link: { href: "/hire", label: "Open the hiring form" },
      },
    ],
  },
];

export default function SupportPage() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(CRUMBS)} />
      <PageHero
        eyebrow="Support"
        title="Help and support"
        image="switchgear-room"
        intro={
          <p>
            Questions about a referral, a payout or your account? Email the Delta Construction Partners team and you&apos;ll hear back within
            one business day.
          </p>
        }
      >
        <a href={`mailto:${SUPPORT_EMAIL}`} className="site-btn site-btn-primary inline-flex w-full sm:w-auto">
          <Mail aria-hidden className="h-4 w-4" />
          <span>Email support</span>
        </a>
      </PageHero>

      <Crumbs items={CRUMBS} />

      <Band first labelledBy="contact-title">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          {/* The address itself, big enough to read and copy on a phone. */}
          <div className="lg:sticky lg:top-[calc(var(--site-header-total)+2.5rem)] lg:self-start">
            <div className="site-card rounded-[24px] p-6 sm:p-8">
              <h2 id="contact-title" className="font-display text-[14px] font-medium text-ecrn-secondary">
                Email support
              </h2>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="mt-2 inline-flex min-h-11 max-w-full items-center break-all font-display text-[22px] font-semibold leading-tight tracking-[-0.02em] text-ecrn-ink underline decoration-ecrn-line underline-offset-[6px] sm:text-[26px]"
              >
                {SUPPORT_EMAIL}
              </a>
              <p className="inner-body mt-3">The Delta Construction Partners team replies within one business day.</p>
              <Link href="/faq" className="inner-tlink mt-2 text-[15px]">
                Browse the FAQ
              </Link>
            </div>
          </div>

          <div className="grid gap-12">
            {TOPICS.map((t) => (
              <section key={t.id} id={t.id} aria-labelledby={`${t.id}-title`}>
                <h2 id={`${t.id}-title`} className="inner-h2-sm">
                  {t.title}
                </h2>
                <div className="mt-4 border-t border-ecrn-line">
                  {t.items.map((it) => (
                    <div key={it.q} className="border-b border-ecrn-line py-5">
                      <h3 className="font-display text-[17px] font-semibold leading-snug tracking-[-0.015em] text-ecrn-ink lg:text-[19px]">{it.q}</h3>
                      <p className="inner-body mt-1.5">{it.a}</p>
                      {it.link ? (
                        <Link href={it.link.href} className="inner-tlink text-[15px]">
                          {it.link.label}
                        </Link>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
        <DeltaNote className="mt-14 sm:mt-20">
          ECRN support is run by the team at Delta Construction Partners, a construction recruiting firm that has been recruiting since 2008.
          Its 30+ recruiters and national contractor relationships are behind every referral and application on ECRN.
        </DeltaNote>
      </Band>
    </>
  );
}
