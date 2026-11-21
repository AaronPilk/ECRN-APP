/**
 * Motion primitives for the public site. Small, dependency-free client
 * components; the CSS half lives in app/(site)/site.css.
 *
 * All of them: animate only transform and opacity, pause off screen, do
 * nothing under prefers-reduced-motion, and never shift layout.
 */
export { Reveal, REVEAL_EVENT } from "./Reveal";
export { Parallax } from "./Parallax";
export { ScrollLine, ScrollLineStep } from "./ScrollLine";
export { CountUp } from "./CountUp";
export { Marquee } from "./Marquee";
export { Float, Tilt, TiltLayer } from "./Float";
export { siteVars } from "./vars";
