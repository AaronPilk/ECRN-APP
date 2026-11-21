import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Info, Lightbulb, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Block, BlogSource, Inline } from "@/lib/blog/types";

/**
 * Renders the shared content blocks (lib/blog/types.ts) for blog posts and
 * career pages. Server-component safe. Light surface: put it on white or paper.
 */

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

/** Headings in document order, for a table of contents. */
export function headingsOf(blocks: Block[]): Heading[] {
  const out: Heading[] = [];
  for (const b of blocks) {
    if (b.type === "h2" || b.type === "h3") out.push({ id: b.id ?? slugify(b.text), text: b.text, level: b.type === "h2" ? 2 : 3 });
  }
  return out;
}

const INLINE = /\[\^(\d+)\]|\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;

const linkClass = "font-medium text-ecrn-green-text underline decoration-ecrn-green/40 underline-offset-[3px] hover:decoration-ecrn-green";

/** **bold**, *italic*, [text](href) and [^n] source marks. Everything else is plain text. */
export function renderInline(text: Inline): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of text.matchAll(INLINE)) {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    if (m[1]) {
      out.push(
        <sup key={key++} className="ml-0.5 text-[0.7em]">
          <a href={`#source-${m[1]}`} className="text-ecrn-green-text no-underline hover:underline" aria-label={`Source ${m[1]}`}>
            [{m[1]}]
          </a>
        </sup>
      );
    } else if (m[2]) {
      out.push(
        <strong key={key++} className="font-semibold text-ecrn-ink">
          {m[2]}
        </strong>
      );
    } else if (m[3]) {
      out.push(<em key={key++}>{m[3]}</em>);
    } else if (m[4] && m[5]) {
      const href = m[5];
      out.push(
        href.startsWith("/") || href.startsWith("#") ? (
          <Link key={key++} href={href} className={linkClass}>
            {m[4]}
          </Link>
        ) : (
          <a key={key++} href={href} className={linkClass} target="_blank" rel="noopener">
            {m[4]}
          </a>
        )
      );
    }
    last = at + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const CALLOUT = {
  info: { icon: Info, box: "bg-delta-surface border-[#C9DEFA]", ink: "text-navy" },
  tip: { icon: Lightbulb, box: "bg-ecrn-action-surface border-[#B5EBCB]", ink: "text-ecrn-green-text" },
  warning: { icon: TriangleAlert, box: "bg-amber-50 border-amber-200", ink: "text-amber-900" },
} as const;

export function ContentBlocks({ blocks, className }: { blocks: Block[]; className?: string }) {
  return (
    <div className={cn("content-prose text-[17px] leading-[1.72] text-[#2B3A32]", className)}>
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
    </div>
  );
}

function BlockView({ block: b }: { block: Block }) {
  switch (b.type) {
    case "p":
      return <p className="mt-5 first:mt-0">{renderInline(b.text)}</p>;
    case "h2":
      return (
        <h2 id={b.id ?? slugify(b.text)} className="mt-12 scroll-mt-28 font-display text-[28px] leading-[1.15] font-semibold tracking-[-0.025em] text-ecrn-ink first:mt-0 sm:text-[32px]">
          {b.text}
        </h2>
      );
    case "h3":
      return (
        <h3 id={b.id ?? slugify(b.text)} className="mt-8 scroll-mt-28 font-display text-[21px] leading-[1.25] font-semibold tracking-[-0.015em] text-ecrn-ink">
          {b.text}
        </h3>
      );
    case "ul":
      return (
        <ul className="mt-5 space-y-2.5 pl-1">
          {b.items.map((it, i) => (
            <li key={i} className="relative pl-6">
              <span aria-hidden className="absolute left-1 top-[0.72em] h-1.5 w-1.5 rounded-full bg-ecrn-green" />
              {renderInline(it)}
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="mt-5 space-y-2.5 pl-1 [counter-reset:item]">
          {b.items.map((it, i) => (
            <li key={i} className="relative pl-8 [counter-increment:item] before:absolute before:left-0 before:top-0 before:font-mono before:text-[13px] before:leading-[1.72rem] before:text-ecrn-green-text before:content-[counter(item,decimal-leading-zero)]">
              {renderInline(it)}
            </li>
          ))}
        </ol>
      );
    case "table":
      return (
        <figure className="mt-7">
          <div className="overflow-x-auto rounded-[16px] border border-ecrn-line bg-white">
            <table className="w-full min-w-[480px] text-left text-[15px] leading-snug">
              {b.caption && <caption className="caption-top border-b border-ecrn-line px-4 py-3 text-left font-display text-[15px] font-semibold text-ecrn-ink">{b.caption}</caption>}
              <thead className="bg-ecrn-paper text-[12px] uppercase tracking-[0.06em] text-ecrn-secondary">
                <tr>
                  {b.head.map((h, i) => (
                    <th key={i} scope="col" className="px-4 py-3 font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-ecrn-line">
                {b.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) =>
                      c === 0 ? (
                        <th key={c} scope="row" className="px-4 py-3 align-top font-medium text-ecrn-ink">
                          {renderInline(cell)}
                        </th>
                      ) : (
                        <td key={c} className="px-4 py-3 align-top tabular-nums">
                          {renderInline(cell)}
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {b.note && <figcaption className="mt-2 text-[13.5px] leading-relaxed text-ecrn-secondary">{renderInline(b.note)}</figcaption>}
        </figure>
      );
    case "callout": {
      const t = CALLOUT[b.tone ?? "info"];
      const Icon = t.icon;
      return (
        <aside className={cn("mt-7 flex gap-3.5 rounded-[16px] border px-5 py-4", t.box)}>
          <Icon className={cn("mt-1 h-5 w-5 shrink-0", t.ink)} aria-hidden />
          <div className={cn("text-[16px] leading-relaxed", t.ink)}>
            {b.title && <p className="font-display font-semibold">{b.title}</p>}
            <p className={b.title ? "mt-1" : undefined}>{renderInline(b.text)}</p>
          </div>
        </aside>
      );
    }
    case "stats":
      return (
        <dl className={cn("mt-7 grid gap-3", b.items.length >= 4 ? "sm:grid-cols-2 lg:grid-cols-4" : b.items.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
          {b.items.map((s, i) => (
            <div key={i} className="rounded-[16px] border border-ecrn-line bg-white px-5 py-4">
              <dd className="font-display text-[30px] font-semibold leading-none tracking-[-0.03em] text-ecrn-ink tabular-nums">{s.value}</dd>
              <dt className="mt-2 text-[14px] leading-snug text-ecrn-secondary">
                {s.label}
                {s.source != null && (
                  <sup className="ml-0.5 text-[0.75em]">
                    <a href={`#source-${s.source}`} className="text-ecrn-green-text hover:underline" aria-label={`Source ${s.source}`}>
                      [{s.source}]
                    </a>
                  </sup>
                )}
              </dt>
            </div>
          ))}
        </dl>
      );
    case "steps":
      return (
        <ol className="mt-7 space-y-3">
          {b.items.map((s, i) => (
            <li key={i} className="flex gap-4 rounded-[16px] border border-ecrn-line bg-white px-5 py-4">
              <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ecrn-action-surface font-mono text-[13px] text-ecrn-green-text">
                {i + 1}
              </span>
              <div>
                <p className="font-display text-[18px] font-semibold leading-snug text-ecrn-ink">{s.title}</p>
                <p className="mt-1 text-[16px] leading-relaxed">{renderInline(s.text)}</p>
              </div>
            </li>
          ))}
        </ol>
      );
    case "cta":
      return (
        <aside className="mt-9 overflow-hidden rounded-[20px] bg-ecrn-black px-6 py-6 text-white sm:px-8 sm:py-7">
          <p className="font-display text-[22px] font-semibold leading-tight tracking-[-0.02em]">{b.title}</p>
          <p className="mt-2 max-w-xl text-[16px] leading-relaxed text-white/75">{renderInline(b.text)}</p>
          <Link
            href={b.href}
            className="mt-5 inline-flex h-[46px] items-center gap-1.5 rounded-[14px] border border-[#13B66B] bg-gradient-to-b from-ecrn-action-bright to-ecrn-green px-5 text-[15.5px] font-semibold text-ecrn-action-ink shadow-action"
          >
            {b.label} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </aside>
      );
  }
}

/** Numbered source list. Inline [^n] marks link here. */
export function SourcesList({ sources, className }: { sources: BlogSource[]; className?: string }) {
  if (!sources.length) return null;
  return (
    <section aria-labelledby="sources-heading" className={cn("mt-12 border-t border-ecrn-line pt-7", className)}>
      <h2 id="sources-heading" className="font-display text-[20px] font-semibold text-ecrn-ink">
        Sources
      </h2>
      <ol className="mt-4 space-y-2.5 text-[14.5px] leading-relaxed text-ecrn-secondary">
        {sources.map((s) => (
          <li key={s.id} id={`source-${s.id}`} className="flex scroll-mt-28 gap-2.5">
            <span className="shrink-0 font-mono text-[12.5px] leading-[1.6rem] text-ecrn-green-text">[{s.id}]</span>
            <span>
              {s.publisher}.{" "}
              <a href={s.url} className="text-ecrn-ink underline decoration-ecrn-line underline-offset-[3px] hover:decoration-ecrn-green" target="_blank" rel="noopener">
                {s.title}
              </a>
              . Accessed {formatDay(s.accessed)}.{s.note ? ` ${s.note}` : ""}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** "2026-11-20" → "November 20, 2026" (no time zone surprises). */
export function formatDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}
