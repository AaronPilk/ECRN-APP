import { Check, Lock, MapPin } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { GlassCard } from "../Blocks";
import { Float, Tilt, TiltLayer } from "../motion/Float";
import { Parallax } from "../motion/Parallax";
import { siteVars } from "../motion/vars";

const STAGES: { label: string; state: "done" | "now" | "next" }[] = [
  { label: "Referred", state: "done" },
  { label: "Interviewing", state: "done" },
  { label: "Placed", state: "done" },
  { label: "Guarantee period", state: "now" },
  { label: "Paid", state: "next" },
];

/**
 * Home hero: floating glass cards that show what the product does. They are
 * illustrations built in HTML, every one labelled "Example", with amounts
 * taken from the tiers in lib/site.ts (superintendent = field leadership =
 * up to $5,000).
 *
 * Each card sits at its own depth: from lg it scrolls at its own speed
 * (Parallax), drifts on its own clock (Float) and follows the pointer by its
 * own amount (TiltLayer). The cards higher up move faster, so they spread
 * apart as the page scrolls and never slide over one another. Below lg the
 * cards sit in the flow, one under the other, so scroll-linked movement is
 * off there (it would push them into each other); only the slow idle drift
 * remains. Glass is never stacked on glass.
 *
 * Phones show two cards, tablets three, desktops four.
 */
