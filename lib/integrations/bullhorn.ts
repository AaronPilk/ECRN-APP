import "server-only";
import type { InboundEvent } from "./inbound";

/**
 * Direct Bullhorn REST client. Inert until credentials exist.
 *
 * Today ECRN talks to Bullhorn through Staffing Referrals (see
 * ./staffing-referrals.ts and ./inbound.ts). This client is the second route:
 * if Delta gives ECRN its own Bullhorn API user, ECRN can read the team, jobs
 * and placements itself and push candidates and submissions. Everything it
 * reads is converted to the same `{ id, type, data }` events the webhook
 * receives, so it flows through `applyInboundEvent` with no extra mapping.
 *
 * Bullhorn's documented sign-in (bullhorn.github.io/rest-api-docs):
 *   1. GET  rest.bullhornstaffing.com/rest-services/loginInfo?username=…   → this company's oauthUrl + restUrl
 *   2. GET  {oauthUrl}/authorize?client_id&response_type=code&action=Login&username&password
 *                                                                          → redirect carrying ?code=…
 *      (or skip 1 and 2 with a stored refresh token)
 *   3. POST {oauthUrl}/token?grant_type=authorization_code&code&client_id&client_secret
 *                                                                          → access_token (10 min) + refresh_token
 *   4. POST {restUrl}/login?version=2.0&access_token=…                     → BhRestToken + the corp restUrl
 *   5. Every call: {restUrl}{path} with header `BhRestToken`
 *
 * Environment (set as hosting secrets, never committed):
 *   BULLHORN_CLIENT_ID, BULLHORN_CLIENT_SECRET     from Bullhorn Support (API key request)
 *   BULLHORN_USERNAME, BULLHORN_PASSWORD           the dedicated API user     ← preferred
 *   BULLHORN_REFRESH_TOKEN                         alternative to username + password
 *   BULLHORN_REDIRECT_URI                          only if one was registered with the API key
 *   BULLHORN_OAUTH_URL, BULLHORN_REST_URL          only to skip data-centre discovery
 *
 * CONFIRM AGAINST DELTA'S BULLHORN INSTANCE before relying on this (marked
 * "CONFIRM" below): field lists, status wording, custom field numbers, whether
 * the API user has accepted the terms of service (step 2 fails until it has),
 * and which entitlements the user holds. Nothing here has run against a live
 * Bullhorn account yet.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
type Json = Record<string, any>;

const LOGIN_INFO_URL = "https://rest.bullhornstaffing.com/rest-services/loginInfo";
const DEFAULT_OAUTH_URL = "https://auth.bullhornstaffing.com/oauth";
const DEFAULT_REST_URL = "https://rest.bullhornstaffing.com/rest-services";

export interface BullhornConfig {
  clientId: string;
  clientSecret: string;
  username: string | null;
  password: string | null;
  refreshToken: string | null;
  redirectUri: string | null;
  oauthUrl: string | null;
  restUrl: string | null;
}

export function getBullhornConfig(): BullhornConfig | null {
  const clientId = process.env.BULLHORN_CLIENT_ID;
  const clientSecret = process.env.BULLHORN_CLIENT_SECRET;
  const username = process.env.BULLHORN_USERNAME || null;
  const password = process.env.BULLHORN_PASSWORD || null;
  const refreshToken = process.env.BULLHORN_REFRESH_TOKEN || null;
  if (!clientId || !clientSecret) return null;
  if (!(username && password) && !refreshToken) return null;
  return {
    clientId,
    clientSecret,
    username,
    password,
    refreshToken,
    redirectUri: process.env.BULLHORN_REDIRECT_URI || null,
    oauthUrl: process.env.BULLHORN_OAUTH_URL || null,
    restUrl: process.env.BULLHORN_REST_URL || null,
  };
}

export function isBullhornConfigured(): boolean {
  return getBullhornConfig() !== null;
}

/** How ECRN would sign in, for the admin screen. */
export function bullhornAuthMode(): "password" | "refresh_token" | null {
  const cfg = getBullhornConfig();
  if (!cfg) return null;
  return cfg.username && cfg.password ? "password" : "refresh_token";
}

/**
 * Bullhorn refresh tokens are single use: each refresh returns a new one and
 * the old one stops working. With username + password that does not matter.
 * In refresh-token-only mode the newest token has to be kept somewhere that
 * outlives one request; ./bullhorn-sync.ts plugs in a store for that.
 */
export interface BullhornTokenStore {
  load(): Promise<string | null>;
  save(refreshToken: string): Promise<void>;
}
let tokenStore: BullhornTokenStore | null = null;
export function setBullhornTokenStore(store: BullhornTokenStore | null): void {
  tokenStore = store;
}

