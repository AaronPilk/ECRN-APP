import Link from "next/link";
import { headers } from "next/headers";
import { ArrowUpRight, ChevronLeft } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/session";
import { CoBrandLockup, DELTA, DeltaLogo } from "./Delta";
import { SiteMenu } from "./SiteMenu";
import { HeaderState, SiteNav } from "./SiteNav";
import { siteVars } from "./motion/vars";

export const NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/referral-rewards", label: "Rewards" },
  { href: "/jobs", label: "Jobs" },
  { href: "/careers", label: "Careers" },
  { href: "/blog", label: "Blog" },
  { href: "/hire", label: "For employers" },
];

/**
 * Public header: the ECRN × Delta lockup on the left, the menu button on the
 * right, in one 60 px bar on phones (72 px from lg). The lockup is sized so
 * both names stay legible at 360 px with room to spare; Sign up and Log in
 * live in the menu on phones and join the bar from 640 px. Dark glass that
 * starts clear over a dark hero and gains opacity once the page scrolls
 * (site.css). Inside the native app: a back link and Delta's name.
 */
export async function SiteHeader() {
  const ua = (await headers()).get("user-agent") ?? "";
  if (ua.includes("ECRNApp")) {
    return (
      <header className="sticky top-0 z-40 bg-ecrn-black/95 backdrop-blur pt-safe">
        <div className="max-w-6xl mx-auto h-14 px-5 flex items-center justify-between gap-4">
          <Link href="/start" className="inline-flex min-h-11 items-center gap-1 text-[14px] font-medium text-white/90">
            <ChevronLeft className="w-4 h-4" /> Back to ECRN
          </Link>
          <DeltaLogo size={18} label={`An initiative of ${DELTA.name}`} />
        </div>
      </header>
    );
  }
  const profile = await getCurrentProfile().catch(() => null);
  return (
    <header className="site-header">
      <a href="#main" className="site-skip">
        Skip to content
      </a>
      <div className="site-header-bg" aria-hidden />
      <div className="relative mx-auto flex h-[var(--site-header-h)] max-w-[1200px] items-center gap-4 px-5 sm:px-8 xl:gap-6">
        {/* 22 px at 360, 24 px from 400 up, 28 px beside the full desktop nav. */}
        <CoBrandLockup ecrnHref="/" deltaHref="/about" className="xl:!text-[1.75rem]" />

        <div className="hidden min-w-0 flex-1 justify-center xl:flex">
          <SiteNav items={NAV} />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 xl:ml-0">
          {profile ? (
            <Link href="/start" className="site-btn site-btn-primary site-btn-sm hidden sm:inline-flex">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="site-nav-link hidden sm:inline-flex">
                Log in
              </Link>
              <Link href="/signup" className="site-btn site-btn-primary site-btn-sm hidden sm:inline-flex">
                Sign up free
              </Link>
            </>
          )}
          <SiteMenu items={NAV} signedIn={Boolean(profile)} />
        </div>
      </div>
      <HeaderState />
    </header>
  );
}

const FOOTER_COLUMNS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Members",
    links: [
      { href: "/signup", label: "Create an account" },
      { href: "/login", label: "Log in" },
      { href: "/jobs", label: "Open jobs" },
      { href: "/referral-rewards", label: "Referral rewards" },
      { href: "/how-it-works", label: "How it works" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/careers", label: "Career guides" },
      { href: "/glossary", label: "Glossary" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About ECRN" },
      { href: "/hire", label: "For employers" },
      { href: "/support", label: "Support" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of use" },
      { href: "/terms#program", label: "Program terms" },
      { href: "/privacy", label: "Privacy policy" },
    ],
  },
];

/**
 * Footer: the large co-brand lockup (stacked on phones), one sentence on who
 * Delta is with a link to its site, every public page in two columns on
 * phones and four from md, then the legal line. A dark island like the
 * other panels; its content lines up with the page gutter.
 */
export function SiteFooter() {
  return (
    <footer className="site-tone-light bg-ecrn-paper p-2 sm:p-3">
      <div className="site-tone-dark site-island site-highlight relative isolate overflow-clip rounded-[28px] bg-ecrn-black sm:rounded-[40px]">
        <div className="site-container mx-auto w-full max-w-[1200px] px-5 sm:px-8">
          <div className="grid gap-7 pb-10 pt-12 sm:pb-12 sm:pt-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:items-center lg:gap-16 lg:pb-14">
            <CoBrandLockup size="lg" layout="auto" ecrnHref="/" deltaHref={DELTA.url} deltaLabel={DELTA.name} />
            <div>
              <p className="max-w-xl text-[16px] leading-[1.6] text-white/[0.78]">
                ECRN is an initiative of {DELTA.name}, a construction recruiting firm with {DELTA.recruiters} recruiters and national contractor
                relationships, recruiting since {DELTA.since}.
              </p>
              <a href={DELTA.url} target="_blank" rel="noopener" className="site-link mt-1 inline-flex" style={siteVars({ accent: "#A9CEFF" })}>
                {DELTA.domain}
                <span className="sr-only"> (opens in a new tab)</span>
                <ArrowUpRight aria-hidden className="h-4 w-4" />
              </a>
            </div>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-5 gap-y-8 border-t border-white/10 py-10 sm:gap-x-8 md:grid-cols-4 md:py-12">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title} className="min-w-0">
                <h2 className="font-display text-[13px] font-semibold text-white/60">{col.title}</h2>
                <ul className="site-foot-list mt-2">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className="site-foot-link">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* The tagline, set to the width of the panel (container units, with a viewport fallback). Not on phones. */}
          <div aria-hidden className="hidden [container-type:inline-size] sm:block">
            <p className="select-none whitespace-nowrap bg-gradient-to-b from-white/[0.16] to-white/[0.02] bg-clip-text font-display text-[7.2vw] font-semibold leading-[1.1] tracking-[-0.045em] text-transparent supports-[font-size:1cqw]:text-[length:8.9cqw]">
              Power your connections.
            </p>
          </div>

          <div className="flex flex-col gap-1.5 border-t border-white/10 py-6 text-[13px] leading-relaxed text-white/60 md:flex-row md:items-center md:justify-between md:gap-8">
            <p>© {new Date().getFullYear()} ECRN, Electrical Construction Referral Network</p>
            <p>
              Payout amounts are estimates, confirmed in writing. See the{" "}
              {/* Inline link: vertical padding grows the tap target to 44 px without moving the line. */}
              <Link href="/terms#program" className="py-[13px] text-white/[0.82] underline decoration-white/30 underline-offset-2">
                program terms
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
