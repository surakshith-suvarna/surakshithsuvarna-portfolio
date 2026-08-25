# Surakshith Suvarna — Portfolio

Source for [surakshithsuvarna.com](https://www.surakshithsuvarna.com/), a performance-focused portfolio presenting infrastructure engineering, software development, AI-assisted automation, professional experience, and technical case studies.

## Highlights

- Responsive, accessible portfolio with semantic navigation and structured data
- Detailed case studies for 3CX Post-Call Analytics, Microsoft Teams Insights, and a primary datacentre migration
- Per-page Open Graph social cards and search-engine metadata
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

Never commit `.env` files or production credentials. They are intentionally excluded by `.gitignore`.

## Validation

```bash
npm test
npm run lint
```

`npm test` builds the application and verifies the contact endpoint, metadata, structured content, link labels, and email-harvesting protections.

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

- [Portfolio](https://www.surakshithsuvarna.com/)
- [GitHub](https://github.com/surakshith-suvarna)
- [LinkedIn](https://www.linkedin.com/in/surakshith-suvarna-42863961/)
