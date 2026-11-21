import "./(site)/site.css";
import { ArrowLink, Container, CtaLink, Eyebrow, PoweredByDelta } from "@/components/site/Blocks";
import { SiteFooter, SiteHeader } from "@/components/site/SiteChrome";
import { siteVars } from "@/components/site/motion/vars";

export const metadata = { title: "Page not found", robots: { index: false, follow: true } };

/** Real 404 (status 404), in the site chrome, with links back into the site. */
export default function NotFound() {
  return (
    <div className="site-root flex min-h-screen flex-col bg-ecrn-paper">
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex flex-1 flex-col outline-none">
        <section data-site-hero className="site-tone-dark relative isolate flex flex-1 items-center overflow-clip bg-ecrn-black">
          <div aria-hidden className="site-grid-bg -z-10" />
          <div aria-hidden className="site-glow -right-32 -top-48 -z-10 h-[36rem] w-[36rem]" style={siteVars({ "glow-color": "rgba(6, 85, 206, 0.26)" })} />
          <div aria-hidden className="site-glow -bottom-64 -left-40 -z-10 h-[32rem] w-[32rem]" style={siteVars({ "glow-color": "rgba(22, 193, 114, 0.14)" })} />
          <Container className="pb-20 pt-[calc(var(--site-header-total)+3rem)] sm:pb-28 sm:pt-[calc(var(--site-header-total)+5rem)]">
            <Eyebrow light>404</Eyebrow>
            <h1 className="site-display-2 mt-4 max-w-3xl">That page isn&apos;t here</h1>
            <p className="site-lede mt-5 max-w-xl text-white/[0.82]">It may have moved, or the job may be filled.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <CtaLink href="/">Back to the home page</CtaLink>
              <CtaLink href="/jobs" variant="ghost">
                See open jobs
              </CtaLink>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-7">
              <ArrowLink href="/how-it-works">How it works</ArrowLink>
              <ArrowLink href="/blog">Blog</ArrowLink>
              <ArrowLink href="/start">Open the app</ArrowLink>
            </div>
            <div className="mt-10">
              <PoweredByDelta variant="inline" />
            </div>
          </Container>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