interface Session {
  restUrl: string;
  bhRestToken: string;
  expiresAt: number;
  refreshToken: string | null;
}
// Kept for the life of one Worker isolate. A fresh isolate simply signs in again.
let session: Session | null = null;

function query(params: Record<string, string | number | null | undefined>): string {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== null && v !== undefined && v !== "") q.set(k, String(v));
  return q.toString();
}

async function readJson(res: Response, what: string): Promise<Json> {
  const text = await res.text();
  if (!res.ok) throw new Error(`Bullhorn ${what} failed (HTTP ${res.status}): ${text.slice(0, 200)}`);
  try {
    return text ? (JSON.parse(text) as Json) : {};
  } catch {
    throw new Error(`Bullhorn ${what} did not return JSON.`);
  }
}

/** Step 1: which data centre this company lives in. */
async function discover(cfg: BullhornConfig): Promise<{ oauthUrl: string; restUrl: string }> {
  if (cfg.oauthUrl && cfg.restUrl) return { oauthUrl: cfg.oauthUrl.replace(/\/$/, ""), restUrl: cfg.restUrl.replace(/\/$/, "") };
  if (cfg.username) {
    const info = await readJson(await fetch(`${LOGIN_INFO_URL}?${query({ username: cfg.username })}`, { signal: AbortSignal.timeout(15000) }), "loginInfo");
    if (typeof info.oauthUrl === "string" && typeof info.restUrl === "string") {
      return { oauthUrl: info.oauthUrl.replace(/\/$/, ""), restUrl: info.restUrl.replace(/\/$/, "") };
    }
  }
  return { oauthUrl: (cfg.oauthUrl ?? DEFAULT_OAUTH_URL).replace(/\/$/, ""), restUrl: (cfg.restUrl ?? DEFAULT_REST_URL).replace(/\/$/, "") };
}

/** Step 2: sign in as the API user and read the code off the redirect. */
async function authorizationCode(oauthUrl: string, cfg: BullhornConfig): Promise<string> {
  const url = `${oauthUrl}/authorize?${query({
    client_id: cfg.clientId,
    response_type: "code",
    action: "Login",
    username: cfg.username,
    password: cfg.password,
    redirect_uri: cfg.redirectUri,
  })}`;
  const res = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(15000) });
  const location = res.headers.get("location") ?? "";
  const code = /[?&]code=([^&]+)/.exec(location)?.[1];
  if (!code) {
    // CONFIRM: a 200 with an HTML page here usually means wrong credentials, or the
    // API user has not accepted Bullhorn's terms of service yet (one manual login fixes it).
    throw new Error(`Bullhorn sign-in did not return a code (HTTP ${res.status}). Check the API user, its password, and that it has accepted the terms of service.`);
  }
  return decodeURIComponent(code);
}

/** Step 3. */
async function tokenRequest(oauthUrl: string, params: Record<string, string | null>): Promise<Json> {
  const res = await fetch(`${oauthUrl}/token?${query(params)}`, { method: "POST", signal: AbortSignal.timeout(15000) });
  const json = await readJson(res, "token request");
  if (typeof json.access_token !== "string") throw new Error("Bullhorn token request returned no access_token.");
  return json;
}

async function signIn(cfg: BullhornConfig): Promise<Session> {
  const dc = await discover(cfg);
  let token: Json | null = null;

  let stored: string | null = null;
  if (tokenStore) {
    try {
      stored = await tokenStore.load();
    } catch {
      stored = null;
    }
  }
  const refresh = session?.refreshToken ?? stored ?? cfg.refreshToken;
  if (refresh) {
    try {
      token = await tokenRequest(dc.oauthUrl, {
        grant_type: "refresh_token",
        refresh_token: refresh,
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
      });
    } catch (e) {
      if (!(cfg.username && cfg.password)) throw e; // no other way in
    }
  }
  if (!token) {
    const code = await authorizationCode(dc.oauthUrl, cfg);
    token = await tokenRequest(dc.oauthUrl, {
      grant_type: "authorization_code",
      code,
      client_id: cfg.clientId,
      client_secret: cfg.clientSecret,
      redirect_uri: cfg.redirectUri,
    });
  }
  const newRefresh = typeof token.refresh_token === "string" ? token.refresh_token : null;
  if (newRefresh && tokenStore) {
    try {
      await tokenStore.save(newRefresh);
    } catch {
      /* the session below still works; the next cold start falls back to username + password */
    }
  }

  // Step 4.
  const login = await readJson(
    await fetch(`${dc.restUrl}/login?${query({ version: "2.0", access_token: token.access_token as string })}`, {
      method: "POST",
      signal: AbortSignal.timeout(15000),
    }),
    "REST login"
  );
  if (typeof login.BhRestToken !== "string" || typeof login.restUrl !== "string") throw new Error("Bullhorn REST login returned no BhRestToken.");
  const lifetime = Math.min(Number(token.expires_in) || 600, 600);
  return {
    restUrl: login.restUrl.endsWith("/") ? login.restUrl : `${login.restUrl}/`,
    bhRestToken: login.BhRestToken,
    expiresAt: Date.now() + lifetime * 1000 - 30_000,
    refreshToken: newRefresh,
  };
}

