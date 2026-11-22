// Kaiyori public REST API — runs on Cloudflare Workers for /api/* only.
// Everything else on kamllistos.com is served as static files.
// Read-only by design: GET/HEAD/OPTIONS only, no user data, no secrets, strict input validation.
interface Env {
  ASSETS: { fetch(req: Request | string): Promise<Response> };
}

const SITE = "https://kamllistos.com";

const HEADERS: Record<string, string> = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=300",
  // Public, read-only data: any website may read it.
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  // JSON responses never need to load or frame anything.
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body, null, 2), { status, headers: { ...HEADERS, ...extra } });

const error = (status: number, code: string, message: string, extra: Record<string, string> = {}) =>
  json({ error: { code, message } }, status, { ...extra, "Cache-Control": "no-store" });

// Parse an integer query param within [min, max]; returns null if invalid.
function intParam(value: string | null, fallback: number, min: number, max: number): number | null {
  if (value === null) return fallback;
  if (!/^\d{1,4}$/.test(value)) return null;
  const n = Number(value);
  return n >= min && n <= max ? n : null;
}

async function readChangelog(env: Env, origin: string) {
  const res = await env.ASSETS.fetch(new Request(`${origin}/changelog.json`));
  if (!res.ok) return { updated: null, changes: [] as Array<Record<string, string>> };
  return (await res.json()) as { updated: string | null; changes: Array<Record<string, string>> };
}

const ENDPOINTS = [
  { method: "GET", path: "/api/health", description: "Service status and current version." },
  { method: "GET", path: "/api/changelog?limit=20", description: "Recent site changes from Git history (limit 1–100)." },
];

async function route(req: Request, env: Env): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (path === "/api") {
    return json({ name: "Kaiyori API", docs: `${SITE}/docs/rest-api/`, openapi: `${SITE}/openapi.json`, endpoints: ENDPOINTS });
  }

  if (path === "/api/health") {
    const { changes } = await readChangelog(env, url.origin);
    return json({ status: "ok", version: changes[0]?.short ?? null, time: new Date().toISOString() }, 200, { "Cache-Control": "no-store" });
  }

  if (path === "/api/changelog") {
    const limit = intParam(url.searchParams.get("limit"), 20, 1, 100);
    if (limit === null) return error(400, "invalid_limit", "limit must be a whole number from 1 to 100.");
    const { updated, changes } = await readChangelog(env, url.origin);
    const daysSince = updated ? Math.floor((Date.now() - Date.parse(updated)) / 864e5) : null;
    return json({ updated, daysSince, count: Math.min(limit, changes.length), changes: changes.slice(0, limit) });
  }

  return error(404, "not_found", "No such endpoint. See /api for the list.");
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: HEADERS });
    if (req.method !== "GET" && req.method !== "HEAD") {
      return error(405, "method_not_allowed", "This API is read-only.", { Allow: "GET, HEAD, OPTIONS" });
    }
    try {
      const res = await route(req, env);
      return req.method === "HEAD" ? new Response(null, { status: res.status, headers: res.headers }) : res;
    } catch {
      // Never leak stack traces or internals.
      return error(500, "internal_error", "Something went wrong. Please try again later.");
    }
  },
};
