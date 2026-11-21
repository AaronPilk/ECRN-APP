import "./(site)/site.css";
import { ArrowLink, Container, CtaLink, DeltaBadge, Eyebrow } from "@/components/site/Blocks";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { siteVars } from "@/components/site/motion/vars";

export const metadata = { title: "Page not found", robots: { index: false, follow: true } };

const LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/referral-rewards", label: "Rewards" },
  { href: "/blog", label: "Blog" },
  { href: "/start", label: "Open the app" },
];

/** Real 404 (status 404), in the site chrome, with links back into the site. */
export default function NotFound() {
  return (
    <div className="site-root flex min-h-screen flex-col bg-ecrn-paper">
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <section data-site-hero className="site-tone-dark relative isolate flex flex-1 items-center overflow-clip bg-ecrn-black">
          <div aria-hidden className="site-grid-bg -z-10" />
          <div aria-hidden className="site-glow -right-40 -top-56 -z-10 h-[34rem] w-[34rem]" style={siteVars({ "glow-color": "rgba(6, 85, 206, 0.24)" })} />
          <Container className="pb-16 pt-[calc(var(--site-header-total)+2rem)] sm:pb-24 sm:pt-[calc(var(--site-header-total)+5rem)]">
            <DeltaBadge href="/about" />
            <Eyebrow light className="mt-6">
              Error 404
            </Eyebrow>
            <h1 className="site-display-2 mt-3 max-w-3xl">That page isn&apos;t here</h1>
            <p className="site-lede mt-4 max-w-xl text-white/[0.82]">It may have moved, or the job may be filled.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CtaLink href="/">Back to the home page</CtaLink>
              <CtaLink href="/jobs" variant="ghost">
                See open jobs
              </CtaLink>
            </div>
            <ul className="mt-8 grid grid-cols-2 gap-x-6 gap-y-1 sm:flex sm:flex-wrap sm:gap-x-8">
              {LINKS.map((l) => (
                <li key={l.href}>
                  <ArrowLink href={l.href}>{l.label}</ArrowLink>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