async function getSession(cfg: BullhornConfig, force = false): Promise<Session> {
  if (!force && session && session.expiresAt > Date.now()) return session;
  session = await signIn(cfg);
  return session;
}

/**
 * Call the Bullhorn REST API, signing in first when needed and once more if the
 * session has expired. `path` is relative to the corp restUrl, for example
 * "query/JobOrder?where=isOpen=true&fields=id,title".
 *
 * Returns null (and makes no request) when Bullhorn is not configured.
 */
export async function bullhornFetch<T = Json>(path: string, init: RequestInit = {}): Promise<T | null> {
  const cfg = getBullhornConfig();
  if (!cfg) return null;
  for (let attempt = 0; attempt < 2; attempt++) {
    const s = await getSession(cfg, attempt > 0);
    const headers = new Headers(init.headers);
    headers.set("BhRestToken", s.bhRestToken);
    if (init.body && !headers.has("content-type")) headers.set("content-type", "application/json");
    const res = await fetch(s.restUrl + path.replace(/^\//, ""), { ...init, headers, signal: init.signal ?? AbortSignal.timeout(20000) });
    if (res.status === 401 && attempt === 0) {
      session = null;
      continue;
    }
    return (await readJson(res, path.split("?")[0])) as T;
  }
  throw new Error("Bullhorn: could not sign in.");
}

// ── Field lists ──────────────────────────────────────────────────────
// CONFIRM each list: an unknown field name makes Bullhorn reject the whole request.
const CORPORATE_USER_FIELDS =
  "id,firstName,lastName,name,email,mobile,phone,occupation,enabled,isDeleted,userType(id,name),primaryDepartment(id,name),reportToPerson(id)";
const JOB_ORDER_FIELDS =
  "id,title,status,isOpen,isPublic,isDeleted,employmentType,salary,salaryUnit,payRate,startDate,numOpenings,publicDescription," +
  "address(city,state,zip),owner(id,firstName,lastName,email),assignedUsers(id,firstName,lastName,email)," +
  "clientCorporation(id,name),publishedCategory(id,name),dateAdded,dateLastModified";
const PLACEMENT_FIELDS =
  "id,status,salary,salaryUnit,payRate,fee,dateBegin,dateEnd,employmentType,dateAdded,dateLastModified," +
  "candidate(id,firstName,lastName,email),jobOrder(id,title),jobSubmission(id)";

export interface PullOptions {
  /** Only records modified after this moment (epoch milliseconds or a Date). */
  since?: number | Date | null;
  start?: number;
  count?: number;
}

function sinceMs(since: PullOptions["since"]): number | null {
  if (since == null) return null;
  const ms = since instanceof Date ? since.getTime() : Number(since);
  return Number.isFinite(ms) && ms > 0 ? Math.floor(ms) : null;
}

/** Short content hash, so an unchanged record keeps the same event id and is ignored on the next pull. */
async function fingerprint(value: unknown): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(value)));
  return Array.from(new Uint8Array(digest).slice(0, 6))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Delta's team → `user.upserted` events. Empty when not configured. */
export async function pullCorporateUsers(opts: { start?: number; count?: number } = {}): Promise<InboundEvent[]> {
  const res = await bullhornFetch<{ data?: Json[] }>(
    `query/CorporateUser?${query({ where: "isDeleted=false", fields: CORPORATE_USER_FIELDS, orderBy: "id", start: opts.start ?? 0, count: opts.count ?? 200 })}`
  );
  if (!res) return [];
  const events: InboundEvent[] = [];
  for (const u of res.data ?? []) {
    events.push({ id: `bh:CorporateUser:${u.id}:${await fingerprint(u)}`, type: "user.upserted", data: u });
  }
  return events;
}

/**
 * Job orders → `job.upserted` events, oldest change first so a cursor can
 * follow `dateLastModified`. The first pull (no `since`) takes open jobs only.
 */
