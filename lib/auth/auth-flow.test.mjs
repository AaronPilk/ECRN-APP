import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import test from "node:test";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const { NextRequest } = require("next/server");

// Exercise the actual TypeScript helpers with simulated Supabase replies;
// no accounts, network calls, or database writes are needed.
function loadSource(relativePath, mocks = {}) {
  const filename = fileURLToPath(new URL(relativePath, import.meta.url));
  const code = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (name) => Object.hasOwn(mocks, name) ? mocks[name] : require(name),
  }, { filename });
  return module.exports;
}

const redirects = loadSource("./redirect.ts");

function middleware({ claims = null, error = null, refresh = false } = {}) {
  const calls = { created: 0, claims: 0, signOut: 0 };
  const { updateSession } = loadSource("../supabase/middleware.ts", {
    "./env": { SUPABASE_URL: "https://project.supabase.co", SUPABASE_PUBLISHABLE_KEY: "test" },
    "@/lib/auth/redirect": redirects,
    "@supabase/ssr": {
      createServerClient(_url, _key, { cookies }) {
        calls.created++;
        return {
          auth: {
            async getClaims() {
              calls.claims++;
              if (refresh) cookies.setAll([
                { name: "session", value: "refreshed", options: { path: "/", httpOnly: true } },
              ], { "Cache-Control": "private, no-store", Pragma: "no-cache" });
              return { data: claims ? { claims } : null, error };
            },
            async signOut(options) {
              calls.signOut++;
              assert.equal(options.scope, "local");
              cookies.setAll([
                { name: "session", value: "", options: { path: "/", maxAge: 0 } },
              ], { "Cache-Control": "private, no-store" });
              return { error: null };
            },
          },
        };
      },
    },
  });
  return { updateSession, calls };
}

test("post-login destinations stay on ECRN, including malformed URL separators", () => {
  for (const path of ["/dashboard", "/jobs/123?apply=1", "/profile#resume"]) {
    assert.equal(redirects.safeNext(path), path);
  }
  for (const path of [null, [], "https://elsewhere.test", "//elsewhere.test", "/\\elsewhere.test", "/\n/elsewhere.test"]) {
    assert.equal(redirects.safeNext(path), null);
  }
});

test("native launch reaches /start without a redundant Auth call", async () => {
  const { updateSession, calls } = middleware();
  const result = await updateSession(new NextRequest("https://ecrn.test/", {
    headers: { "user-agent": "iPhone ECRNApp" },
  }));
  assert.equal(result.headers.get("location"), "https://ecrn.test/start");
  assert.equal(calls.created, 0);
  assert.match(result.headers.get("cache-control"), /no-store/);
});

test("signed-out private navigation preserves its destination and query", async () => {
  const { updateSession } = middleware();
  const result = await updateSession(new NextRequest("https://ecrn.test/candidate/apply?jobId=123"));
  const location = new URL(result.headers.get("location"));
  assert.equal(location.pathname, "/login");
  assert.equal(location.searchParams.get("next"), "/candidate/apply?jobId=123");
});

test("public jobs remain available without a session", async () => {
  const { updateSession } = middleware();
  const result = await updateSession(new NextRequest("https://ecrn.test/jobs"));
  assert.equal(result.headers.get("location"), null);
});

test("a refreshed session is forwarded to the render and the browser with private caching", async () => {
  const { updateSession, calls } = middleware({ claims: { sub: "member-id", email: "member@example.com" }, refresh: true });
  const request = new NextRequest("https://ecrn.test/dashboard");
  const result = await updateSession(request);
  assert.equal(result.headers.get("location"), null);
  assert.equal(request.cookies.get("session").value, "refreshed");
  assert.equal(result.cookies.get("session").value, "refreshed");
  assert.match(result.headers.get("cache-control"), /no-store/);
  assert.equal(calls.claims, 1);
  assert.equal(calls.signOut, 0);
});

test("auth error redirects retain cookie writes instead of looping on stale cookies", async () => {
  const { updateSession } = middleware({ error: { message: "Invalid token" }, refresh: true });
  const result = await updateSession(new NextRequest("https://ecrn.test/dashboard"));
  assert.equal(new URL(result.headers.get("location")).pathname, "/login");
  assert.equal(result.cookies.get("session").value, "refreshed");
});

test("an existing demo session is cleared and returns to the real login", async () => {
  const { updateSession, calls } = middleware({ claims: { sub: "demo-id", email: "partner@demo.goecrn.com" }, refresh: true });
  const result = await updateSession(new NextRequest("https://ecrn.test/dashboard"));
  assert.equal(new URL(result.headers.get("location")).pathname, "/login");
  assert.equal(calls.signOut, 1);
  assert.equal(result.cookies.get("session").value, "");
  assert.equal(result.cookies.get("session").maxAge, 0);
});

test("member and admin identity are read from verified claims and a fresh profile row", async () => {
  for (const role of ["referral_partner", "admin"]) {
    let lookedUp = null;
    const profile = { id: "verified-user", role, is_active: true };
    const client = {
      auth: { getClaims: async () => ({ data: { claims: { sub: profile.id, email: "member@example.com" } }, error: null }) },
      from(table) {
        assert.equal(table, "profiles");
        return { select: () => ({ eq: (column, id) => {
          assert.equal(column, "id");
          lookedUp = id;
          return { maybeSingle: async () => ({ data: profile }) };
        } }) };
      },
    };
    const session = loadSource("./session.ts", {
      "server-only": {},
      react: { cache: (fn) => fn },
      "next/navigation": {},
      "@/lib/supabase/server": { createSupabaseServerClient: async () => client },
      "@/lib/data/mappers": { toProfile: (row) => row },
      "./redirect": redirects,
    });
    assert.equal((await session.getCurrentProfile()).role, role);
    assert.equal(lookedUp, "verified-user");
    assert.equal(session.homeForRole(role), role === "admin" ? "/admin" : "/dashboard");
  }
});
