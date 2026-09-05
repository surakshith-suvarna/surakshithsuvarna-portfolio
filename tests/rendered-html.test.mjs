import assert from "node:assert/strict";
import test from "node:test";

async function fetchSite(pathname, hostname = "localhost") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://${hostname}${pathname}`, {
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
  assert.doesNotMatch(html, /[a-z0-9._%+-]+@surakshithsuvarna\.com/i);
  assert.doesNotMatch(html, /google\.com\/recaptcha\/api\.js/i);
  assert.match(html, /Read\s*<!-- -->3CX Post.Call Analytics<!-- -->\s*case study/i);
});

test("publishes canonical profile metadata and structured data", async () => {
  const response = await fetchSite("/");
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /rel="canonical" href="https:\/\/surakshithsuvarna\.com\/?"/i);
  assert.match(html, /"@type":"ProfilePage"/);
  assert.match(html, /"@type":"WebSite"/);
  assert.match(html, /"@type":"Person"/);
  assert.match(html, /"@id":"https:\/\/surakshithsuvarna\.com\/#person"/);
  assert.match(html, /"image":\["https:\/\/surakshithsuvarna\.com\/social\/3cx-post-call-analytics\.png"\]/);
  assert.match(html, /"image":\["https:\/\/surakshithsuvarna\.com\/social\/microsoft-teams-insights\.png"\]/);
  assert.match(html, /"image":\["https:\/\/surakshithsuvarna\.com\/social\/primary-datacentre-migration-v2\.png"\]/);
  assert.match(html, /class="brand-mark" aria-hidden="true"/i);
  assert.doesNotMatch(html, /class="brand-mark"[^>]*>\s*SS\s*</i);
  assert.doesNotMatch(html, />\s*S\s+Surakshith Suvarna\s*</i);
  assert.match(html, /rel="icon" href="https:\/\/surakshithsuvarna\.com\/favicon-v3\.svg"/i);
  assert.doesNotMatch(html, /https:\/\/www\.surakshithsuvarna\.com/i);
});

test("publishes article and breadcrumb schema on case studies", async () => {
  const response = await fetchSite("/case-studies/3cx-post-call-analytics");
  const html = await response.text();

  assert.equal(response.status, 200);
  assert.match(html, /class="breadcrumbs"/i);
  assert.match(html, /"@type":"Article"/);
  assert.match(html, /"@type":"BreadcrumbList"/);
  assert.match(html, /"datePublished":"2026-08-23T04:06:30Z"/);
  assert.match(html, /"dateModified":"2026-08-30T12:33:20Z"/);
  assert.match(html, /rel="canonical" href="https:\/\/surakshithsuvarna\.com\/case-studies\/3cx-post-call-analytics"/i);
  assert.match(html, /class="brand-mark" aria-hidden="true"/i);
  assert.doesNotMatch(html, /class="brand-mark"[^>]*>\s*SS\s*</i);
  assert.doesNotMatch(html, /https:\/\/www\.surakshithsuvarna\.com/i);
});

test("lists every indexable page in the sitemap", async () => {
  const response = await fetchSite("/sitemap.xml");
  const xml = await response.text();

  assert.equal(response.status, 200);
  assert.match(xml, /https:\/\/surakshithsuvarna\.com<\/loc>/);
  assert.match(xml, /\/case-studies\/3cx-post-call-analytics<\/loc>/);
  assert.match(xml, /\/case-studies\/microsoft-teams-insights<\/loc>/);
  assert.match(xml, /\/case-studies\/primary-datacentre-migration<\/loc>/);
  assert.match(xml, /\/case-studies\/unified-it-operations-dashboard<\/loc>/);
  assert.doesNotMatch(xml, /https:\/\/www\.surakshithsuvarna\.com/i);
});

test("dashboard case study has consistent publication metadata and joins the navigation loop", async () => {
  const path = "/case-studies/unified-it-operations-dashboard";
  const url = `https://surakshithsuvarna.com${path}`;
  const response = await fetchSite(path);
  assert.equal(response.status, 200);
  const html = await response.text();
  const graphs = (markup) => [...markup.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .flatMap((match) => JSON.parse(match[1])["@graph"] ?? []);
  const article = graphs(html).find((entry) => entry["@type"] === "Article");
  assert.equal(article.url, url);
  assert.match(article.datePublished, /^2026-09-05T/);
  assert.equal(article.image, undefined);
  assert.ok(html.includes(`rel="canonical" href="${url}"`));
  assert.doesNotMatch(html, /property="og:image"|name="twitter:image"/);
  assert.doesNotMatch(html, /Editorial notes|__MODULES__|Draft prepared/);
  assert.match(html, /approximately 350 VMs run every 24 hours/);
  assert.match(html, /checks daily for threats/);
  const home = await (await fetchSite("/")).text();
  const profile = graphs(home).find((entry) => entry["@type"] === "ProfilePage");
  assert.equal(profile.hasPart.length, 4);
  assert.equal(profile.hasPart[0].url, url);
  assert.equal(profile.hasPart[0].datePublished, article.datePublished);
  assert.equal(profile.hasPart[0].image, undefined);
  assert.ok(home.includes(`class="project-link" href="${path}"`));
  const seen = new Set();
  let route = path;
  for (let i = 0; i < 4; i++) {
    assert.ok(!seen.has(route), "each case study should appear once before the loop closes");
    seen.add(route);
    const page = route === path ? response : await fetchSite(route);
    assert.equal(page.status, 200);
    const body = route === path ? html : await page.text();
    const next = body.match(/<nav class="case-study-next"[^>]*>[\s\S]*?<a href="([^"]+)"/);
    assert.ok(next, "case study must link to the next case study");
    route = next[1];
  }
  assert.equal(route, path);
});

test("allows crawling and advertises the sitemap", async () => {
  const response = await fetchSite("/robots.txt");
  const robots = await response.text();

  assert.equal(response.status, 200);
  assert.match(robots, /User-Agent: \*/i);
  assert.match(robots, /Allow: \//i);
  assert.match(robots, /Sitemap: https:\/\/surakshithsuvarna\.com\/sitemap\.xml/i);
});

test("permanently redirects www requests to the canonical apex", async () => {
  const response = await fetchSite(
    "/case-studies/3cx-post-call-analytics?source=search-console",
    "www.surakshithsuvarna.com",
  );

  assert.equal(response.status, 308);
  assert.equal(
    response.headers.get("location"),
    "https://surakshithsuvarna.com/case-studies/3cx-post-call-analytics?source=search-console",
  );
});
