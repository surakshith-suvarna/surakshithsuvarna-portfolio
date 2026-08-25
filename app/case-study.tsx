import type { ReactNode } from "react";
import JsonLd from "./structured-data";

const siteUrl = "https://www.surakshithsuvarna.com";

type Metric = {
  value: string;
  label: string;
};

type CaseStudyProps = {
  eyebrow: string;
  title: string;
  introduction: string;
  canonicalPath: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified: string;
  keywords: string[];
  metrics: Metric[];
  technologies: string[];
  children: ReactNode;
  nextHref: string;
  nextLabel: string;
};

const Arrow = () => <span aria-hidden="true">↗</span>;

export default function CaseStudy({
  eyebrow,
  title,
  introduction,
  canonicalPath,
  description,
  image,
  datePublished,
  dateModified,
  keywords,
  metrics,
  technologies,
  children,
  nextHref,
  nextLabel,
}: CaseStudyProps) {
  const canonicalUrl = `${siteUrl}${canonicalPath}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${canonicalUrl}#article`,
        headline: title,
        description,
        image: [image],
        datePublished,
        dateModified,
        articleSection: eyebrow,
        keywords,
        inLanguage: "en-IN",
        url: canonicalUrl,
        mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
        author: {
          "@type": "Person",
          "@id": `${siteUrl}/#person`,
          name: "Surakshith Suvarna",
          url: siteUrl,
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${canonicalUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: title,
            item: canonicalUrl,
          },
        ],
      },
    ],
  };

  return (
    <main>
      <JsonLd data={structuredData} />
      <a className="skip-link" href="#case-study-content">Skip to case study</a>
      <header className="site-header case-study-header">
        <a className="brand" href="/" aria-label="Surakshith Suvarna, home">
          <span className="brand-mark">SS</span><span>Surakshith Suvarna</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="/#work">Work</a><a href="/#expertise">Expertise</a><a href="/#experience">Experience</a><a className="nav-cta" href="/#contact">Contact</a>
        </nav>
      </header>

      <article id="case-study-content">
        <header className="case-study-hero">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <ol>
              <li><a href="/">Home</a></li>
              <li aria-current="page">{title}</li>
            </ol>
          </nav>
          <a className="case-study-back" href="/#work">← Selected work</a>
          <p className="eyebrow"><span /> {eyebrow}</p>
          <h1>{title}</h1>
          <p className="case-study-intro">{introduction}</p>
          <div className="case-study-metrics" aria-label="Project highlights">
            {metrics.map((metric) => <div key={metric.label}><strong>{metric.value}</strong><span>{metric.label}</span></div>)}
          </div>
        </header>

        <div className="case-study-layout">
          <aside className="case-study-aside" aria-label="Case study overview">
            <p>Case study</p>
            <ol>
              <li><a href="#challenge">Challenge</a></li>
              <li><a href="#ownership">Ownership</a></li>
              <li><a href="#approach">Approach</a></li>
              <li><a href="#outcome">Outcome</a></li>
            </ol>
          </aside>
          <div className="case-study-copy">{children}</div>
        </div>

        <section className="case-study-stack" aria-labelledby="technology-heading">
          <p className="eyebrow light"><span /> Technology</p>
          <h2 id="technology-heading">Tools chosen for the job.</h2>
          <ul>{technologies.map((technology) => <li key={technology}>{technology}</li>)}</ul>
        </section>

        <nav className="case-study-next" aria-label="Next case study">
          <span>Next case study</span>
          <a href={nextHref}>{nextLabel} <Arrow /></a>
        </nav>
      </article>

      <footer>
        <a className="brand" href="/"><span className="brand-mark">SS</span><span>Surakshith Suvarna</span></a>
        <p>Infrastructure · Reliability · Software</p><p>© 2026 Surakshith Suvarna</p>
      </footer>
    </main>
  );
}
