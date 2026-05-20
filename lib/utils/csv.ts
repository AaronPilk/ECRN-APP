/**
 * Minimal CSV serializer. RFC 4180 compliant: wraps fields containing
 * commas, quotes, or newlines in double quotes and doubles any internal
 * double quotes.
 */

export function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    const s = typeof v === "string" ? v : JSON.stringify(v);
    if (/[",\n\r]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const header = columns.join(",");
  const body = rows
    .map((row) => columns.map((c) => escape(row[c])).join(","))
    .join("\n");

  return `${header}\n${body}\n`;
}

export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
