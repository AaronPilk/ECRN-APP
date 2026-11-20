import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { fmtNum } from "@/components/admin/ui";

/** Previous / next links for lists that keep their page in the URL (?page=). */
export function Pager({
  page,
  pageCount,
  total,
  perPage,
  noun,
  hrefFor,
}: {
  page: number;
  pageCount: number;
  total: number;
  perPage: number;
  /** Plural, e.g. "applications". */
  noun: string;
  hrefFor: (page: number) => string;
}) {
  if (total === 0) return null;
  const first = (page - 1) * perPage + 1;
  const last = Math.min(total, page * perPage);
  const linkClass =
    "inline-flex h-9 items-center rounded-[10px] border border-ecrn-line bg-white px-3.5 text-[13px] font-medium text-ecrn-ink hover:bg-ecrn-paper";
  const offClass = "pointer-events-none opacity-40";
  return (
    <nav aria-label="Pages" className="flex flex-wrap items-center justify-between gap-3 text-[13px] text-ecrn-secondary">
      <p>
        Showing {fmtNum(first)} to {fmtNum(last)} of {fmtNum(total)} {noun}
      </p>
      {pageCount > 1 && (
        <div className="flex items-center gap-2">
          {page > 1 ? (
            <Link href={hrefFor(page - 1)} className={linkClass} rel="prev">
              Previous
            </Link>
          ) : (
            <span className={cn(linkClass, offClass)} aria-disabled="true">
              Previous
            </span>
          )}
          <span className="tabular-nums">
            Page {fmtNum(page)} of {fmtNum(pageCount)}
          </span>
          {page < pageCount ? (
            <Link href={hrefFor(page + 1)} className={linkClass} rel="next">
              Next
            </Link>
          ) : (
            <span className={cn(linkClass, offClass)} aria-disabled="true">
              Next
            </span>
          )}
        </div>
      )}
    </nav>
  );
}
