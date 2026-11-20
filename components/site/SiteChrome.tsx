import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { ChevronLeft } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/session";
import { SiteMenu } from "./SiteMenu";

export const NAV = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/referral-rewards", label: "Rewards" },
  { href: "/jobs", label: "Jobs" },
  { href: "/hire", label: "For employers" },
  { href: "/faq", label: "FAQ" },
];

/** Public header: dark, logo left, nav + auth CTA. Minimal inside the native app. */
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
    <header className="sticky top-0 z-40 bg-ecrn-black/90 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-6xl mx-auto h-16 px-5 sm:px-8 flex items-center justify-between gap-6">
        <Link href="/" aria-label="ECRN home" className="shrink-0">
          <Image src="/brand/ecrn-horizontal-white.png" alt="ECRN" width={150} height={38} className="h-8 w-auto" priority />
        </Link>
        <nav aria-label="Main" className="hidden lg:flex items-center gap-7">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-[14.5px] text-white/75 hover:text-white">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {profile ? (
            <Link href="/start" className="h-10 px-4 rounded-[12px] bg-gradient-to-b from-ecrn-action-bright to-ecrn-green text-ecrn-action-ink text-[14.5px] font-semibold inline-flex items-center">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:inline-flex h-10 px-3 items-center text-[14.5px] text-white/85 hover:text-white">
                Log in
              </Link>
              <Link href="/signup" className="h-10 px-4 rounded-[12px] bg-gradient-to-b from-ecrn-action-bright to-ecrn-green text-ecrn-action-ink text-[14.5px] font-semibold inline-flex items-center">
                Sign up free
              </Link>
            </>
          )}
          <SiteMenu items={NAV} signedIn={Boolean(profile)} />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="bg-ecrn-black text-white/70 border-t border-white/10">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12 grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Image src="/brand/ecrn-horizontal-white.png" alt="ECRN" width={150} height={38} className="h-8 w-auto" />
          <p className="mt-4 text-[14px] leading-relaxed max-w-xs">
            The Electrical Construction Referral Network. Find your next role or refer people you know and earn up to $10,000 when they&apos;re hired.
          </p>
          <p className="mt-4 text-[13px]">
            A{" "}
            <a href="https://deltaconstructionpartners.com" className="text-white hover:underline" rel="noopener">
              Delta Construction Partners
            </a>{" "}
            initiative · #BuiltForLeaders
          </p>
        </div>
        <FooterCol
          title="Members"
          links={[
            ["/signup", "Create an account"],
            ["/jobs", "Open jobs"],
            ["/how-it-works", "How it works"],
            ["/referral-rewards", "Referral rewards"],
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            ["/about", "About ECRN"],
            ["/hire", "For employers"],
            ["/faq", "FAQ"],
            ["/support", "Support"],
          ]}
        />
        <FooterCol
          title="Legal"
          links={[
            ["/terms", "Terms & program terms"],
            ["/privacy", "Privacy policy"],
            ["/login", "Log in"],
          ]}
        />
      </div>
      <div className="border-t border-white/10">
        <p className="max-w-6xl mx-auto px-5 sm:px-8 py-5 text-[12.5px] text-white/50">
          © {new Date().getFullYear()} ECRN · Electrical Construction Referral Network. Payout amounts are estimates; see program terms.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h2 className="text-[12px] font-mono uppercase tracking-[0.14em] text-white/45">{title}</h2>
      <ul className="mt-3 space-y-2 text-[14px]">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
