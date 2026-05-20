import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

/**
 * Public landing page.
 *
 * Visual direction:
 *   - Dark hero (matches goecrn.com / Delta navy aesthetic)
 *   - Three value props for the three user types
 *   - Bold "Built for Leaders" + Delta endorsement
 *   - Apple-clean inside-the-card UI cues
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* ─── NAV ─── */}
      <header className="absolute top-0 inset-x-0 z-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-5 flex items-center justify-between">
          <Logo variant="light" />
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-sm font-medium text-white/80 hover:text-white px-3 py-2"
            >
              Log in
            </Link>
            <Link href="/signup">
              <Button size="sm" variant="primary">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="relative bg-delta-navy text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 0%, rgba(245,180,25,0.18), transparent 50%), radial-gradient(circle at 90% 100%, rgba(37,99,235,0.18), transparent 50%)",
          }}
          aria-hidden
        />
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-32 pb-24 sm:pt-40 sm:pb-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-ecrn-amber tracking-[0.18em] uppercase mb-6">
              <span className="w-6 h-px bg-ecrn-amber" />
              A Delta Construction Partners Initiative
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05]">
              Your network in construction <span className="text-ecrn-amber">has value.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-300 leading-relaxed max-w-xl">
              Refer the people you know in the electrical and construction industry. When Delta
              places one of them, you can earn a referral payout.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/signup">
                <Button size="lg" variant="primary" fullWidth>
                  Create your account
                </Button>
              </Link>
              <Link href="/jobs">
                <Button size="lg" variant="secondary" fullWidth>
                  Browse open roles
                </Button>
              </Link>
            </div>
            <p className="mt-6 text-xs text-slate-400">
              Free to join · Built for leaders · Since 2008
            </p>
          </div>
        </div>
      </section>

      {/* ─── THREE VALUE PROPS ─── */}
      <section className="max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-delta-ink">
            One network. Three ways in.
          </h2>
          <p className="mt-4 text-slate-600 text-lg">
            ECRN connects construction talent, the people who know them, and the companies hiring.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          <ValueCard
            badge="Refer"
            title="Get paid for who you know"
            body="Upload the people you trust in the trade. If Delta places them, you can earn. Track every referral from submission to payout."
            cta={{ href: "/signup?role=referral_partner", label: "Refer talent" }}
          />
          <ValueCard
            badge="Apply"
            title="Find your next role"
            body="Browse confidential opportunities at top-ENR contractors. Apply directly — your information stays private until you say otherwise."
            cta={{ href: "/signup?role=candidate", label: "See open jobs" }}
            highlighted
          />
          <ValueCard
            badge="Hire"
            title="Get the right people, faster"
            body="Tell us what you're hiring for. Delta's nationally-recognized recruiting team turns it into placements."
            cta={{ href: "/hire", label: "Submit a hiring need" }}
          />
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <section className="bg-delta-mist border-y border-slate-200/70">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 grid sm:grid-cols-3 gap-8 text-center">
          <Stat number="18+" label="Years recruiting construction leaders" />
          <Stat number="National" label="Reach across U.S. electrical contractors" />
          <Stat number="Top ENR" label="Clients across the country" />
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden sm:inline text-slate-300">·</span>
            <span>A Delta Construction Partners Initiative</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/login" className="hover:text-delta-ink">
              Log in
            </Link>
            <Link href="/signup" className="hover:text-delta-ink">
              Sign up
            </Link>
            <Link href="/hire" className="hover:text-delta-ink">
              Hire
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ValueCard({
  badge,
  title,
  body,
  cta,
  highlighted,
}: {
  badge: string;
  title: string;
  body: string;
  cta: { href: string; label: string };
  highlighted?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl p-7 transition-shadow ${
        highlighted
          ? "bg-delta-navy text-white shadow-float"
          : "bg-white border border-slate-200/70 shadow-soft"
      }`}
    >
      <span
        className={`inline-block text-[11px] font-semibold tracking-[0.18em] uppercase ${
          highlighted ? "text-ecrn-amber" : "text-ecrn-amber-dark"
        }`}
      >
        {badge}
      </span>
      <h3
        className={`mt-3 text-xl font-semibold tracking-tight ${
          highlighted ? "text-white" : "text-delta-ink"
        }`}
      >
        {title}
      </h3>
      <p
        className={`mt-3 text-[15px] leading-relaxed ${
          highlighted ? "text-slate-300" : "text-slate-600"
        }`}
      >
        {body}
      </p>
      <Link
        href={cta.href}
        className={`mt-6 inline-flex text-sm font-medium ${
          highlighted ? "text-ecrn-amber" : "text-delta-ink"
        } hover:underline`}
      >
        {cta.label} →
      </Link>
    </div>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div className="text-4xl font-bold text-delta-ink tracking-tight">{number}</div>
      <div className="mt-2 text-sm text-slate-600">{label}</div>
    </div>
  );
}
