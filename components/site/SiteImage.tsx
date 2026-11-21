import type { CSSProperties } from "react";
import { cn } from "@/lib/utils/cn";
import { IMAGES, isImageName, type SiteImageMeta } from "@/lib/site-images";

/**
 * Responsive photo from lib/site-images.ts: AVIF first, WebP fallback, exact
 * width/height so nothing shifts while it loads, lazy unless `priority`.
 * While a photo is not ready (or the name is unknown) it renders a tinted
 * block of the same shape, so pages never break.
 *
 *   <SiteImage name="hero-jobsite-dusk" priority sizes="100vw" fill />
 *   <SiteImage name="crew-on-lift" sizes="(min-width: 1024px) 560px, 100vw" className="rounded-[24px]" />
 */
export function SiteImage({
  name,
  alt,
  sizes = "100vw",
  priority = false,
  fill = false,
  ratio,
  className,
  imgClassName,
  decorative = false,
}: {
  name: string;
  /** Overrides the manifest alt text. */
  alt?: string;
  sizes?: string;
  /** Above the fold: load eagerly with high priority (use on one image per page). */
  priority?: boolean;
  /** Cover the nearest positioned parent instead of taking its own space. */
  fill?: boolean;
  /** Force a crop, e.g. "16 / 9" or "4 / 5". Defaults to the photo's own shape. */
  ratio?: string;
  /** Classes for the wrapper (radius, shadow, size). */
  className?: string;
  /** Classes for the <img> itself. */
  imgClassName?: string;
  /** Purely decorative background: hidden from screen readers. */
  decorative?: boolean;
}) {
  const meta: SiteImageMeta | null = isImageName(name) ? IMAGES[name] : null;
  const color = meta?.color ?? "#0E1512";
  const wrapStyle: CSSProperties = fill
    ? { backgroundColor: color }
    : { backgroundColor: color, aspectRatio: ratio ?? (meta ? `${meta.width} / ${meta.height}` : "16 / 9") };
  const wrapClass = cn("overflow-hidden", fill ? "absolute inset-0" : "relative block w-full", className);

  if (!meta || !meta.ready || meta.widths.length === 0) {
    return (
      <span
        aria-hidden
        className={wrapClass}
        style={{
          ...wrapStyle,
          backgroundImage: "radial-gradient(120% 80% at 20% 10%, rgba(22,193,114,0.16), transparent 60%), radial-gradient(90% 70% at 90% 90%, rgba(6,85,206,0.22), transparent 65%)",
        }}
      />
    );
  }

  const srcSet = (ext: "avif" | "webp") => meta.widths.map((w) => `/img/${name}-${w}.${ext} ${w}w`).join(", ");
  const largest = meta.widths[meta.widths.length - 1];
  const fallback = meta.widths.find((w) => w >= 1280) ?? largest;

  return (
    <picture className={wrapClass} style={wrapStyle}>
      <source type="image/avif" srcSet={srcSet("avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet("webp")} sizes={sizes} />
      <img
        src={`/img/${name}-${fallback}.webp`}
        alt={decorative ? "" : alt ?? meta.alt}
        aria-hidden={decorative || undefined}
        width={meta.width}
        height={meta.height}
        loading={priority ? "eager" : "lazy"}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : undefined}
        className={cn("h-full w-full object-cover", imgClassName)}
        style={{ objectPosition: meta.focal ?? "50% 50%" }}
      />
    </picture>
  );
}
