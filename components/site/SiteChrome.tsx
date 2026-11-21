import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight, ArrowUpRight, ChevronLeft } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/session";
import { DELTA, PoweredByDelta } from "./Delta";
import { SiteLogo } from "./SiteLogo";
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
 * Public header: dark glass that starts clear over a dark hero and gains
 * opacity and a hairline once the page has scrolled (see site.css). The ECRN
 * logo always carries the "Powered by Delta Construction Partners" lockup:
 * full from md up, compact on phones, never hidden. Minimal inside the native
 * app.
 */
export async function SiteHeader() {
  const ua = (await headers()).get("user-agent") ?? "";
  if (ua.includes("ECRNApp")) {
    return (
      <header className="sticky top-0 z-40 bg-ecrn-black/95 backdrop-blur pt-safe">
        <div className="max-w-6xl mx-auto h-14 px-5 flex items-center">
          <Link href="/start" className="inline-flex items-center gap-1 text-[14px] font-medium text-white/90">
            <ChevronLeft className="w-4 h-4" /> Back to ECRN
          </Link>
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
      <div className="relative mx-auto flex h-[var(--site-header-h)] max-w-[1200px] items-center gap-3 px-4 sm:px-8 xl:gap-6">
        <div className="flex min-w-0 items-center">
          <Link href="/" aria-label="ECRN home" className="flex h-11 shrink-0 items-center">
            <SiteLogo />
          </Link>
          <span aria-hidden className="mx-2.5 h-6 w-px shrink-0 bg-white/[0.16] sm:mx-4" />
          <PoweredByDelta variant="lockup" compact href="/about" className="h-11" />
        </div>

        <div className="hidden flex-1 justify-center xl:flex">
          <SiteNav items={NAV} />
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 xl:ml-0">
          {profile ? (
            <span className="hidden min-[375px]:block">
              <Link href="/start" className="site-btn site-btn-primary site-btn-sm inline-flex">
                <span className="sm:hidden">Dashboard</span>
                <span className="hidden sm:inline">Open dashboard</span>
              </Link>
            </span>
          ) : (
            <>
              <span className="hidden sm:block">
                <Link href="/login" className="site-nav-link inline-flex">
                  Log in
                </Link>
              </span>
              <span className="hidden min-[375px]:block">
                <Link href="/signup" className="site-btn site-btn-primary site-btn-sm inline-flex">
                  <span>
                    Sign up<span className="hidden sm:inline"> free</span>
                  </span>
                </Link>
              </span>
            </>
          )}
          <SiteMenu items={NAV} signedIn={Boolean(profile)} />
        </div>
      </div>
      <HeaderState />
    </header>
  );
}

const FOOTER_COLUMNS: { title: string; links: { href: string; label: string; external?: boolean }[] }[] = [
  {
    title: "Members",
    links: [
      { href: "/signup", label: "Create an account" },
      { href: "/jobs", label: "Open jobs" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/referral-rewards", label: "Referral rewards" },
      { href: "/login", label: "Log in" },
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
      { href: DELTA.url, label: DELTA.name, external: true },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms and program terms" },
      { href: "/privacy", label: "Privacy policy" },
    ],
  },
];

/**
 * Footer: who Delta is (one sentence, with a link), then every public page.
 * A dark panel that floats in the page like the other islands.
 */
export function SiteFooter() {
  return (
    <footer className="site-tone-light bg-ecrn-paper p-2 sm:p-3">
      <div className="site-tone-dark relative isolate overflow-clip rounded-[28px] bg-ecrn-black sm:rounded-[40px]">
        <div aria-hidden className="site-glow -left-40 -top-40 -z-10 h-[30rem] w-[30rem]" style={siteVars({ "glow-color": "rgba(6, 85, 206, 0.2)" })} />
        <div aria-hidden className="site-glow -bottom-56 right-[-10rem] -z-10 h-[34rem] w-[34rem]" style={siteVars({ "glow-color": "rgba(22, 193, 114, 0.12)" })} />

        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="grid gap-8 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-16">
            <div>
              <div className="flex flex-col items-start gap-2 min-[440px]:flex-row min-[440px]:items-center min-[440px]:gap-0">
                <Link href="/" aria-label="ECRN home" className="flex h-11 shrink-0 items-center">
                  <SiteLogo className="h-[30px] sm:h-[34px]" />
                </Link>
                <span aria-hidden className="mx-5 hidden h-7 w-px shrink-0 bg-white/[0.16] min-[440px]:block" />
                <PoweredByDelta variant="lockup" href={DELTA.url} className="h-11" />
              </div>
              <p className="site-lede mt-6 max-w-xl text-white/[0.78]">
                ECRN is powered by{" "}
                <a href={DELTA.url} target="_blank" rel="noopener" className="font-medium text-white underline decoration-white/30 underline-offset-4">
                  {DELTA.name}
                </a>
                , a construction recruiting firm with {DELTA.recruiters} recruiters and national contractor relationships, recruiting since {DELTA.since}.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link href="/signup" className="site-btn site-btn-primary inline-flex">
                Sign up free <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
              <a href={DELTA.url} target="_blank" rel="noopener" className="site-btn site-btn-ghost inline-flex">
                <span>
                  {DELTA.domain}
                  <span className="sr-only"> (opens in a new tab)</span>
                </span>
                <ArrowUpRight aria-hidden className="h-4 w-4" />
              </a>
            </div>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 border-t border-white/10 py-12 md:grid-cols-4">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="site-eyebrow text-white/60">{col.title}</p>
                <ul className="mt-3 md:mt-4">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      {l.external ? (
                        <a href={l.href} target="_blank" rel="noopener" className="site-foot-link inline-flex">
                          <span>
                            {l.label}
                            <span className="sr-only"> (opens in a new tab)</span>
                            <ArrowUpRight aria-hidden className="ml-1 inline h-3.5 w-3.5 align-[-2px] text-white/50" />
                          </span>
                        </a>
                      ) : (
                        <Link href={l.href} className="site-foot-link inline-flex">
                          {l.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* The tagline, set to the width of the panel (container units, with a viewport fallback). */}
          <div aria-hidden className="[container-type:inline-size]">
            <p className="select-none whitespace-nowrap bg-gradient-to-b from-white/[0.16] to-white/[0.02] bg-clip-text font-display text-[7.2vw] font-semibold leading-[1.1] tracking-[-0.045em] text-transparent supports-[font-size:1cqw]:text-[length:8.9cqw]">
              Power your connections.
            </p>
          </div>

          <div className="flex flex-col gap-2 border-t border-white/10 py-6 text-[13px] leading-relaxed text-white/60 md:flex-row md:items-center md:justify-between md:gap-8">
            <p>
              © {new Date().getFullYear()} ECRN · Electrical Construction Referral Network. A {DELTA.name} initiative. #BuiltForLeaders
            </p>
            <p>
              Payout amounts are estimates. See the{" "}
              <Link href="/terms#program" className="text-white/[0.78] underline decoration-white/30 underline-offset-2">
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
