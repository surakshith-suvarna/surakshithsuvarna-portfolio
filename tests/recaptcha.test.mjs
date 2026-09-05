import assert from "node:assert/strict";
import test from "node:test";
import { importTypeScript } from "./helpers/typescript.mjs";
const { createRecaptchaLoader, withDeadline } = await importTypeScript("app/recaptcha.ts");

function browser(t) {
  const priorWindow = globalThis.window, priorDocument = globalThis.document;
  const scripts = [];
  class Script extends EventTarget {
    dataset = {};
    listeners = 0;
    addEventListener(...args) { this.listeners++; super.addEventListener(...args); }
    removeEventListener(...args) { this.listeners--; super.removeEventListener(...args); }
    remove() { const i = scripts.indexOf(this); if (i !== -1) scripts.splice(i, 1); }
  }
  globalThis.window = {};
  globalThis.document = { createElement: () => new Script(), head: { appendChild: (script) => scripts.push(script) } };
  t.mock.method(globalThis, "fetch", async () => Response.json({ siteKey: "public-key" }));
  t.after(() => { globalThis.window = priorWindow; globalThis.document = priorDocument; });
  return scripts;
}
const nextTurn = () => new Promise((resolve) => setImmediate(resolve));

test("failed CAPTCHA script is removed and retry loads a fresh script", async (t) => {
  const scripts = browser(t), load = createRecaptchaLoader(100);
  const failed = load();
  assert.equal(load(), failed, "concurrent requests share one load");
  const rejection = assert.rejects(failed, /could not load/);
  await nextTurn();
  const first = scripts[0];
  first.dispatchEvent(new Event("error"));
  await rejection;
  assert.equal(scripts.length, 0);
  assert.equal(first.listeners, 0);
  const retry = load();
  await nextTurn();
  assert.equal(scripts.length, 1);
  assert.notEqual(scripts[0], first);
  window.grecaptcha = { ready: (callback) => callback(), execute: async () => "fresh-token" };
  scripts[0].dispatchEvent(new Event("load"));
  const context = await retry;
  assert.equal(await context.api.execute(context.siteKey, { action: "portfolio_contact" }), "fresh-token");
  assert.equal(scripts[0].listeners, 0);
  assert.equal(load(), retry);
});

test("CAPTCHA loading and readiness have deadlines and remain retryable", async (t) => {
  for (const readyNeverFires of [false, true]) {
    await t.test(readyNeverFires ? "ready timeout" : "script timeout", async (t) => {
      const scripts = browser(t), load = createRecaptchaLoader(20);
      const first = load(), rejected = assert.rejects(first, /could not load/);
      await nextTurn();
      if (readyNeverFires) {
        window.grecaptcha = { ready() {}, execute: async () => "token" };
        scripts[0].dispatchEvent(new Event("load"));
      }
      await rejected;
      assert.equal(scripts.length, 0);
      const retry = load(), retryRejected = assert.rejects(retry, /could not load/);
      await nextTurn();
      assert.equal(scripts.length, 1);
      scripts[0].dispatchEvent(new Event("error"));
      await retryRejected;
    });
  }
});

test("invalid configuration and hung token execution produce recoverable errors", async (t) => {
  const scripts = browser(t), load = createRecaptchaLoader(30);
  t.mock.method(globalThis, "fetch", async () => Response.json(null));
  await assert.rejects(load(), /temporarily unavailable/);
  assert.equal(scripts.length, 0);
  await assert.rejects(withDeadline(new Promise(() => {}), 10, "Please try again"), /Please try again/);
});
