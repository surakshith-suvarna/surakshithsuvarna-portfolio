import assert from "node:assert/strict";
import test from "node:test";

async function fetchSite(pathname) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renders the protected contact form without exposing the mailbox", async () => {
  const response = await fetchSite("/");

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, /<form[^>]*class="contact-form"/i);
  assert.match(html, /name="message"/i);
  assert.doesNotMatch(html, /mailto:/i);
  assert.doesNotMatch(html, /surakshith@surakshithsuvarna\.com/i);
  assert.doesNotMatch(html, /google\.com\/recaptcha\/api\.js/i);
  assert.match(html, /Read\s*<!-- -->3CX Post.Call Analytics<!-- -->\s*case study/i);
});

test("publishes canonical profile metadata and structured data", async () => {
  const response = await fetchSite("/");
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /rel="canonical" href="https:\/\/www\.surakshithsuvarna\.com\/?"/i);
  assert.match(html, /"@type":"ProfilePage"/);
  assert.match(html, /"@type":"WebSite"/);
  assert.match(html, /"@type":"Person"/);
  assert.match(html, /"@id":"https:\/\/www\.surakshithsuvarna\.com\/#person"/);
});

test("publishes article and breadcrumb schema on case studies", async () => {
  const response = await fetchSite("/case-studies/3cx-post-call-analytics");
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /class="breadcrumbs"/i);
  assert.match(html, /"@type":"Article"/);
  assert.match(html, /"@type":"BreadcrumbList"/);
  assert.match(html, /"datePublished":"2026-08-23T04:06:30Z"/);
  assert.match(html, /"dateModified":"2026-08-24T23:28:13Z"/);
  assert.match(html, /rel="canonical" href="https:\/\/www\.surakshithsuvarna\.com\/case-studies\/3cx-post-call-analytics"/i);
});

test("lists every indexable page in the sitemap", async () => {
  const response = await fetchSite("/sitemap.xml");
  const xml = await response.text();

  assert.equal(response.status, 200);
  assert.match(xml, /https:\/\/www\.surakshithsuvarna\.com<\/loc>/);
  assert.match(xml, /\/case-studies\/3cx-post-call-analytics<\/loc>/);
  assert.match(xml, /\/case-studies\/microsoft-teams-insights<\/loc>/);
  assert.match(xml, /\/case-studies\/primary-datacentre-migration<\/loc>/);
});

test("allows crawling and advertises the sitemap", async () => {
  const response = await fetchSite("/robots.txt");
  const robots = await response.text();

  assert.equal(response.status, 200);
  assert.match(robots, /User-Agent: \*/i);
  assert.match(robots, /Allow: \//i);
  assert.match(robots, /Sitemap: https:\/\/www\.surakshithsuvarna\.com\/sitemap\.xml/i);
});
