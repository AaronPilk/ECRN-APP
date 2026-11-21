import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Info, Lightbulb, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Block, BlogSource, Inline } from "@/lib/blog/types";
import "@/components/blog/content-blocks.css";

/**
 * Renders the shared content blocks (lib/blog/types.ts) for blog posts and
 * career pages. Server-component safe. Light surface: put it on white or paper.
 *
 * Phone first: one vertical rhythm for every block (content-blocks.css), tables
 * that become compact cards below 640 px, stats that size themselves to their
 * column, and 44 px targets on the small source marks.
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

const HOVER = "[@media(hover:hover)_and_(pointer:fine)]:hover:decoration-current";
const linkClass = cn("font-medium underline underline-offset-[3px]", HOVER);
const linkTone = {
  light: "text-ecrn-green-text decoration-ecrn-green/40",
  dark: "text-[#91F9B3] decoration-[#91F9B3]/40",
};

/**
 * Superscript link to an entry in the page's source list. Looks like a plain
 * [n]; the link's invisible padding (cancelled by negative margins) makes it a
 * 44 px target. When two marks touch ("[1][3]"), the padding between them is
 * split so each keeps its own half.
 */
export function SourceMark({ id, prev = false, next = false, className }: { id: number; prev?: boolean; next?: boolean; className?: string }) {
  const pad = prev && next ? "-mx-px px-px" : next ? "-ml-4 -mr-px pl-4 pr-px" : prev ? "-ml-[3px] -mr-4 pl-[3px] pr-4" : "-mx-4 px-4";
  return (
    <sup className={cn("ml-0.5 text-[length:min(0.7em,12.5px)] font-normal not-italic tracking-normal", className)}>
      {/* Word joiner: the mark never wraps onto a line of its own, away from the words it sources. */}
      {"\u2060"}
      <a
        href={`#source-${id}`}
        aria-label={`Source ${id}`}
        className={cn("cb-mark py-[17px] text-ecrn-green-text no-underline [@media(hover:hover)_and_(pointer:fine)]:hover:underline", pad)}
      >
        [{id}]
      </a>
    </sup>
  );
}

/**
 * **bold**, *italic*, [text](href) and [^n] source marks. Everything else is
 * plain text. `tone: "dark"` colours links for a dark panel.
 */
