/**
 * Admin email allowlist.
 *
 * Any signup whose email matches one of these is auto-promoted to `admin`.
 * Configured via NEXT_PUBLIC_ADMIN_EMAILS (comma-separated).
 *
 * Default: aaron@skyway.media (the project owner).
 */

export function getAdminEmails(): string[] {
  const raw = process.env.NEXT_PUBLIC_ADMIN_EMAILS ?? "aaron@skyway.media";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.toLowerCase().trim());
}
