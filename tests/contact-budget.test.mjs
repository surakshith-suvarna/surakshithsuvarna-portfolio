import assert from "node:assert/strict";
import test from "node:test";
import { createTestDatabase } from "./helpers/d1.mjs";
import { importTypeScript } from "./helpers/typescript.mjs";

const { reserveVerification } = await importTypeScript("worker/contact-limits.ts");
const now = 1_800_000_010;
const globalCount = (db) => db.sqlite.prepare("SELECT count FROM contact_limits WHERE key LIKE 'verification:%'").get()?.count ?? 0;

for (const parallel of [false, true]) {
  test(`blocked IP cannot spend other visitors' verification budget (${parallel ? "parallel" : "sequential"})`, async (t) => {
    const db = createTestDatabase();
    t.after(() => db.sqlite.close());
    const attempt = () => reserveVerification(db, "192.0.2.10", "secret", now);
    const results = parallel
      ? await Promise.all(Array.from({ length: 120 }, attempt))
      : await (async () => { const results = []; for (let i = 0; i < 120; i++) results.push(await attempt()); return results; })();
    assert.equal(results.filter((result) => result.allowed).length, 5);
    assert.equal(globalCount(db), 5, "115 per-IP rejections must not spend the hourly budget");
    assert.ok(results.filter((result) => !result.allowed).every((result) => result.retryAfter === 890));
    assert.equal((await reserveVerification(db, "198.51.100.77", "secret", now)).allowed, true);
    assert.equal(globalCount(db), 6);
  });
}

test("IP storage capacity is atomic, preserves existing counters, and recovers on expiry", async (t) => {
  const db = createTestDatabase();
  t.after(() => db.sqlite.close());
  await reserveVerification(db, "192.0.2.10", "secret", now);
  const expires = (Math.floor(now / 900) + 1) * 900;
  const insert = db.sqlite.prepare("INSERT INTO contact_limits VALUES (?, 1, ?)");
  // Leave one slot, then race new identifiers for it.
  for (let i = 0; i < 478; i++) insert.run(`ip:fixture-${i}:${expires}`, expires);
  const attempts = await Promise.all(Array.from({ length: 50 }, (_, i) => reserveVerification(db, `198.51.100.${i}`, "secret", now)));
  assert.equal(attempts.filter((result) => result.allowed).length, 1);
  assert.equal(db.sqlite.prepare("SELECT count(*) AS n FROM contact_limits WHERE key LIKE 'ip:%'").get().n, 480);
  assert.equal(globalCount(db), 2, "storage rejection must not spend verification capacity");
  assert.equal((await reserveVerification(db, "192.0.2.10", "secret", now)).allowed, true);
  assert.equal(globalCount(db), 3);
  assert.equal((await reserveVerification(db, "203.0.113.1", "secret", expires)).allowed, true);
  assert.equal(db.sqlite.prepare("SELECT count(*) AS n FROM contact_limits WHERE key LIKE 'ip:%'").get().n, 1);
});

test("admitted requests still obey the global budget and recover at the hourly boundary", async (t) => {
  const db = createTestDatabase();
  t.after(() => db.sqlite.close());
  for (let ip = 0; ip < 24; ip++) {
    for (let attempt = 0; attempt < 5; attempt++) {
      assert.equal((await reserveVerification(db, `192.0.2.${ip}`, "secret", now)).allowed, true);
    }
  }
  const blocked = await reserveVerification(db, "198.51.100.77", "secret", now);
  assert.deepEqual(blocked, { allowed: false, retryAfter: 3590 });
  assert.equal(globalCount(db), 120);
  const nextHour = (Math.floor(now / 3600) + 1) * 3600;
  assert.equal((await reserveVerification(db, "198.51.100.77", "secret", nextHour)).allowed, true);
  assert.equal(globalCount(db), 1);
});
