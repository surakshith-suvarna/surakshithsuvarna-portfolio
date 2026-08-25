import ContactForm from "./contact-form";
import JsonLd from "./structured-data";

const siteUrl = "https://www.surakshithsuvarna.com";

const Arrow = () => <span aria-hidden="true">↗</span>;

const projects = [
  {
    index: "01",
    type: "AI · Workflow automation",
    title: "3CX Post‑Call Analytics",
    summary: "An AI-assisted post-call system, researched and built in 15 days, that turns recordings into CRM-ready notes and operational insights.",
    impact: "Approximately 250 calls processed each day",
    stack: ["Go", "3CX", "AssemblyAI", "Gemini 2.5 Flash", "MySQL"],
    href: "/case-studies/3cx-post-call-analytics",
  },
  {
    index: "02",
    type: "Collaboration · Applied AI",
    title: "Microsoft Teams Insights",
    summary: "An on-premises Teams application that converts meeting recordings and transcripts into consistent notes and reusable follow-up context.",
    impact: "Supporting meetings across an 80-person workforce",
    stack: ["Go", "React", "Fluent UI", "RabbitMQ", "SigNoz", "Webhooks"],
    href: "/case-studies/microsoft-teams-insights",
  },
  {
    index: "03",
    type: "Infrastructure · Migration",
    title: "Primary Datacentre Migration",
    summary: "A phased vSphere 7 migration completed during lockdown, balancing production continuity, rollback readiness and cross-team validation.",
    impact: "Around 230 production and VDI VMs, plus DR",
    stack: ["vSphere 7", "vSphere Replication", "VDI", "Disaster Recovery"],
    href: "/case-studies/primary-datacentre-migration",
  },
];

const experience = [
  { period: "2015 — Present", company: "Atlantic Data Bureau Services Ltd", role: "Senior IT Systems Specialist", summary: "Own resilient VMware, Horizon, Veeam, Windows and Linux platforms while designing Go applications that remove operational friction." },
  { period: "2013 — 2015", company: "Xerox Business Services", role: "Infrastructure Services Professional", summary: "Managed VMware vSphere and Windows Server estates, cluster upgrades, maintenance, security, performance and disaster-recovery exercises." },
  { period: "2008 — 2013", company: "IBM India Pvt Ltd", role: "Systems Administrator", summary: "Provided L3 support for VMware, Windows, Citrix, enterprise servers and storage within rigorous ITIL incident and change processes." },
];

const capabilities = [
  { number: "A", title: "Virtualisation & datacentre", text: "vSphere architecture and operations, lifecycle management, capacity, migrations and high availability across production and DR." },
  { number: "B", title: "VDI & end-user platforms", text: "Horizon design and upgrades, linked-to-instant-clone migration, DEM, FSLogix and automated golden-image delivery." },
  { number: "C", title: "Backup & resilience", text: "Veeam backup and replication, RPO/RTO design, recovery plans, testing and operationally credible disaster recovery." },
  { number: "D", title: "Go systems & automation", text: "Production Go services, PostgreSQL, REST APIs, queues, event-driven processing, cloud deployment and reliability patterns." },
];

