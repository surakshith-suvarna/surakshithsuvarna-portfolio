# Security remediation — 5 September 2026

These changes address the findings from the portfolio's 5 September review. This document describes the saved source; it does not establish that a version has been deployed or that the site is free of vulnerabilities.

## Changes

- **SEC-01:** React, React DOM and `react-server-dom-webpack` updated together to 19.2.8. The built server contains 19.2.8 and no 19.2.6 version marker. The [React maintainer advisory](https://github.com/react/react/security/advisories/GHSA-wx67-qw84-cm4g) identifies the patched RSC release. All write methods outside `/api/contact` are rejected before the framework parses a body, because this portfolio defines no Server Actions.
- **SEC-02:** Request bodies are limited to 16,384 UTF-8 bytes during reading. Declared size is only an early rejection hint. Oversized streams are cancelled, and body reading has an eight-second deadline. Field types and individual length limits are checked separately.
- **SEC-03:** Atomic D1 counters protect verification and delivery across Worker instances. Limits are five attempts per IP per 15 minutes, 120 total attempts per hour, and 20 delivery attempts per UTC day. `429` responses include `Retry-After`. Missing or failed storage prevents provider calls instead of silently bypassing limits.
- **BUG-01:** CAPTCHA loading is shared across form remounts, with failed scripts removed and listeners cleared. Configuration, script readiness, token generation and submission have bounded waits. Failures restore a retryable form; the visitor's text remains available. CAPTCHA still loads only after form interaction.
- **BUG-02:** Non-object JSON, invalid fields, provider HTTP errors and malformed provider responses produce controlled errors. Caller data receives 400; unusable CAPTCHA provider responses receive 502. A valid negative CAPTCHA result remains 400.
- **SEC-04:** Worker responses include `nosniff`, a referrer policy and a scoped permissions policy. HTTPS responses on the portfolio's apex and www hostnames include HSTS without `includeSubDomains` or preload. HTML enforces `base-uri`, `object-src` and `frame-ancestors`; the permitted parents are the site itself and `https://chatgpt.com`.
- **QA-01:** Both normal build and `npm test` run every test file, including the original contact checks and the new security/recovery regressions.

## CSP rollout

Script/resource restrictions are **report-only**, not enforced. Streamed React bootstrap and hosting-injected Cloudflare scripts require browser validation before moving this policy to enforcement. Reports currently appear in browser developer tools; no remote report collection endpoint has been configured. `X-Frame-Options` is intentionally absent because it cannot represent the permitted cross-origin ChatGPT parent; the enforced `frame-ancestors` directive supplies the framing control.

## Storage and privacy

The new `contact_limits` table holds only a counter key, count and expiry. IP-derived keys are HMACs using a server-only key with a per-window input; no raw IP, name, email or message is stored. A global admission budget bounds the number of IP rows even if callers rotate addresses. Expired rows are deleted on subsequent submissions; an idle site retains only the last bounded set. These limits protect provider use and email volume; they are not a replacement for hosting-level traffic protection and do not establish resistance to a distributed denial-of-service attack.

The schema-only migration and D1 binding must be applied with the Worker. Sites performs migration application during publication. The migration was executed against SQLite in the regression tests and included in the preceding security deployment. This dependency follow-up adds no schema changes.

## Dependency result

The 5 September follow-up registry audit reports **0 vulnerabilities** across the complete lockfile, including development dependencies (previously 6 affected package entries: 2 high and 4 moderate). An audit is limited to known registry advisories; it does not establish that the site is free of vulnerabilities.

Two exact, scoped overrides in `package.json` remove the remaining vulnerable dependencies:

| Dependency path | Replacement | Verification and maintenance |
| --- | --- | --- |
| Vinext → image-size 2.0.2 | `image-size` resolves to `image-size-next@2.1.1` within Vinext | The original package has no patched release. This is an independent, community-maintained MIT fork, not an official upstream release. The published tarball was integrity-checked and its main parser/file-reader changes reviewed against 2.0.2. It adds entry-length, box-boundary and forward-progress checks for the ICNS/JXL/HEIF loops. Both module formats pass local malformed-input termination tests and preserve all four social-card dimensions. |
| Drizzle Kit → esbuild-kit loader → esbuild 0.18.20 | `@esbuild-kit/core-utils` resolves esbuild 0.28.2 | Both synchronous and asynchronous TypeScript transforms pass. Drizzle migration generation successfully reads the existing schema and reports no changes. Existing migration files are unchanged. |

Sources: [replacement parser and maintenance status](https://github.com/lcf2212dev/image-size-next/tree/v2.1.1), [original image-size advisories](https://github.com/advisories/GHSA-w3rx-r6r6-pgpr), [JXL/HEIF advisory](https://github.com/advisories/GHSA-5p2g-fcmc-qvqq), and [esbuild maintainer advisory](https://github.com/evanw/esbuild/security/advisories/GHSA-67mh-4wv8-2f99).

Vinext and Drizzle Kit retain their existing versions. A Vinext beta upgrade was not used as an audit fix: its [image-size bundling change](https://github.com/cloudflare/vinext/pull/2913) removes the package from the consumer dependency graph while retaining the old implementation. No advisory is suppressed or filtered out. The replacement package identity and registry integrity remain visible in the lockfile.

The weekly dependency check should continue reviewing these pinned overrides. Re-evaluate them when Vinext adopts a safe parser or Drizzle removes its legacy loader, and retain the compatibility tests when changing either override.

## Validation

- Production build and all **34 tests passed**, including three dependency regression checks added in the follow-up.
- Tests execute the generated schema and actual prepared SQL against SQLite, including parallel admission and delivery-budget boundaries, expiry cleanup, and absence of raw IPs.
- A bounded streaming test confirmed cancellation after 20,480 bytes (one 4 KiB chunk beyond the 16 KiB limit), without reading the rest of the stream or calling external providers.
- CAPTCHA load failure, readiness timeout, fresh-script retry and listener cleanup were verified in an isolated DOM/event harness.
- Built Worker tests cover malformed caller/provider JSON, provider rejection, storage failures, rate-limit responses, unused action routes, header presence, page rendering, canonical redirects, sitemap and structured data.
- The dependency follow-up uses local malformed-image fixtures in a subprocess with a three-second deadline. It sends no real email, production contact POST, load test or malformed-image payload to the live site.

Full CSP enforcement, live CAPTCHA/email delivery and live rate-limit verification remain separate validation items. Some earlier live checks were blocked by network approval cancellation; passing local tests does not establish their live result. Existing Lighthouse results predate this security release.
