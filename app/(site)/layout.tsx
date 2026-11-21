import "./site.css";
import { SiteHeader, SiteFooter, JsonLd } from "@/components/site/SiteChrome";
import { organizationJsonLd, websiteJsonLd } from "@/lib/site";

/**
 * Public website (ecrn.com): marketing pages, legal pages, employer form.
 * `site-root` scopes the site's CSS (app/(site)/site.css); `#main` is the
 * skip-link target.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-root flex min-h-screen flex-col bg-ecrn-paper">
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <SiteHeader />
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
