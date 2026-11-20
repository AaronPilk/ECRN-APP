import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Small form and paging pieces shared by the Members and Activity screens.
 * Server-component safe: everything works through plain links and GET forms.
 */

/** Compact input / select for admin filter bars. */
export const fieldClass =
  "h-10 w-full rounded-[12px] border border-ecrn-line bg-white px-3 text-[13.5px] text-ecrn-ink placeholder:text-ecrn-secondary/60 focus:outline-none focus:border-ecrn-green focus:ring-2 focus:ring-ecrn-green/20";

/** A link that looks like the kit's small buttons (for downloads and navigation). */
export function linkButtonClass(variant: "secondary" | "dark" | "ghost" = "secondary"): string {
  return cn(
    "inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-[12px] px-3.5 text-[13.5px] font-medium transition-colors",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ecrn-green focus-visible:ring-offset-2",
    variant === "secondary" && "border border-ecrn-line bg-white text-ecrn-ink hover:bg-ecrn-paper",
    variant === "dark" && "bg-ecrn-black text-white hover:bg-ecrn-ink",
    variant === "ghost" && "text-ecrn-secondary hover:text-ecrn-ink"
  );
}

export function Field({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block min-w-0", className)}>
      <span className="mb-1 block text-[11.5px] font-medium uppercase tracking-wide text-ecrn-secondary">{label}</span>
      {children}
    </label>
  );
}

export function Select({
  name,
  value,
  options,
  placeholder,
}: {
  name: string;
  value: string;
  options: { value: string; label: string }[];
  /** Label for the empty "no filter" choice. */
  placeholder?: string;
}) {
  return (
    <select name={name} defaultValue={value} className={fieldClass}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** Date and time with the year, for audit rows. */
export function fmtStamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

/** "Showing 51 to 100 of 312" with previous / next links. `params` carries the current filters. */
export function Pagination({
  basePath,
  params,
  page,
  pageSize,
  total,
  noun,
}: {
  basePath: string;
  params: URLSearchParams;
  page: number;
  pageSize: number;
  total: number;
  noun: string;
}) {
  if (total <= 0) return null;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = Math.min(total, (page - 1) * pageSize + 1);
  const to = Math.min(total, page * pageSize);
  const href = (p: number) => {
    const next = new URLSearchParams(params);
    if (p > 1) next.set("page", String(p));
    else next.delete("page");
    const qs = next.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const off = "pointer-events-none opacity-40";
  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-ecrn-secondary">
      <span className="tabular-nums">
        Showing {from.toLocaleString("en-US")} to {to.toLocaleString("en-US")} of {total.toLocaleString("en-US")} {noun}
      </span>
      {pages > 1 && (
        <span className="flex items-center gap-2">
          <Link href={href(page - 1)} aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined} className={cn(linkButtonClass(), "h-9 px-3", page <= 1 && off)}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Link>
          <span className="tabular-nums">
            Page {page.toLocaleString("en-US")} of {pages.toLocaleString("en-US")}
          </span>
          <Link href={href(page + 1)} aria-disabled={page >= pages} tabIndex={page >= pages ? -1 : undefined} className={cn(linkButtonClass(), "h-9 px-3", page >= pages && off)}>
            Next <ChevronRight className="h-4 w-4" />
          </Link>
        </span>
      )}
    </nav>
  );
}