export async function pullJobOrders(opts: PullOptions = {}): Promise<InboundEvent[]> {
  const since = sinceMs(opts.since);
  const where = since ? `dateLastModified>${since}` : "isDeleted=false AND isOpen=true";
  const res = await bullhornFetch<{ data?: Json[] }>(
    `query/JobOrder?${query({ where, fields: JOB_ORDER_FIELDS, orderBy: "dateLastModified", start: opts.start ?? 0, count: opts.count ?? 50 })}`
  );
  if (!res) return [];
  return (res.data ?? []).map((j) => ({ id: `bh:JobOrder:${j.id}:${j.dateLastModified ?? 0}`, type: "job.upserted", data: j }));
}

/** Placements → `placement.updated` events, oldest change first. */
export async function pullPlacements(opts: PullOptions = {}): Promise<InboundEvent[]> {
  const since = sinceMs(opts.since);
  const res = await bullhornFetch<{ data?: Json[] }>(
    `query/Placement?${query({
      where: since ? `dateLastModified>${since}` : "id>0",
      fields: PLACEMENT_FIELDS,
      orderBy: "dateLastModified",
      start: opts.start ?? 0,
      count: opts.count ?? 50,
    })}`
  );
  if (!res) return [];
  return (res.data ?? []).map((p) => ({ id: `bh:Placement:${p.id}:${p.dateLastModified ?? 0}`, type: "placement.updated", data: p }));
}

/**
 * Create or update a Candidate in Bullhorn from the Bullhorn-shaped object
 * `toBullhorn` produces. Returns a `candidate.linked` event carrying the new
 * Bullhorn id, ready for `applyInboundEvent`. Null when not configured.
 *
 * CONFIRM: which customText / customInt fields Delta wants for career status,
 * confidential, move motivators, years of experience and LinkedIn. Until that
 * is agreed only standard fields are sent.
 */
export async function pushCandidate(payload: Json): Promise<InboundEvent | null> {
  if (!isBullhornConfigured()) return null;
  const body: Json = {
    firstName: payload.firstName,
    lastName: payload.lastName,
    name: [payload.firstName, payload.lastName].filter(Boolean).join(" "),
    email: payload.email ?? undefined,
    mobile: payload.mobile ?? undefined,
    occupation: payload.occupation ?? undefined,
    companyName: payload.companyName ?? undefined,
    address: payload.address ?? undefined,
    source: payload.source ?? "ECRN",
    externalID: payload.ecrnId ?? payload.externalID ?? undefined,
  };
  if (payload.owner?.id) body.owner = { id: payload.owner.id };
  const existingId = payload.id ?? null;
  const res = existingId
    ? await bullhornFetch<Json>(`entity/Candidate/${existingId}`, { method: "POST", body: JSON.stringify(body) })
    : await bullhornFetch<Json>("entity/Candidate", { method: "PUT", body: JSON.stringify({ ...body, status: "New Lead" }) });
  const id = res?.changedEntityId ?? existingId;
  if (!id) throw new Error("Bullhorn did not return a candidate id.");
  return { id: `bh:Candidate:${id}:linked`, type: "candidate.linked", data: { id, ecrnId: payload.ecrnId ?? null } };
}

/**
 * Create a JobSubmission in Bullhorn (an application or a job referral).
 * Needs the Bullhorn ids of the candidate and the job. Returns a
 * `submission.updated` event that links the ECRN record to the new submission
 * without changing its status. Null when not configured.
 *
 * CONFIRM: the status Delta wants for a new web response ("New Lead" here).
 */
export async function pushJobSubmission(payload: Json): Promise<InboundEvent | null> {
  if (!isBullhornConfigured()) return null;
  const candidateId = payload.candidate?.id ?? null;
  const jobOrderId = payload.jobOrder?.id ?? null;
  if (!candidateId || !jobOrderId) throw new Error("pushJobSubmission needs candidate.id and jobOrder.id (Bullhorn ids). Link the candidate and the job first.");
  const body: Json = {
    candidate: { id: candidateId },
    jobOrder: { id: jobOrderId },
    status: "New Lead",
    source: payload.via === "Referral" ? "ECRN Referral" : "ECRN",
    dateWebResponse: Date.now(),
  };
  if (payload.assignedRecruiter?.id) body.sendingUser = { id: payload.assignedRecruiter.id };
  const res = await bullhornFetch<Json>("entity/JobSubmission", { method: "PUT", body: JSON.stringify(body) });
  const id = res?.changedEntityId;
  if (!id) throw new Error("Bullhorn did not return a submission id.");
  return { id: `bh:JobSubmission:${id}:linked`, type: "submission.updated", data: { id, ecrnId: payload.ecrnId ?? null } };
}
