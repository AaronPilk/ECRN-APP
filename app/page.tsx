import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";

/**
 * Public landing page.
 *
 * Brand: ECRN — Power Your Connections.
 *
 * Visual direction (matches the goecrn.com casting-call aesthetic provided by Aaron):
 *   - Deep black background with a subtle green-tinted grid texture.
 *   - Vibrant ECRN green (#16C172) for emphasis and CTAs.
 *   - Bold white display type; uppercase tracking on labels.
 *   - "Verified Opportunity" pill mirrors the casting-call trust signal.
 *   - Sticky Delta endorsement card on the right at desktop widths.
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ecrn-black text-white relative overflow-hidden">
      {/* Background grid + glows — recreates the casting-call atmosphere */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(22,193,114,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(22,193,114,0.06) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(22,193,114,0.18), transparent 60%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/2 -left-40 w-[440px] h-[440px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(22,193,114,0.10), transparent 65%)" }}
      />

      {/* ─── NAV ─── */}
      <header className="relative z-20">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 flex items-center justify-between">
          <Logo useWordmark />
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
      <section className="relative">
        <div className="relative max-w-6xl mx-auto px-5 sm:px-8 pt-12 pb-24 sm:pt-20 sm:pb-32 grid lg:grid-cols-[1.15fr_1fr] gap-12 items-center">
          {/* Left — headline */}
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ecrn-green/10 border border-ecrn-green/30 text-ecrn-green text-xs font-medium">
              <Dot /> Construction Referral Network · Now Live
            </span>

            <h1 className="mt-6 text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[0.95]">
              YOUR NETWORK
              <br />
              <span className="text-ecrn-green">IS POWER.</span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-white/70 leading-relaxed max-w-xl">
              Refer the people you know in the electrical and construction industry. When Delta
              places one of them, you can earn a referral payout. Built for leaders.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/signup">
                <Button size="lg" variant="primary" fullWidth>
                  Create your account →
                </Button>
              </Link>
              <Link href="/jobs">
                <Button
                  size="lg"
                  variant="dark"
                  fullWidth
                  className="!bg-white/5 !text-white border border-white/20 hover:!bg-white/10"
                >
                  Browse open roles
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs uppercase tracking-[0.16em] text-white/40 font-medium">
              <span>Free to join</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>Powered by Delta · since 2008</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>National reach</span>
            </div>
          </div>

          {/* Right — Delta endorsement card (mirrors casting-call layout) */}
          <aside className="relative">
            <div className="rounded-3xl bg-white/[0.04] backdrop-blur border border-white/10 p-7 shadow-glow-lg">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/50">
                  Powered by
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ecrn-green/15 text-ecrn-green text-xs font-medium">
                  <CheckIcon /> Verified Network
                </span>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 grid place-items-center">
                  <DeltaMark />
                </div>
                <div>
                  <div className="text-xl font-bold tracking-tight">Delta Construction Partners</div>
                  <div className="text-xs uppercase tracking-[0.14em] text-ecrn-green mt-0.5">
                    National recruiting · Electrical construction
                  </div>
                </div>
              </div>

              <p className="mt-5 text-sm text-white/70 leading-relaxed">
                Since 2008, Delta has placed leaders, engineers, and electricians at the country&apos;s
                top firms. ECRN is the network that turns who-you-know into payouts.
              </p>

              <div className="mt-6 pt-5 border-t border-white/10 space-y-3">
                <Stat label="Referral payouts" value="Up to $5,000 / placement" />
                <Stat label="Base reach" value="National · electrical + GC" />
                <Stat
                  label="Total earning potential"
                  value="Unlimited"
                  highlight
                />
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ─── THREE VALUE PROPS ─── */}
      <section className="relative max-w-6xl mx-auto px-5 sm:px-8 py-20 sm:py-28">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="inline-block text-xs uppercase tracking-[0.18em] text-ecrn-green font-semibold mb-3">
            One network · Three ways in
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Refer. Apply. Hire.
          </h2>
          <p className="mt-4 text-white/60 text-lg">
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

      {/* ─── FOOTER ─── */}
      <footer className="relative border-t border-white/10">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/40">
          <div className="flex items-center gap-3">
            <Logo useWordmark />
            <span className="hidden sm:inline text-white/20">·</span>
            <span className="text-white/60">Power your connections</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/login" className="hover:text-white">
              Log in
            </Link>
            <Link href="/signup" className="hover:text-white">
              Sign up
            </Link>
            <Link href="/hire" className="hover:text-white">
              Hire
            </Link>
          </div>
        </div>
        <p className="text-center pb-6 text-xs text-white/30">
          A Delta Construction Partners initiative · goecrn.com
        </p>
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
      className={`relative rounded-3xl p-7 transition-all duration-200 ${
        highlighted
          ? "bg-ecrn-green text-ecrn-black shadow-glow-lg"
          : "bg-white/[0.04] border border-white/10 text-white hover:border-ecrn-green/40 hover:bg-white/[0.06]"
      }`}
    >
      <span
        className={`inline-block text-[11px] font-semibold tracking-[0.2em] uppercase ${
          highlighted ? "text-ecrn-black/70" : "text-ecrn-green"
        }`}
      >
        {badge}
      </span>
      <h3
        className={`mt-3 text-xl font-bold tracking-tight ${
          highlighted ? "text-ecrn-black" : "text-white"
        }`}
      >
        {title}
      </h3>
      <p
        className={`mt-3 text-[15px] leading-relaxed ${
          highlighted ? "text-ecrn-black/80" : "text-white/65"
        }`}
      >
        {body}
      </p>
      <Link
        href={cta.href}
        className={`mt-6 inline-flex text-sm font-semibold ${
          highlighted ? "text-ecrn-black" : "text-ecrn-green"
        } hover:underline`}
      >
        {cta.label} →
      </Link>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between text-sm ${
        highlight ? "pt-3 border-t border-white/10" : ""
      }`}
    >
      <span className="text-white/50 uppercase tracking-[0.12em] text-[11px] font-medium">
        {label}
      </span>
      <span
        className={`font-semibold ${
          highlight ? "text-ecrn-green text-base" : "text-white"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function Dot() {
  return (
    <span className="relative inline-flex w-2 h-2">
      <span className="absolute inline-flex w-full h-full rounded-full bg-ecrn-green opacity-60 animate-ping" />
      <span className="relative inline-flex w-2 h-2 rounded-full bg-ecrn-green" />
    </span>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M2.5 6.5 L5 9 L9.5 3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DeltaMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 3 L22 21 L2 21 Z" fill="#FFFFFF" />
    </svg>
  );
}
