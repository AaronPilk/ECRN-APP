import { SiteHeader, SiteFooter, JsonLd } from "@/components/site/SiteChrome";
import { organizationJsonLd, websiteJsonLd } from "@/lib/site";

/** Public website (ecrn.com): marketing pages, legal pages, employer form. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-ecrn-paper">
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
