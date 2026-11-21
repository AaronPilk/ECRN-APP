/** Only allow local paths after authentication, including from email links. */
export function safeNext(value: unknown): string | null {
  if (typeof value !== "string") return null;
  if (!value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(value)) return null;
  return value;
}

/** Retired shared preview accounts must not keep the app in a demo session. */
export function isDemoEmail(email: unknown): boolean {
  return typeof email === "string" && email.toLowerCase().endsWith("@demo.goecrn.com");
}
