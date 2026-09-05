import assert from "node:assert/strict";
import test from "node:test";
import { createTestDatabase } from "./helpers/d1.mjs";
import { importTypeScript } from "./helpers/typescript.mjs";
import worker from "../dist/server/index.js";

const { readBoundedBody } = await importTypeScript("worker/request-body.ts");
const { reserveVerification, reserveDelivery } = await importTypeScript("worker/contact-limits.ts");
const ctx = { waitUntil() {}, passThroughOnException() {} };
const payload = { name: "Example Visitor", email: "visitor@example.test", message: "Please contact me about a platform engineering project.", company: "", recaptchaToken: "test-token" };
const verified = { success: true, hostname: "surakshithsuvarna.com", action: "portfolio_contact", score: 0.9 };

function fixture(t) {
  const DB = createTestDatabase();
  t.after(() => DB.sqlite.close());
  return { DB, RECAPTCHA_SECRET_KEY: "fake-secret", RESEND_API_KEY: "fake-key", CONTACT_TO: "recipient@example.test", CONTACT_FROM: "sender@example.test" };
}
function request(body = JSON.stringify(payload), extraHeaders = {}) {
  return new Request("https://surakshithsuvarna.com/api/contact", {
    method: "POST", headers: { origin: "https://surakshithsuvarna.com", "content-type": "application/json", "cf-connecting-ip": "192.0.2.1", ...extraHeaders },
    body, ...(body instanceof ReadableStream ? { duplex: "half" } : {}),
  });
}
function providers(t, verification = () => Response.json(verified)) {
  const calls = { verification: 0, delivery: 0 };
  t.mock.method(globalThis, "fetch", async (url) => {
    if (String(url).includes("/siteverify")) { calls.verification++; return verification(); }
    if (String(url) === "https://api.resend.com/emails") { calls.delivery++; return Response.json({ id: "fake-id" }); }
    throw new Error("Unexpected external call");
  });
  return calls;
}

test("oversized streaming contact requests stop reading early and cancel", async (t) => {
  let supplied = 0, cancelled = false;
  const stream = new ReadableStream({
    pull(controller) { supplied += 4096; controller.enqueue(new Uint8Array(4096)); },
    cancel() { cancelled = true; },
  }, { highWaterMark: 0 });
  const calls = providers(t);
  const response = await worker.fetch(request(stream), fixture(t), ctx);
  assert.equal(response.status, 413);
  assert.equal(cancelled, true);
  assert.ok(supplied <= 20_480, `read ${supplied} bytes`);
  assert.equal(calls.verification, 0);
});

test("body limits count UTF-8 bytes, respect boundaries, and reject stalled streams", async () => {
  const ascii = "x".repeat(16_384);
  assert.equal(await readBoundedBody(request(ascii)), ascii);
  await assert.rejects(readBoundedBody(request("é".repeat(9000))), { status: 413 });
  let cancelled = false;
  const stream = new ReadableStream({ cancel() { cancelled = true; } });
  await assert.rejects(readBoundedBody(request(stream), 16_384, 15), { status: 408 });
  assert.equal(cancelled, true);
});

test("invalid JSON structures, field types, lengths and content types are controlled errors", async (t) => {
  const env = fixture(t), calls = providers(t);
  for (const invalid of [null, [], true, 42, "text", { ...payload, name: [] }, { ...payload, message: "x".repeat(3001) }]) {
    assert.equal((await worker.fetch(request(JSON.stringify(invalid)), env, ctx)).status, 400);
  }
  assert.equal((await worker.fetch(request("{"), env, ctx)).status, 400);
  assert.equal((await worker.fetch(request("", { "content-length": "20000" }), env, ctx)).status, 413);
  assert.equal((await worker.fetch(request(undefined, { "content-type": "text/plain; application/json" }), env, ctx)).status, 415);
  assert.equal(calls.verification, 0);
});

test("provider HTTP and response-shape failures return 502 without delivering", async (t) => {
  const responses = [() => Response.json(null), () => Response.json([]), () => Response.json({ success: "yes" }), () => Response.json(verified, { status: 500 }), () => Response.json({ ...verified, score: null })];
  for (const response of responses) {
    await t.test("invalid provider result", async (t) => {
      const calls = providers(t, response);
      assert.equal((await worker.fetch(request(), fixture(t), ctx)).status, 502);
      assert.equal(calls.delivery, 0);
    });
  }
});

