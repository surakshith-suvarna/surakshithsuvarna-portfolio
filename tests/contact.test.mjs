import assert from "node:assert/strict";
import test, { after } from "node:test";
import { createTestDatabase } from "./helpers/d1.mjs";

const workerUrl = new URL("../dist/server/index.js", import.meta.url);
workerUrl.searchParams.set("contact-test", `${process.pid}-${Date.now()}`);
const { default: worker } = await import(workerUrl.href);

const ctx = {
  waitUntil() {},
  passThroughOnException() {},
};

const baseEnv = {
  DB: createTestDatabase(),
  RECAPTCHA_SITE_KEY: "public-site-key",
  RECAPTCHA_PROJECT_ID: "portfolio-project",
  RECAPTCHA_API_KEY: "private-recaptcha-api-key",
  RECAPTCHA_MIN_SCORE: "0.5",
  RESEND_API_KEY: "private-resend-key",
  CONTACT_TO: "recipient@example.test",
  CONTACT_FROM: "Portfolio <contact@example.test>",
};
after(() => baseEnv.DB.sqlite.close());

test("contact config exposes only the public reCAPTCHA site key", async () => {
  const response = await worker.fetch(new Request("https://portfolio.example/api/contact-config"), baseEnv, ctx);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { siteKey: "public-site-key" });
});

test("the site key alone leaves contact configuration unavailable", async () => {
  const response = await worker.fetch(
    new Request("https://portfolio.example/api/contact-config"),
    { ...baseEnv, RECAPTCHA_API_KEY: undefined },
    ctx,
  );
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal((await response.json()).ok, false);
});

test("contact submissions require a same-origin browser request", async () => {
  const response = await worker.fetch(
    new Request("https://portfolio.example/api/contact", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    }),
    baseEnv,
    ctx,
  );
  assert.equal(response.status, 403);
});

test("a verified submission is delivered without exposing the recipient", async () => {
  const originalFetch = globalThis.fetch;
  let deliveryBody;
  let assessmentRequest;

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.startsWith("https://recaptchaenterprise.googleapis.com/")) {
      assessmentRequest = { url, init };
      return Response.json({
        tokenProperties: { valid: true, hostname: "portfolio.example", action: "portfolio_contact" },
        riskAnalysis: { score: 0.9 },
      });
    }
    if (url === "https://api.resend.com/emails") {
      deliveryBody = JSON.parse(String(init?.body));
      return Response.json({ id: "delivery-id" });
    }
    return originalFetch(input, init);
  };

  try {
    const response = await worker.fetch(
      new Request("https://portfolio.example/api/contact", {
        method: "POST",
        headers: {
          origin: "https://portfolio.example",
          "content-type": "application/json",
          "cf-connecting-ip": "192.0.2.1",
        },
        body: JSON.stringify({
          name: "Example Visitor",
          email: "visitor@example.test",
          message: "I would like to discuss a platform engineering project.",
          company: "",
          recaptchaToken: "verified-token",
        }),
      }),
      baseEnv,
      ctx,
    );

    assert.equal(response.status, 200);
    assert.equal((await response.json()).ok, true);
    assert.equal(assessmentRequest.url, "https://recaptchaenterprise.googleapis.com/v1/projects/portfolio-project/assessments");
    assert.equal(assessmentRequest.init.method, "POST");
    assert.equal(new Headers(assessmentRequest.init.headers).get("x-goog-api-key"), "private-recaptcha-api-key");
    assert.deepEqual(JSON.parse(assessmentRequest.init.body), {
      event: { token: "verified-token", siteKey: "public-site-key", expectedAction: "portfolio_contact", userIpAddress: "192.0.2.1" },
    });
    assert.deepEqual(deliveryBody.to, ["recipient@example.test"]);
    assert.equal(deliveryBody.reply_to, "visitor@example.test");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a low Enterprise risk score is rejected before email delivery", async () => {
  const originalFetch = globalThis.fetch;
  let deliveryCalls = 0;

  globalThis.fetch = async (input, init) => {
    const url = String(input);
    if (url.startsWith("https://recaptchaenterprise.googleapis.com/")) {
      return Response.json({
        tokenProperties: { valid: true, hostname: "portfolio.example", action: "portfolio_contact" },
        riskAnalysis: { score: 0.2 },
      });
    }
    if (url === "https://api.resend.com/emails") {
      deliveryCalls += 1;
      return Response.json({ id: "unexpected-delivery" });
    }
    return originalFetch(input, init);
  };

  try {
    const response = await worker.fetch(
      new Request("https://portfolio.example/api/contact", {
        method: "POST",
        headers: {
          origin: "https://portfolio.example",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: "Automated Visitor",
          email: "visitor@example.test",
          message: "This message has enough characters to pass validation.",
          company: "",
          recaptchaToken: "low-score-token",
        }),
      }),
      baseEnv,
      ctx,
    );

    assert.equal(response.status, 400);
    assert.equal(deliveryCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
