import "server-only";
import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";

/**
 * Shared pieces for the admin CSV exports (not a route: only `route.ts`
 * files are served). Every export is admin-only and reads the whole table
 * in chunks of 1,000 rows with `fetchAllRows` from `lib/admin/members`.
 */

/** A 403 response for anyone who is not a signed-in admin, otherwise null. */
export async function denyUnlessAdmin(): Promise<Response | null> {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/**
 * One CSV field (RFC 4180): quotes, commas and line breaks are wrapped in
 * double quotes with inner quotes doubled. Lists of text become "a; b",
 * other objects become JSON. Text that a spreadsheet would run as a formula
 * (it starts with = @ + or -) gets a leading apostrophe; plain phone numbers
 * such as "+1 (305) 555-0100" are left alone.
 */
export function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s: string;
  if (typeof v === "string") s = v;
  else if (typeof v === "number" || typeof v === "boolean" || typeof v === "bigint") s = String(v);
  else if (v instanceof Date) s = v.toISOString();
  else if (Array.isArray(v) && v.every((x) => typeof x === "string" || typeof x === "number")) s = v.join("; ");
  else s = JSON.stringify(v) ?? "";
  if (/^[=@\t\r]/.test(s) || (/^[+-]/.test(s) && !/^[+-]?[\d\s().-]+$/.test(s))) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(columns: string[], rows: Record<string, unknown>[]): string {
  const lines = [columns.map(csvCell).join(",")];
  for (const row of rows) lines.push(columns.map((c) => csvCell(row[c])).join(","));
  return `${lines.join("\r\n")}\r\n`;
}

/** `ecrn-<name>-<YYYY-MM-DD>.csv` as a download. The BOM makes Excel read accents correctly. */
export function csvDownload(name: string, columns: string[], rows: Record<string, unknown>[]): Response {
  const date = new Date().toISOString().slice(0, 10);
  return new Response(`﻿${toCsv(columns, rows)}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="ecrn-${name}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

export function exportFailed(name: string, e: unknown): Response {
  const detail = e instanceof Error ? e.message : "Unknown error";
  console.error(`[ECRN] ${name} export failed:`, detail);
  return NextResponse.json({ error: "Export failed", detail }, { status: 500 });
}

// ── small readers for raw database rows ──────────────────────────────

type Row = Record<string, unknown>;

/** An embedded relation comes back as an object, a one-item array, or null. */
export function embedded(v: unknown): Row | null {
  if (!v) return null;
  if (Array.isArray(v)) return (v[0] as Row | undefined) ?? null;
  return typeof v === "object" ? (v as Row) : null;
}

/** `relation(count)` comes back as `[{ count: n }]`. */
export function embeddedCount(v: unknown): number {
  const n = embedded(v)?.count;
  return typeof n === "number" ? n : 0;
}

export function fullName(r: Row | null | undefined): string | null {
  if (!r) return null;
  const name = [r.first_name, r.last_name].filter((x) => typeof x === "string" && x.trim()).join(" ");
  return name || null;
}
