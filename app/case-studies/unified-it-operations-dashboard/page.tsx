import type { Metadata } from "next";
import CaseStudy from "../../case-study";

const title = "Unified IT Operations Dashboard";
const canonicalPath = "/case-studies/unified-it-operations-dashboard";
const publishedAt = "2026-09-05T04:11:59Z";
const description = "How Surakshith Suvarna designed, built and maintains a Go operations dashboard that replaces manual antivirus checks across approximately 105 desktops with report exports in seconds.";

export const metadata: Metadata = {
  title: `${title} — Surakshith Suvarna`,
  description,
  alternates: { canonical: canonicalPath },
  openGraph: {
    type: "article",
    title,
    description,
    url: canonicalPath,
    publishedTime: publishedAt,
    modifiedTime: publishedAt,
    authors: ["https://surakshithsuvarna.com"],
    images: [],
  },
  twitter: {
    card: "summary",
    title,
    description,
    images: [],
  },
};

export default function ITDashboardCaseStudy() {
  return (
    <CaseStudy
      eyebrow="IT operations · Software engineering"
      title={title}
      introduction="Bringing infrastructure oversight and audit reporting into one application."
      canonicalPath={canonicalPath}
      description={description}
      datePublished={publishedAt}
      dateModified={publishedAt}
      keywords={["Go", "IT operations", "PostgreSQL", "infrastructure monitoring", "audit reporting", "Active Directory", "Windows Defender", "VMware", "Veeam"]}
      metrics={[
        { value: "Seconds", label: "AV report exports" },
        { value: "18 months", label: "Approximate development" },
        { value: "4", label: "IT team users" },
        { value: "Jun 2023", label: "In production since" },
      ]}
      technologies={["Go", "Go HTML templates", "PostgreSQL", "WebSockets", "Progressive Web App (PWA)", "AWS End User Messaging for SMS alerts", "Active Directory", "Windows Defender", "VMware Horizon View", "Veeam Backup & Replication", "VMware vSphere"]}
      nextHref="/case-studies/3cx-post-call-analytics"
      nextLabel="3CX Post-Call Analytics"
    >
      <section id="challenge">
        <p className="case-section-label">01 · Challenge</p>
        <h2>The problem</h2>
        <p>Daily infrastructure checks and audit preparation involved moving between several administrative tools and assembling reports manually.</p>
        <p>For antivirus audit reporting, we previously had to log in to approximately 105 desktops to collect the required information. Those reports showed the state of each machine when it was checked; we did not have a central history that we could query for a previous reporting period.</p>
        <p>Active Directory evidence involved running PowerShell commands to retrieve group membership and access information, then preparing spreadsheets before audits. Certificate-expiry tracking relied on calendar reminders. Host health checks and backup reviews also required separate checks across the environment.</p>
        <p>I wanted to bring these recurring tasks into an application shaped around how our IT team actually worked.</p>
      </section>

      <section id="ownership">
        <p className="case-section-label">02 · Ownership</p>
        <h2>My responsibility</h2>
        <p>I designed and coded the entire solution and continue to maintain it.</p>
        <p>The application began as my Go learning project. Over approximately 18 months of development, I built it into a production tool covering service monitoring, Active Directory, Windows Defender, Horizon View, Veeam and VMware.</p>
        <p>My work covered the backend, server-rendered interface, PostgreSQL data storage, WebSocket updates, monitoring schedules, reporting and notification workflows. The application has been in production since June 2023.</p>
      </section>

      <section id="approach">
        <p className="case-section-label">03 · Approach</p>
        <h2>Infrastructure oversight in one place.</h2>
        <div className="case-study-table-wrap">
          <table className="case-study-table">
            <caption>At a glance</caption>
            <thead><tr><th scope="col">Area</th><th scope="col">Scope or outcome</th></tr></thead>
            <tbody>
              <tr><th scope="row">Antivirus audit reporting</th><td>Report exports in seconds; previously required manual checks across approximately 105 desktops</td></tr>
              <tr><th scope="row">VMware oversight</th><td>16 ESXi hosts across three sites</td></tr>
              <tr><th scope="row">VM checks</th><td>Approximately 350 VMs checked every 24 hours for disk-space and hardware issues</td></tr>
              <tr><th scope="row">Active Directory reporting</th><td>Two domains and four domain controllers</td></tr>
              <tr><th scope="row">Backup visibility</th><td>Two Veeam servers covering approximately 150 VM backups</td></tr>
              <tr><th scope="row">Certificate alerts</th><td>Notifications at 30 and 15 days before expiry</td></tr>
            </tbody>
          </table>
        </div>

        <h3>Service availability and certificate monitoring</h3>
        <p>The monitoring module checks HTTP, HTTPS, ping availability and SSL certificate expiry for registered hosts. Individual checks can be selected and scheduled per host according to the service's requirements.</p>
        <p>Critical services can generate SMS notifications through AWS End User Messaging. Certificate notifications are issued at 30 and 15 days before expiry, replacing the calendar reminders previously used to track renewals.</p>

        <h3>Active Directory reporting for operations and audits</h3>
        <p>The Active Directory module consolidates information from two domains and four domain controllers. It provides views of users, computers, groups and account status, alongside reports covering group membership, access information, logons, directory objects and Group Policy.</p>
        <p>These reports support both routine administration and ISMS audit evidence requests. Information that previously required PowerShell commands and pre-audit spreadsheet preparation can now be shown directly to the reviewer.</p>

        <h3>Centralised antivirus reporting and threat notifications</h3>
        <p>The Defender module brings antivirus status and reported threats into a shared view for the IT team.</p>
        <p>Daily antivirus reports are stored in PostgreSQL. This provides a historical record as well as current reporting, allowing the team to export information for a requested period in seconds.</p>
        <p>The application also checks daily for threats reported on desktops and triggers an email with the details when a threat is found. This gives the team central visibility and information for investigation and response.</p>

        <h3>Horizon View operations</h3>
        <p>The Horizon View module brings active sessions, VDI desktops, events, settings and monitoring information into a customised view based on the team's operational requirements.</p>
        <p>It places VDI information alongside the infrastructure and service views used during day-to-day administration.</p>

        <h3>Veeam backup oversight</h3>
        <p>The backup module consolidates status from two Veeam servers, covering approximately 150 VM backups.</p>
        <p>The team can review running jobs, jobs with issues, disabled jobs, protected objects, repositories and VMs identified as unprotected from one location. Detailed reports cover backup objects, jobs, managed servers, proxies, repositories, restore points and sessions.</p>
        <p>This provides a consistent way to review backup status and investigate protection gaps across the team's environment.</p>

        <h3>VMware host and VM health</h3>
        <p>The VMware module gives the team a central view of 16 ESXi hosts across three sites, supporting daily host health checks without logging in to each host separately.</p>
        <p>It includes host, VM and datastore details, snapshots, powered-off VMs, disk-space issues, hardware issues and system-health information.</p>
        <p>Checks for disk-space and hardware issues across approximately 350 VMs run every 24 hours. WebSockets support interface updates, while the freshness of individual readings depends on each collector's schedule.</p>
      </section>

      <section id="outcome">
        <p className="case-section-label">04 · Outcome</p>
        <h2>Audit reports in seconds, with historical evidence.</h2>
        <p>The clearest improvement is antivirus audit reporting. A process that required manually checking approximately 105 desktops now produces report exports in seconds. Storing daily reports also makes historical evidence available, rather than relying only on point-in-time checks.</p>
        <p>Active Directory evidence can be presented directly during audits, reducing the need to assemble spreadsheets beforehand. Host health and backup status can be reviewed centrally, and certificate notifications provide advance notice at defined points before expiry.</p>
        <p>For the four-person IT team, the application brings recurring checks and reporting tasks into one maintained tool. For me, it developed from a practical way to learn Go into a production application that combines software development with the infrastructure work I continue to perform.</p>
      </section>
    </CaseStudy>
  );
}
