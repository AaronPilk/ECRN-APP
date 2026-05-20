/**
 * Console provider — V1 default for every channel.
 *
 * Logs the notification to stdout instead of actually sending anything.
 * Useful for development, and a safe fallback when a real provider
 * isn't configured.
 */

export async function logToConsole(payload: unknown): Promise<string> {
  // eslint-disable-next-line no-console
  console.log("[ECRN notification]", JSON.stringify(payload, null, 2));
  return `console_${Date.now()}`;
}