test("CAPTCHA rejection and honeypot never deliver mail", async (t) => {
  const calls = providers(t, () => Response.json({ success: false }));
  const env = fixture(t);
  assert.equal((await worker.fetch(request(), env, ctx)).status, 400);
  assert.equal((await worker.fetch(request(JSON.stringify({ ...payload, company: "spam" })), env, ctx)).status, 200);
  assert.equal(calls.verification, 1);
  assert.equal(calls.delivery, 0);
});

test("per-IP limit rejects before CAPTCHA with Retry-After", async (t) => {
  const env = fixture(t), calls = providers(t);
  for (let i = 0; i < 5; i++) assert.equal((await worker.fetch(request(), env, ctx)).status, 200);
  const blocked = await worker.fetch(request(), env, ctx);
  assert.equal(blocked.status, 429);
  assert.ok(Number(blocked.headers.get("retry-after")) > 0);
  assert.equal(calls.verification, 5);
  assert.equal(calls.delivery, 5);
});

test("atomic global budgets bound parallel requests and rotating-IP state", async (t) => {
  const { DB } = fixture(t);
  const now = 1_800_000_010;
  const attempts = await Promise.all(Array.from({ length: 150 }, (_, i) => reserveVerification(DB, `192.0.2.${i}`, "secret", now)));
  assert.equal(attempts.filter((value) => value.allowed).length, 120);
  assert.ok(DB.sqlite.prepare("SELECT count(*) AS n FROM contact_limits").get().n <= 121);
  assert.doesNotMatch(JSON.stringify(DB.sqlite.prepare("SELECT * FROM contact_limits").all()), /192\.0\.2/);
  const delivery = await Promise.all(Array.from({ length: 25 }, () => reserveDelivery(DB, now)));
  assert.equal(delivery.filter((value) => value.allowed).length, 20);
  await reserveVerification(DB, "192.0.2.1", "secret", now + 86400);
  assert.equal(DB.sqlite.prepare("SELECT count(*) AS n FROM contact_limits WHERE expires_at <= ?").get(now + 86400).n, 0);
});

test("delivery budget and unavailable storage block external delivery", async (t) => {
  const env = fixture(t), calls = providers(t);
  for (let i = 0; i < 20; i++) await reserveDelivery(env.DB);
  const blocked = await worker.fetch(request(), env, ctx);
  assert.equal(blocked.status, 429);
  assert.ok(blocked.headers.get("retry-after"));
  assert.equal(calls.delivery, 0);
  assert.equal((await worker.fetch(request(), { ...env, DB: undefined }, ctx)).status, 503);
  const broken = { prepare() { throw new Error("fake database unavailable"); } };
  assert.equal((await worker.fetch(request(), { ...env, DB: broken }, ctx)).status, 503);
  assert.equal(calls.verification, 1);
});

test("unused action/write routes reject before consuming a request body", async () => {
  for (const path of ["/", "/case-studies/3cx-post-call-analytics", "/api/contact-config"]) {
    let reads = 0;
    const body = new ReadableStream({ pull() { reads++; } }, { highWaterMark: 0 });
    const response = await worker.fetch(new Request(`https://surakshithsuvarna.com${path}`, { method: "POST", body, duplex: "half", headers: { "next-action": "unknown" } }), {}, ctx);
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "GET, HEAD");
    assert.equal(reads, 0);
    await body.cancel();
  }
});

test("homepage and case studies include compatible security headers", async () => {
  for (const path of ["/", "/case-studies/3cx-post-call-analytics"]) {
    const response = await worker.fetch(new Request(`https://surakshithsuvarna.com${path}`), { ASSETS: { fetch: async () => new Response("", { status: 404 }) } }, ctx);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
    assert.match(response.headers.get("permissions-policy"), /camera=\(\)/);
    assert.equal(response.headers.get("strict-transport-security"), "max-age=31536000");
    assert.match(response.headers.get("content-security-policy"), /frame-ancestors 'self' https:\/\/chatgpt.com/);
    assert.match(response.headers.get("content-security-policy-report-only"), /script-src 'self'/);
    assert.match(await response.text(), /<script/);
  }
});
