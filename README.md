# Surakshith Suvarna — Portfolio

Source for [surakshithsuvarna.com](https://surakshithsuvarna.com/), a performance-focused portfolio presenting infrastructure engineering, software development, AI-assisted automation, professional experience, and technical case studies.

## Highlights

- Responsive, accessible portfolio with semantic navigation and structured data
- Detailed case studies for 3CX Post-Call Analytics, Microsoft Teams Insights, a primary datacentre migration, and the Unified IT Operations Dashboard
- Dedicated social cards for the three original case studies and page-specific search metadata
- Server-side contact delivery through Resend
- Google reCAPTCHA v3 loaded only when a visitor interacts with the contact form
- Sitemap, robots directives, canonical URLs, and JSON-LD structured data
- Automated checks for rendered metadata, contact-form behavior, and accidental email exposure

## Technology

- React 19 and Next.js-compatible routing
- TypeScript
- Vinext and Vite
- Cloudflare Workers-compatible server runtime
- Resend for contact-form email delivery
- Google reCAPTCHA v3 for abuse protection
- Cloudflare D1 for expiring contact abuse counters

## Project structure

```text
app/                    Pages, layouts, metadata, styles, and UI components
app/case-studies/       Individual project case studies
public/                 Favicons and social-card images
worker/                 Contact API and server runtime entry point
tests/                  Contact and rendered-HTML checks
scripts/                Reproducible install and build helpers
```

## Local development

### Prerequisites

- Node.js 22.13 or newer
- npm
- Linux or a compatible environment with Bash and GNU `timeout`

Install dependencies and start the development server:

```bash
cp .openai/hosting.example.json .openai/hosting.json
npm ci
npm run dev
```

Create a local `.env` file from `.env.example` and provide the required values:

```env
RECAPTCHA_SITE_KEY=
RECAPTCHA_SECRET_KEY=
RESEND_API_KEY=
CONTACT_TO=
CONTACT_FROM=
```

The sample hosting configuration contains logical bindings only. Keep your actual Sites project identity in the ignored `.openai/hosting.json`; a newly hosted copy must use its own site identity.

Never commit `.env` files or production credentials. They are intentionally excluded by `.gitignore`.

## Validation

```bash
npm test
npm run lint
```

`npm test` builds the application and verifies the contact endpoint, metadata, structured content, link labels, and email-harvesting protections.

The latest security release passed all 39 tests and a complete dependency audit with zero reported vulnerabilities. Live CAPTCHA/rate-limit checks remain unverified because the testing environment blocked those requests.

The build also runs bounded-request, provider-error, CAPTCHA-recovery, security-header, and atomic rate-limit regressions. Tests use fake credentials and mocked email/CAPTCHA providers; no real mail is sent.

## Contact security

The Worker requires the `DB` D1 binding and the generated `drizzle/` migration. Sites packages the migration and applies it during deployment. For another host, apply the migration before activating the Worker; contact delivery returns a controlled 503 when its abuse protection is unavailable.

Fixed-window limits allow five validated attempts per IP per 15 minutes, 120 attempts across the site per hour, and 20 delivery attempts per UTC day. These include failed provider calls; a limit returns 429 with `Retry-After`. Requests at window boundaries can burst across two windows. Per-IP admission happens before the hourly quota reservation: requests from an already-blocked IP do not spend shared capacity. A separate atomic guard caps stored IP counters at 480; existing counters remain usable at capacity, and expired counters are cleaned up. Raw IP addresses and enquiry contents are not stored in D1. IP identifiers use a secret-keyed, window-specific HMAC; expired counters are removed on subsequent submissions. Idle sites retain only their last bounded set of counters.

See [security remediation notes](docs/security-remediation.md) for the current safeguards, dependency remediation, and CSP rollout status.

## Production build

```bash
npm run build
npm run start
```

The production output is compatible with a Cloudflare Workers-style runtime. Runtime secrets must be configured through the hosting platform rather than committed to source control.

## Performance and accessibility

The site is designed around progressive enhancement and minimal initial JavaScript. reCAPTCHA is deferred until contact intent, below-the-fold sections use rendering containment, and motion respects the visitor's reduced-motion preference.

The latest mobile Lighthouse review reached:

- Performance: 98
- Accessibility: 100
- Best Practices: 100
- SEO: 100

Scores are laboratory measurements and can vary between runs.

## Author

Surakshith Suvarna

- [Portfolio](https://surakshithsuvarna.com/)
- [GitHub](https://github.com/surakshith-suvarna)
- [LinkedIn](https://www.linkedin.com/in/surakshith-suvarna-42863961/)