export function renderInline(text: Inline, opts: { tone?: "light" | "dark" } = {}): ReactNode[] {
  const tone = opts.tone ?? "light";
  const matches = [...text.matchAll(INLINE)];
  const out: ReactNode[] = [];
  let last = 0;
  matches.forEach((m, i) => {
    const at = m.index ?? 0;
    if (at > last) out.push(text.slice(last, at));
    if (m[1]) {
      const before = matches[i - 1];
      const after = matches[i + 1];
      const prev = Boolean(before?.[1]) && (before.index ?? 0) + before[0].length === at;
      const next = Boolean(after?.[1]) && after.index === at + m[0].length;
      out.push(<SourceMark key={i} id={Number(m[1])} prev={prev} next={next} />);
    } else if (m[2]) {
      out.push(
        <strong key={i} className={cn("font-semibold", tone === "dark" ? "text-white" : "text-ecrn-ink")}>
          {m[2]}
        </strong>
      );
    } else if (m[3]) {
      out.push(<em key={i}>{m[3]}</em>);
    } else if (m[4] && m[5]) {
      const href = m[5];
      const cls = cn(linkClass, linkTone[tone]);
      out.push(
        href.startsWith("/") || href.startsWith("#") ? (
          <Link key={i} href={href} className={cls}>
            {m[4]}
          </Link>
        ) : (
          <a key={i} href={href} className={cls} target="_blank" rel="noopener">
            {m[4]}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        )
      );
    }
    last = at + m[0].length;
  });
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Inline markup removed: the text a reader sees, for measuring cells. */
function plain(text: Inline): string {
  return text
    .replace(/\[\^\d+\]/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, "$1")
    .trim();
}

/**
 * The site's green button, for labels that may be long (money page names run
 * to 50 characters): full width on phones with the arrow on the right edge, and
 * free to wrap onto a second line instead of pushing out of its panel.
 */
export const wrapButtonClass =
  "flex min-h-[52px] w-full items-center justify-between gap-3 rounded-[15px] px-5 py-3 text-left font-display text-[16px] font-semibold leading-[1.25] tracking-[-0.01em] text-ecrn-action-ink " +
  "bg-[linear-gradient(180deg,#4EE79A_0%,#16C172_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_0_0_1px_rgba(5,43,26,0.16),0_1px_2px_rgba(5,43,26,0.3),0_10px_28px_-12px_rgba(22,193,114,0.65)] " +
  "transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] motion-reduce:transition-none sm:inline-flex sm:w-auto sm:justify-center sm:px-6";

const CALLOUT = {
  info: { icon: Info, box: "bg-delta-surface border-[#C9DEFA]", ink: "text-navy" },
  tip: { icon: Lightbulb, box: "bg-ecrn-action-surface border-[#B5EBCB]", ink: "text-ecrn-green-text" },
  warning: { icon: TriangleAlert, box: "bg-amber-50 border-amber-200", ink: "text-amber-900" },
} as const;

export function ContentBlocks({ blocks, className }: { blocks: Block[]; className?: string }) {
  return (
    <div className={cn("cb text-[17px] leading-[1.6] text-[#2B3A32] md:text-[18px]", className)}>
      {blocks.map((b, i) => (
        <BlockView key={i} block={b} />
      ))}
    </div>
  );
}

const h2Class = "text-balance font-display text-[27px] font-semibold leading-[1.12] tracking-[-0.025em] text-ecrn-ink sm:text-[32px] sm:leading-[1.1]";
const h3Class = "text-balance font-display text-[20px] font-semibold leading-[1.25] tracking-[-0.015em] text-ecrn-ink sm:text-[21px]";

function BlockView({ block: b }: { block: Block }) {
  switch (b.type) {
    case "p":
      return <p className="text-pretty">{renderInline(b.text)}</p>;
    case "h2":
      return (
        <h2 id={b.id ?? slugify(b.text)} className={h2Class}>
          {b.text}
        </h2>
      );
    case "h3":
      return (
        <h3 id={b.id ?? slugify(b.text)} className={h3Class}>
          {b.text}
        </h3>
      );
    case "ul":
      return (
        <ul role="list" className="space-y-2.5">
          {b.items.map((it, i) => (
            <li key={i} className="relative pl-6 text-pretty">
              {/* Centred on the first line: half the line height, less half the dot. */}
              <span aria-hidden className="absolute left-[0.25em] top-[calc(0.8em-3px)] h-1.5 w-1.5 rounded-full bg-ecrn-green" />
              {renderInline(it)}
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol role="list" className="space-y-2.5">
          {b.items.map((it, i) => (
            <li key={i} className="relative pl-8 text-pretty">
              {/* Numbers right-aligned in their own column, tabular, so 9 and 10 line up. */}
              <span aria-hidden className="absolute left-0 top-0 w-[1.375rem] text-right font-semibold tabular-nums text-ecrn-green-text">
                {i + 1}.
              </span>
              {renderInline(it)}
            </li>
          ))}
        </ol>
      );
    case "table":
      return <TableBlock block={b} />;
    case "callout": {
      const t = CALLOUT[b.tone ?? "info"];
      const Icon = t.icon;
      return (
        <aside className={cn("cb-box flex gap-3 rounded-[16px] border px-[18px] py-4 text-[16px] sm:gap-3.5 sm:px-6 sm:py-5", t.box)}>
          {/* As tall as the first line, so the icon sits on it. */}
          <span aria-hidden className={cn("flex shrink-0 items-center", b.title ? "h-[1.4em]" : "h-[1.6em]")}>
            <Icon className={cn("h-[18px] w-[18px]", t.ink)} />
          </span>
          <div className={cn("min-w-0 leading-[1.6]", t.ink)}>
            {b.title && <p className="text-balance font-display font-semibold leading-[1.4]">{b.title}</p>}
            <p className={cn("text-pretty", b.title && "mt-1")}>{renderInline(b.text)}</p>
          </div>
        </aside>
      );
    }
    case "stats": {
      // Two-up on a 360 px phone only works when every value is short.
      const fit = b.items.every((s) => s.value.length <= 8);
      return (
        <div className="cb-box cb-stats-wrap">
          <dl className="cb-stats" data-count={b.items.length} data-fit={fit ? "" : undefined}>
            {b.items.map((s, i) => (
              <div key={i} className="cb-stat">
                <dt className="text-pretty">
                  {s.label}
                  {s.source != null && <SourceMark id={s.source} />}
                </dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      );
    }
    case "steps":
      return (
        <ol role="list" className="cb-box rounded-[18px] border border-ecrn-line bg-ecrn-paper px-[18px] sm:px-6">
          {b.items.map((s, i) => (
            <li key={i} className="grid grid-cols-[1.25rem_minmax(0,1fr)] items-baseline gap-x-3.5 border-t border-ecrn-line py-[18px] first:border-t-0 sm:grid-cols-[1.5rem_minmax(0,1fr)] sm:gap-x-4 sm:py-5">
              <span aria-hidden className="text-right font-display text-[17px] font-semibold tabular-nums text-ecrn-green-text">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-balance font-display text-[17.5px] font-semibold leading-[1.3] tracking-[-0.012em] text-ecrn-ink">{s.title}</p>
                <p className="mt-1.5 text-pretty text-[16px] leading-[1.6]">{renderInline(s.text)}</p>
              </div>
            </li>
          ))}
        </ol>
      );
    case "cta":
      return (
        <aside className="cb-box rounded-[20px] bg-ecrn-black px-5 py-6 text-white sm:px-8 sm:py-7">
          <p className="text-balance font-display text-[21px] font-semibold leading-[1.2] tracking-[-0.02em]">{b.title}</p>
          <p className="mt-2 max-w-xl text-pretty text-[16px] leading-[1.6] text-white/75">{renderInline(b.text, { tone: "dark" })}</p>
          <Link href={b.href} className={cn(wrapButtonClass, "mt-5")}>
            <span>{b.label}</span>
            <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
          </Link>
        </aside>
      );
  }
}

// ─────────────────────────────────────────────────────────────────────
// Tables
// ─────────────────────────────────────────────────────────────────────

type TableBlockData = Extract<Block, { type: "table" }>;

/** A whole number, money, a percentage or a decimal, optionally with a unit: "$101,310", "+90.3%", "110.0", "7,481 MW". */
const NUMERIC = /^[-+−~]?\$?\d[\d,]*(\.\d+)?(%| ?[KMB]| ?MW)?$/;

interface TableLayout {
  /** Per column: right-align as a number in the desktop table. */
  numeric: boolean[];
  /** Per column: values short enough never to break across lines in the desktop table. */
  short: boolean[];
  /** Per column (from the second): share of the twelve-track card grid on phones. 12 = the full row. */
  spans: (4 | 6 | 12)[];
  /** Per column: a value on a row of its own, label left and value on the right edge (the value wraps under the label when both do not fit). */
  inline: boolean[];
  /** Label shown above each card title, when the first column is mostly numbers ("Period" over "1"). */
  titleLabel?: string;
  /** Three or more columns of sentences: cards on every screen, not only on phones. */
  stack: boolean;
  /** Row headings short enough to stay on one line in the desktop table. */
  firstShort: boolean;
  /** A long row heading (an occupation name) beside nothing but numbers: give it a third of the desktop table. */
  wideFirst: boolean;
}

/**
 * How each column sits in the phone cards, from its longest value:
 *   tiny (9 characters or fewer) and short (14 or fewer) values share a row:
 *     four tiny values go two by two, three or more in thirds, others in
 *     halves;
 *   a value left on its own, or a medium one (24 or fewer), gets its own row
 *     with the label beside it;
 *   anything longer takes the full row, label above.
 * The slots line up from card to card, so a long table scans like a column.
 */
function tableLayout(b: TableBlockData): TableLayout {
  const cols = b.head.length;
  const cells = (c: number) => b.rows.map((r) => plain(r[c] ?? ""));
  const numeric = Array.from({ length: cols }, (_, c) => c > 0 && cells(c).every((v) => NUMERIC.test(v)));
  const longest = (c: number) => Math.max(0, ...cells(c).map((v) => v.length));
  const width = (c: number): "tiny" | "short" | "medium" | "long" => {
    const max = longest(c);
    return max <= 9 ? "tiny" : max <= 14 ? "short" : max <= 24 ? "medium" : "long";
  };
  const widths = Array.from({ length: cols }, (_, c) => (c === 0 ? "long" : width(c)));
  const shares = (w: string) => w === "tiny" || w === "short";

  const spans: (4 | 6 | 12)[] = Array(cols).fill(12);
  const inline: boolean[] = Array(cols).fill(false);
  let c = 1;
  while (c < cols) {
    if (widths[c] === "long") {
      c++;
      continue;
    }
    if (widths[c] === "medium") {
      inline[c] = true;
      c++;
      continue;
    }
    let end = c;
    while (end < cols && shares(widths[end])) end++;
    const run = Array.from({ length: end - c }, (_, i) => c + i);
    const tiny = run.every((i) => widths[i] === "tiny");
    if (run.length === 1) {
      inline[run[0]] = true;
    } else if (tiny && (run.length === 3 || run.length >= 5)) {
      run.forEach((i) => (spans[i] = 4));
    } else {
      // Halves. An odd one out gets its own row, label beside the value.
      run.forEach((i, n) => {
        if (n === run.length - 1 && run.length % 2 === 1) inline[i] = true;
        else spans[i] = 6;
      });
    }
    c = end;
  }

  const digitFirst = cells(0).filter((v) => /^\d/.test(v)).length;
  const titleLabel = b.head[0] && b.rows.length > 0 && digitFirst * 2 >= b.rows.length ? b.head[0] : undefined;
  const short = widths.map((w, i) => i > 0 && shares(w));
  const stack = widths.filter((w, i) => i > 0 && w === "long").length >= 3;
  const firstLen = longest(0);
  const wideFirst = firstLen > 24 && cols > 2 && widths.slice(1).every(shares);
  return { numeric, short, spans, inline, titleLabel, stack, firstShort: firstLen <= 16, wideFirst };
}

function TableBlock({ block: b }: { block: TableBlockData }) {
  const layout = tableLayout(b);
  // Explicit roles keep the table semantics when phones restyle it as cards.
  return (
    <figure className="cb-box">
      <div className="cb-table-frame" data-stack={layout.stack ? "" : undefined} data-first={layout.wideFirst ? "" : undefined}>
        <table role="table" className="cb-table">
          {b.caption && <caption>{b.caption}</caption>}
          <thead role="rowgroup">
            <tr role="row">
              {b.head.map((h, i) => (
                <th key={i} role="columnheader" scope="col" data-num={layout.numeric[i] ? "" : undefined}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody role="rowgroup">
            {b.rows.map((row, r) => (
              <tr key={r} role="row">
                {row.map((cell, c) =>
                  c === 0 ? (
                    <th key={c} role="rowheader" scope="row" data-label={layout.titleLabel} data-short={layout.firstShort ? "" : undefined}>
                      {renderInline(cell)}
                    </th>
                  ) : (
                    <td
                      key={c}
                      role="cell"
                      data-label={b.head[c] || undefined}
                      data-span={layout.spans[c] === 12 ? undefined : layout.spans[c]}
                      data-inline={layout.inline[c] ? "" : undefined}
                      data-num={layout.numeric[c] ? "" : undefined}
                      data-short={layout.short[c] ? "" : undefined}
                    >
                      <span>{renderInline(cell)}</span>
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {b.note && <figcaption className="mt-2.5 text-pretty text-[13.5px] leading-[1.55] text-ecrn-secondary">{renderInline(b.note)}</figcaption>}
    </figure>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Sources
// ─────────────────────────────────────────────────────────────────────

/**
 * Numbered source list. Inline [^n] marks link here. Each title is a full-width
 * link row (44 px or taller); numbers sit right-aligned in their own column.
 */
export function SourcesList({ sources, className }: { sources: BlogSource[]; className?: string }) {
  if (!sources.length) return null;
  return (
    <section aria-labelledby="sources-heading" className={cn("mt-12 border-t border-ecrn-line pt-7", className)}>
      <h2 id="sources-heading" className="font-display text-[20px] font-semibold tracking-[-0.015em] text-ecrn-ink">
        Sources
      </h2>
      <ol role="list" className="mt-2">
        {sources.map((s) => (
          <li
            key={s.id}
            id={`source-${s.id}`}
            className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-baseline gap-x-2.5 border-b border-ecrn-line/70 py-3.5 text-[14.5px] leading-[1.55] text-ecrn-secondary last:border-b-0 sm:grid-cols-[2rem_minmax(0,1fr)] sm:gap-x-3"
          >
            <span className="text-right font-mono text-[12.5px] tabular-nums text-ecrn-green-text">[{s.id}]</span>
            <div className="min-w-0">
              <p className="text-[13px] leading-[1.4]">{s.publisher}</p>
              <a
                href={s.url}
                target="_blank"
                rel="noopener"
                className="flex min-h-[44px] items-center py-1.5 font-medium leading-[1.4] text-ecrn-ink underline decoration-ecrn-line underline-offset-[3px] [@media(hover:hover)_and_(pointer:fine)]:hover:decoration-ecrn-green"
              >
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  {s.title}
                  <span className="sr-only"> (opens in a new tab)</span>
                  <ArrowUpRight aria-hidden className="ml-1 inline h-3.5 w-3.5 align-[-2px] text-ecrn-secondary" />
                </span>
              </a>
              <p className="text-pretty">
                Accessed {formatDay(s.accessed)}.{s.note ? ` ${s.note}` : ""}
              </p>
            </div>
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
