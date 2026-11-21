/**
 * Photo manifest for the public site. Files live in /public/img as
 *   <name>-<width>.avif and <name>-<width>.webp   (one pair per width)
 *   <name>-og.jpg                                 (1200×630 share image)
 * Render them with <SiteImage name="…" /> (components/site/SiteImage.tsx),
 * which never shifts layout and shows a tinted placeholder until `ready`.
 *
 * Every photo here was generated for ECRN (no stock, no third-party rights).
 * They are illustrative: none shows a real ECRN member, client or job site.
 */

export interface SiteImageMeta {
  /** Describes what is in the picture, for screen readers and image search. */
  alt: string;
  /** Pixel size of the largest file (sets the aspect ratio). */
  width: number;
  height: number;
  /** Widths that exist on disk, smallest first. */
  widths: number[];
  /** Dominant dark colour, shown while the file loads. */
  color: string;
  /** CSS object-position for crops (default "50% 50%"). */
  focal?: string;
  /** False until the files are in /public/img. */
  ready: boolean;
}

/** Entry for a new slot whose photo has not been made yet (every slot below is ready). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const pending = (alt: string, width: number, height: number): SiteImageMeta => ({
  alt,
  width,
  height,
  widths: [],
  color: "#0E1512",
  ready: false,
});

export const IMAGES = {
  // ── Site ──────────────────────────────────────────────────────────
  "hero-jobsite-dusk": {
    alt: "Two electricians walking onto a commercial construction site at dusk, with cable reels in the foreground and a tower crane behind",
    width: 2560,
    height: 1440,
    widths: [480, 768, 1024, 1440, 1920, 2560],
    color: "#202B2D",
    focal: "58% 50%",
    ready: true,
  },
  "crew-on-lift": {
    alt: "Two electricians in white hard hats and harnesses on a scissor lift, seen from behind, fitting overhead cable tray in a dark building lit by work lights",
    width: 2528,
    height: 1685,
    widths: [480, 768, 1024, 1440, 1920, 2528],
    color: "#1D1E19",
    focal: "76% 50%",
    ready: true,
  },
  "switchgear-room": {
    alt: "Two facing lineups of gray switchgear with breaker handles and indicator lights in a new electrical room, with cable tray overhead and a polished concrete floor",
    width: 2528,
    height: 1685,
    widths: [480, 768, 1024, 1440, 1920, 2528],
    color: "#313E3C",
    focal: "50% 50%",
    ready: true,
  },
  "data-center-hall": {
    alt: "Two people in hard hats and hi-vis vests walk through a large data center hall under construction, past wrapped cabinets and under long runs of cable tray",
    width: 2560,
    height: 1440,
    widths: [480, 768, 1024, 1440, 1920, 2560],
    color: "#222D2C",
    focal: "50% 60%",
    ready: true,
  },
  "substation-sunset": {
    alt: "Steel gantries, insulators and power lines of a high-voltage substation silhouetted against a deep blue and orange sky just after sunset",
    width: 2560,
    height: 1440,
    widths: [480, 768, 1024, 1440, 1920, 2560],
    color: "#191F21",
    focal: "70% 60%",
    ready: true,
  },
  "conduit-racks": {
    alt: "Parallel runs of galvanized steel conduit clamped to a strut rack, receding into the distance inside an industrial building under construction",
    width: 2528,
    height: 1685,
    widths: [480, 768, 1024, 1440, 1920, 2528],
    color: "#1F2421",
    focal: "62% 50%",
    ready: true,
  },
  "tower-crane-skyline": {
    alt: "A concrete high-rise under construction with its upper floors lit and a tower crane above it, against a deep blue evening sky over a city skyline",
    width: 2560,
    height: 1440,
    widths: [480, 768, 1024, 1440, 1920, 2560],
    color: "#1E3236",
    focal: "75% 45%",
    ready: true,
  },
  "foreman-plans": {
    alt: "A foreman in a white hard hat and orange hi-vis vest, seen from behind, holds a set of drawings open in front of a building under construction at dusk",
    width: 1843,
    height: 2304,
    widths: [480, 768, 1024, 1440, 1843],
    color: "#1E221F",
    focal: "62% 40%",
    ready: true,
  },
  "handshake-site": {
    alt: "Two workers in hi-vis jackets shake hands in worn leather work gloves, with a steel building frame and work lights out of focus behind them at dusk",
    width: 2528,
    height: 1685,
    widths: [480, 768, 1024, 1440, 1920, 2528],
    color: "#20231F",
    focal: "52% 68%",
    ready: true,
  },
  "site-office-plans": {
    alt: "A white hard hat, rolled drawings, a scale ruler, a tablet and a coffee mug on a plywood table in a site office at dusk, with site work lights outside the window",
    width: 2528,
    height: 1685,
    widths: [480, 768, 1024, 1440, 1920, 2528],
    color: "#242721",
    focal: "68% 60%",
    ready: true,
  },
  "estimating-desk": {
    alt: "An estimator's desk in the evening with drawing sheets, a scale ruler, a pencil, a highlighter and a calculator, and two monitors showing line drawings behind",
    width: 2528,
    height: 1685,
    widths: [480, 768, 1024, 1440, 1920, 2528],
    color: "#2E312E",
    focal: "62% 60%",
    ready: true,
  },
  "office-overlook-night": {
    alt: "A dark office with an empty chair and drawings on a table, looking through a glass wall at a lit construction site and tower crane at night",
    width: 2528,
    height: 1685,
    widths: [480, 768, 1024, 1440, 1920, 2528],
    color: "#121514",
    focal: "58% 58%",
    ready: true,
  },
  // ── Blog covers ───────────────────────────────────────────────────
  "cover-referral-bonuses": {
    alt: "Two people shake hands over a table with a set of construction drawings and a white hard hat, one in an orange hi-vis jacket and one in a navy work jacket",
    width: 1920,
    height: 1080,
    widths: [480, 768, 1024, 1440, 1920],
    color: "#2F2922",
    focal: "52% 55%",
    ready: true,
  },
  "cover-ecrn-legit": {
    alt: "A white hard hat and a clipboard with a blank sheet of paper and a pen on a plywood table, with a steel building frame out of focus at dusk",
    width: 1920,
    height: 1080,
    widths: [480, 768, 1024, 1440, 1920],
    color: "#25221D",
    focal: "70% 62%",
    ready: true,
  },
  "cover-refer-someone": {
    alt: "A hand in a leather work glove holds a phone with a dark screen on a construction site at dusk, with string work lights blurred behind",
    width: 1920,
    height: 1080,
    widths: [480, 768, 1024, 1440, 1920],
    color: "#1C2925",
    focal: "66% 42%",
    ready: true,
  },
  "cover-three-paths": {
    alt: "Three runs of steel conduit rise together up a concrete wall, then one bends left, one carries straight on and one bends right",
    width: 1920,
    height: 1080,
    widths: [480, 768, 1024, 1440, 1920],
    color: "#373931",
    focal: "64% 45%",
    ready: true,
  },
  "cover-pm-salary": {
    alt: "A project manager in a white hard hat and hi-vis vest, seen from behind on an upper floor, holds a set of drawings and looks out over a job site and city at dusk",
    width: 1920,
    height: 1080,
    widths: [480, 768, 1024, 1440, 1920],
    color: "#161F20",
    focal: "72% 50%",
    ready: true,
  },
  "cover-electrician-pay": {
    alt: "An electrician in a hard hat, safety glasses, gloves and a hi-vis vest works at an electrical panel in an unfinished commercial building, lit by a work light",
    width: 1920,
    height: 1080,
    widths: [480, 768, 1024, 1440, 1920],
    color: "#1A1D17",
    focal: "72% 55%",
    ready: true,
  },
  "cover-foreman-superintendent": {
    alt: "A white hard hat and a yellow hard hat side by side on the lowered tailgate of a pickup truck, with a steel building frame behind at dusk",
    width: 1920,
    height: 1080,
    widths: [480, 768, 1024, 1440, 1920],
    color: "#1D231C",
    focal: "72% 52%",
    ready: true,
  },
  "cover-electrician-shortage": {
    alt: "Three hard hats hang on a row of wall hooks in a site trailer, with five hooks left empty",
    width: 1920,
    height: 1080,
    widths: [480, 768, 1024, 1440, 1920],
    color: "#2F3027",
    focal: "33% 50%",
    ready: true,
  },
  "cover-data-centers": {
    alt: "A long row of new gray electrical cabinets, some still in protective wrap, under cable tray in a data center under construction",
    width: 1920,
    height: 1080,
    widths: [480, 768, 1024, 1440, 1920],
    color: "#28322F",
    focal: "62% 50%",
    ready: true,
  },
  "cover-confidential-search": {
    alt: "Seen from the back seat, a construction worker in a parked truck at dusk looks down at a phone, with a white hard hat on the dashboard and a job site ahead",
    width: 1920,
    height: 1080,
    widths: [480, 768, 1024, 1440, 1920],
    color: "#091617",
    focal: "40% 50%",
    ready: true,
  },
  "cover-resume": {
    alt: "A printed page beside a white hard hat, safety glasses, pliers, wire strippers and a screwdriver on a wooden workbench",
    width: 1920,
    height: 1080,
    widths: [480, 768, 1024, 1440, 1920],
    color: "#1C1B17",
    focal: "68% 55%",
    ready: true,
  },
  "cover-recruiters-worth-it": {
    alt: "An empty chair across a bare table in a site office in the evening, with drawings pinned to the wall behind and a desk lamp on the right",
    width: 1920,
    height: 1080,
    widths: [480, 768, 1024, 1440, 1920],
    color: "#191D18",
    focal: "75% 60%",
    ready: true,
  },
} satisfies Record<string, SiteImageMeta>;

export type ImageName = keyof typeof IMAGES;

export function isImageName(name: string): name is ImageName {
  return Object.prototype.hasOwnProperty.call(IMAGES, name);
}

/** Share image (1200×630) for a photo, or null while it is not ready. */
export function ogImagePath(name: string): string | null {
  return isImageName(name) && IMAGES[name].ready ? `/img/${name}-og.jpg` : null;
}