export default function Home() {
  const profileSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: "Surakshith Suvarna",
        alternateName: "Surakshith Suvarna Portfolio",
        description: "Infrastructure leadership, platform reliability and production software engineering with Go.",
        inLanguage: "en-IN",
      },
      {
        "@type": "ProfilePage",
        "@id": `${siteUrl}/#profile-page`,
        url: siteUrl,
        name: "Surakshith Suvarna — Infrastructure & Software Portfolio",
        description: "Professional profile and selected production work by Surakshith Suvarna.",
        dateCreated: "2026-08-21T08:10:22Z",
        dateModified: "2026-08-24T23:28:13Z",
        inLanguage: "en-IN",
        isPartOf: { "@id": `${siteUrl}/#website` },
        mainEntity: { "@id": `${siteUrl}/#person` },
        hasPart: projects.map((project) => ({
          "@type": "Article",
          "@id": `${siteUrl}${project.href}#article`,
          headline: project.title,
          url: `${siteUrl}${project.href}`,
          datePublished: "2026-08-23T04:06:30Z",
          author: { "@id": `${siteUrl}/#person` },
        })),
      },
      {
        "@type": "Person",
        "@id": `${siteUrl}/#person`,
        name: "Surakshith Suvarna",
        url: siteUrl,
        mainEntityOfPage: { "@id": `${siteUrl}/#profile-page` },
        jobTitle: "Senior IT Systems Specialist",
        description: "Infrastructure specialist and Go software engineer with 19 years of enterprise IT experience.",
        address: { "@type": "PostalAddress", addressLocality: "Mangalore", addressRegion: "Karnataka", addressCountry: "IN" },
        sameAs: ["https://github.com/surakshith-suvarna", "https://www.linkedin.com/in/surakshith-suvarna-42863961/"],
        knowsAbout: ["VMware vSphere", "VMware Horizon", "Veeam Backup and Replication", "Golang", "Platform Engineering", "Disaster Recovery"],
      },
    ],
  };

  return (
    <main>
      <JsonLd data={profileSchema} />
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Surakshith Suvarna, home"><span className="brand-mark">SS</span><span>Surakshith Suvarna</span></a>
        <nav aria-label="Primary navigation">
          <a href="#work">Work</a><a href="#expertise">Expertise</a><a href="#experience">Experience</a><a className="nav-cta" href="#contact">Contact</a>
        </nav>
      </header>

      <section className="hero" id="top" aria-labelledby="main-content">
        <div className="hero-copy">
          <p className="eyebrow"><span /> Infrastructure leadership · Software engineering</p>
          <h1 id="main-content">I build resilient systems—<em>from the datacentre to the application layer.</em></h1>
          <p className="hero-intro">Senior IT Systems Specialist with 19 years of experience operating critical infrastructure and building focused software with Go. I turn operational problems into reliable platforms, automation and measurable outcomes.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#work">Explore selected work <Arrow /></a>
            <a className="button button-secondary" href="#contact">Start a conversation</a>
          </div>
          <div className="availability"><span /> Based in Mangalore, India · Open to architecture, platform and Go opportunities</div>
        </div>
        <div className="hero-system" aria-label="A visual map connecting infrastructure, reliability and software">
          <div className="system-label">How I work</div>
          <div className="system-core"><span className="core-kicker">The bridge</span><strong>Operational context<br />→ engineered outcome</strong></div>
          <div className="orbit orbit-one"><span>Infrastructure</span></div>
          <div className="orbit orbit-two"><span>Reliability</span></div>
          <div className="orbit orbit-three"><span>Software</span></div>
          <div className="system-note">Design · Build · Operate · Improve</div>
        </div>
      </section>

      <section className="metrics" aria-label="Career highlights">
        <div><strong>19</strong><span>years across enterprise IT</span></div>
        <div><strong>99.99%</strong><span>platform uptime sustained</span></div>
        <div><strong>≈250</strong><span>calls processed each day</span></div>
        <div><strong>40%</strong><span>desktop support time reduced</span></div>
      </section>

      <section className="section projects-section" id="work">
        <div className="section-heading">
          <div><p className="eyebrow"><span /> Selected work</p><h2>Systems that earn their place in production.</h2></div>
          <p>Production software and infrastructure work shaped by first-hand operational experience, measurable scale and accountable delivery.</p>
        </div>
        <div className="project-list">
          {projects.map((project) => (
            <article className="project" key={project.title}>
              <div className="project-index">{project.index}</div>
              <div className="project-body">
                <p className="project-type">{project.type}</p><h3>{project.title}</h3><p className="project-summary">{project.summary}</p>
                <div className="project-impact"><span>Outcome</span>{project.impact}</div>
                <a className="project-link" href={project.href}>Read {project.title} case study <Arrow /></a>
              </div>
              <ul className="tags" aria-label={`${project.title} technologies`}>{project.stack.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      <section className="section expertise-section" id="expertise">
        <div className="section-heading compact"><div><p className="eyebrow light"><span /> Core expertise</p><h2>Depth in infrastructure.<br /><em>Range in engineering.</em></h2></div></div>
        <div className="capability-grid">
          {capabilities.map((item) => <article key={item.number}><span className="capability-number">{item.number}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}
        </div>
      </section>

      <section className="section proof-section">
        <div className="proof-lead"><p className="eyebrow"><span /> Infrastructure track record</p><h2>Change without losing control.</h2><p>My strongest work lives where availability, migration risk, user experience and operational detail meet.</p></div>
        <div className="proof-list">
          <article><span>01</span><div><h3>Primary datacentre migration</h3><p>Planned and executed a vSphere 7 migration using replication for production workloads and lift-and-shift moves for VDI and DR, limiting critical-service downtime to minutes.</p><a className="proof-link" href="/case-studies/primary-datacentre-migration">Read Primary Datacentre Migration case study <Arrow /></a></div></article>
          <article><span>02</span><div><h3>Horizon platform transformation</h3><p>Designed the VDI environment, moved physical users to virtual desktops, then migrated linked-clone pools to instant clones with DEM and FSLogix.</p></div></article>
          <article><span>03</span><div><h3>Disaster recovery capability</h3><p>Evaluated options, designed Veeam backup and replication, established recovery objectives, documented runbooks and made DR testing routine.</p></div></article>
          <article><span>04</span><div><h3>Windows platform automation</h3><p>Centralised AD and WSUS operations and used MDT/WDS automation to cut OS deployment time by 50%, desktop support time by 40% and help-desk demand by 30%.</p></div></article>
        </div>
      </section>

      <section className="section experience-section" id="experience">
        <div className="section-heading">
          <div><p className="eyebrow"><span /> Experience</p><h2>Built through ownership, not observation.</h2></div>
          <p>From enterprise operations to hands-on application development, the consistent thread has been accountable delivery.</p>
        </div>
        <div className="timeline">
          {experience.map((item) => <article key={item.company}><time>{item.period}</time><div><p>{item.company}</p><h3>{item.role}</h3></div><p className="timeline-summary">{item.summary}</p></article>)}
        </div>
      </section>

      <section className="section toolkit-section">
        <div><p className="eyebrow light"><span /> Working toolkit</p><h2>Technologies I use to solve real operational problems.</h2></div>
        <div className="tool-groups">
          <div><h3>Platforms</h3><p>VMware vSphere · Horizon · Veeam B&amp;R · Windows Server · Linux · Active Directory</p></div>
          <div><h3>Engineering</h3><p>Go · PostgreSQL · REST APIs · RabbitMQ · WebSockets · React · PWA · GitHub Actions</p></div>
          <div><h3>Cloud & security</h3><p>Google Cloud Run · AWS · Azure AD · Nginx · HashiCorp Vault · OAuth · observability</p></div>
        </div>
      </section>

      <section className="section credentials-section">
        <div className="credentials-copy"><p className="eyebrow"><span /> Credentials</p><h2>Formal foundations. Continuous practice.</h2><p>A Computer Science engineering background, backed by platform certification and focused learning across Go, prompting and agent development.</p></div>
        <div className="credential-cards">
          <article><span>Certification</span><h3>VMware Certified Professional</h3><p>VMware · 2014</p></article>
          <article><span>Certification</span><h3>Certified Golang Professional</h3><div className="credential-meta"><p>Vskills · 2023</p><a href="https://www.vskills.in/certification/59593-surakshith-suvarna" target="_blank" rel="noopener noreferrer">Verify credential <Arrow /></a></div></article>
          <article><span>AI credential</span><h3>Google Prompting Essentials</h3><div className="credential-meta"><p>Google · May 2025</p><a href="https://www.coursera.org/account/accomplishments/records/XNZM883UM2J7" target="_blank" rel="noopener noreferrer">Verify credential <Arrow /></a></div></article>
          <article><span>AI credential</span><h3>Copilot Studio Agent Academy — Recruit</h3><div className="credential-meta"><p>Microsoft · October 2025</p><a href="https://globalai.community/badges/e53558b2-0bef-44f3-8d56-7f38cc9a6135/" target="_blank" rel="noopener noreferrer">Verify credential <Arrow /></a></div></article>
          <article><span>Education</span><h3>BE, Computer Science</h3><p>KVG College of Engineering · 2007</p></article>
        </div>
      </section>

      <section className="contact-section" id="contact">
        <p className="eyebrow light"><span /> Contact</p><h2>Working on a difficult infrastructure or systems problem?</h2>
        <p className="contact-intro">I’m interested in architecture, platform engineering and Go opportunities where operational depth is an advantage.</p>
        <ContactForm />
        <div className="contact-meta"><span>Mangalore, Karnataka, India</span><div><a href="https://github.com/surakshith-suvarna" target="_blank" rel="noopener noreferrer">GitHub <Arrow /></a><a href="https://www.linkedin.com/in/surakshith-suvarna-42863961/" target="_blank" rel="noopener noreferrer">LinkedIn <Arrow /></a></div></div>
      </section>

      <footer><a className="brand" href="#top"><span className="brand-mark">SS</span><span>Surakshith Suvarna</span></a><p>Infrastructure · Reliability · Software</p><p>© 2026 Surakshith Suvarna</p></footer>
    </main>
  );
}