export function HeroStage({ className }: { className?: string }) {
  return (
    <Tilt max={8} className={cn("lg:flex lg:justify-end", className)}>
      <div
        role="img"
        aria-label="Illustration of the ECRN app: an example job that pays a referral reward, a referral tracker, a payout and a privacy setting."
        className="grid gap-4 sm:grid-cols-2 sm:items-start sm:gap-5 md:grid-cols-3 lg:relative lg:block lg:h-[35rem] lg:w-[30rem] lg:shrink-0 lg:origin-top-right lg:scale-[0.85] xl:scale-100"
      >
        {/* Example job (nearest, thickest glass) */}
        <Parallax speed={-0.12} above="lg" className="mr-8 sm:mr-0 lg:absolute lg:right-0 lg:top-[1.75rem] lg:w-[21rem]">
          <TiltLayer depth={1.5}>
            <Float amplitude={5} duration={9} delay={-2}>
              <GlassCard weight="thick" className="site-enter p-[18px]" style={siteVars({ i: 5, y: "26px" })}>
                <div className="flex items-center justify-between gap-3">
                  <p className="site-eyebrow text-[#91F9B3]">Example job</p>
                  <span className="flex items-center gap-1.5 font-display text-[13px] font-medium text-white/90">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#36DC86]" />
                    Open
                  </span>
                </div>
                <p className="mt-3 font-display text-[19px] font-semibold leading-tight tracking-[-0.02em]">Electrical Superintendent</p>
                <p className="mt-1.5 flex items-center gap-1.5 text-[13.5px] text-white/[0.84]">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  Tampa, FL
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 rounded-[10px] bg-[#0A3F9C]/55 px-3.5 py-2.5 shadow-[inset_0_0_0_1px_rgba(188,223,255,0.2)]">
                  <span className="whitespace-nowrap text-[13px] text-white/90">Refer and earn</span>
                  <span className="site-num whitespace-nowrap text-[16px] font-semibold text-[#BCDFFF]">up to $5,000</span>
                </div>
              </GlassCard>
            </Float>
          </TiltLayer>
        </Parallax>

        {/* Example referral tracker, with the live "current" dot */}
        <Parallax speed={-0.06} above="lg" className="ml-10 sm:ml-0 lg:absolute lg:left-0 lg:top-[13rem] lg:w-[16rem]">
          <TiltLayer depth={0.8}>
            <Float amplitude={6} duration={11} delay={-5}>
              <GlassCard className="site-enter p-[18px]" style={siteVars({ i: 6, y: "26px" })}>
                <p className="site-eyebrow text-[#91F9B3]">Example referral</p>
                <p className="mt-2.5 font-display text-[16px] font-semibold tracking-[-0.015em]">Your referral</p>
                <div className="relative mt-3.5">
                  <span className="absolute left-[4.5px] top-[15px] h-[120px] w-px bg-white/20" />
                  <span className="absolute left-[4.5px] top-[15px] h-[90px] w-px bg-[#36DC86]" />
                  {STAGES.map((s) => (
                    <div key={s.label} className="relative flex h-[30px] items-center gap-3">
                      {s.state === "now" ? (
                        <span className="site-live-dot" />
                      ) : (
                        <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", s.state === "done" ? "bg-[#36DC86]" : "bg-[#18211C] shadow-[inset_0_0_0_1.5px_rgba(255,255,255,0.45)]")} />
                      )}
                      <span className={cn("flex-1 text-[13.5px]", s.state === "now" ? "font-medium text-white" : s.state === "done" ? "text-white/90" : "text-white/[0.78]")}>{s.label}</span>
                      {s.state === "done" ? <Check className="h-3.5 w-3.5 text-[#91F9B3]" /> : null}
                      {s.state === "now" ? <span className="font-display text-[13px] font-semibold text-[#91F9B3]">Now</span> : null}
                    </div>
                  ))}
                </div>
                <p className="mt-3 border-t border-white/[0.12] pt-3 text-[13px] leading-snug text-white/[0.84]">Guarantee period: typically 90 days.</p>
              </GlassCard>
            </Float>
          </TiltLayer>
        </Parallax>

        {/* Example payout */}
        <Parallax speed={-0.09} above="lg" className="hidden md:block lg:absolute lg:right-0 lg:top-[14.5rem] lg:w-[12.5rem]">
          <TiltLayer depth={1.1}>
            <Float amplitude={4} duration={8} delay={-1}>
              <GlassCard className="site-enter p-[18px]" style={siteVars({ i: 7, y: "26px" })}>
                <p className="site-eyebrow text-[#91F9B3]">Example payout</p>
                <p className="site-num mt-3 text-[40px] font-semibold leading-none text-[#BCDFFF]">$5,000</p>
                <p className="mt-2 text-[13px] leading-snug text-white/[0.84]">Field leadership tier</p>
                <p className="mt-3 flex items-center gap-1.5 border-t border-white/[0.12] pt-3 text-[13px] text-white/90">
                  <Check className="h-3.5 w-3.5 shrink-0 text-[#91F9B3]" />
                  Confirmed in writing
                </p>
              </GlassCard>
            </Float>
          </TiltLayer>
        </Parallax>

        {/* Example privacy setting (furthest, thinnest glass) */}
        <Parallax speed={-0.03} above="lg" className="hidden lg:absolute lg:right-0 lg:top-[26.5rem] lg:block lg:w-[12.5rem]">
          <TiltLayer depth={0.5}>
            <Float amplitude={4} duration={10} delay={-7}>
              <GlassCard weight="thin" className="site-enter rounded-[18px] p-4" style={siteVars({ i: 8, y: "26px" })}>
                <p className="site-eyebrow text-[#91F9B3]">Example setting</p>
                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <span className="font-display text-[14px] font-semibold leading-tight tracking-[-0.01em]">Open to the right move</span>
                  <span className="relative h-5 w-[34px] shrink-0 rounded-full bg-[#16C172]">
                    <span className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.35)]" />
                  </span>
                </div>
                <p className="mt-2.5 flex items-start gap-1.5 text-[13px] leading-snug text-white/[0.84]">
                  <Lock className="mt-px h-3.5 w-3.5 shrink-0" />
                  Only Delta&apos;s recruiters see this.
                </p>
              </GlassCard>
            </Float>
          </TiltLayer>
        </Parallax>
      </div>
    </Tilt>
  );
}
