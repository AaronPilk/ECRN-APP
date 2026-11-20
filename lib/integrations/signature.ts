/**
 * Request signing shared by both directions of the Staffing Referrals link.
 *
 *   signature = lowercase hex of HMAC-SHA256(raw request body, shared secret)
 *
 * ECRN sends it in `X-ECRN-Signature` on every outbound event and expects the
 * same header (or `X-Signature`) on every inbound event. Uses Web Crypto so it
 * runs on Cloudflare Workers.
 */

const encoder = new TextEncoder();

async function hmacKey(secret: string, usage: "sign" | "verify"): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, [usage]);
}

function toHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, "0");
  return out;
}

function fromHex(hex: string): ArrayBuffer | null {
  if (hex.length === 0 || hex.length % 2 !== 0 || /[^0-9a-f]/i.test(hex)) return null;
  const buffer = new ArrayBuffer(hex.length / 2);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < view.length; i++) view[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return buffer;
}

/** Hex HMAC-SHA256 of `body`. */
export async function signPayload(body: string, secret: string): Promise<string> {
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(secret, "sign"), encoder.encode(body));
  return toHex(new Uint8Array(sig));
}

/**
 * Check a signature header against the raw body. The comparison is done by
 * Web Crypto's `verify`, which is constant time. A leading "sha256=" is allowed.
 */
export async function verifySignature(body: string, secret: string, provided: string | null | undefined): Promise<boolean> {
  if (!provided || !secret) return false;
  const bytes = fromHex(provided.trim().replace(/^sha256=/i, ""));
  if (!bytes || bytes.byteLength !== 32) return false;
  try {
    return await crypto.subtle.verify("HMAC", await hmacKey(secret, "verify"), bytes, encoder.encode(body));
  } catch {
    return false;
  }
}

/** Constant-time comparison for short secrets such as a bearer token. */
export function safeEqual(a: string, b: string): boolean {
  const x = encoder.encode(a);
  const y = encoder.encode(b);
  let diff = x.length ^ y.length;
  const n = Math.max(x.length, y.length);
  for (let i = 0; i < n; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}
