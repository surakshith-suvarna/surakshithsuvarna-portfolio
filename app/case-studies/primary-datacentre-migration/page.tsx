import type { Metadata } from "next";
import CaseStudy from "../../case-study";

export const metadata: Metadata = {
  title: "Primary Datacentre Migration — Surakshith Suvarna",
  description: "A phased VMware vSphere 7 datacentre migration of approximately 230 production and VDI virtual machines with minimal service disruption.",
  alternates: { canonical: "/case-studies/primary-datacentre-migration" },
  openGraph: {
    type: "article",
    title: "Primary Datacentre Migration",
    description: "Planning and executing a vSphere 7 migration during lockdown with minimal production interruption.",
    url: "/case-studies/primary-datacentre-migration",
    publishedTime: "2026-08-23T04:06:30Z",
    modifiedTime: "2026-08-24T23:28:13Z",
    authors: ["https://www.surakshithsuvarna.com"],
    images: [{ url: "https://www.surakshithsuvarna.com/social/primary-datacentre-migration-v2.png", width: 1200, height: 630, alt: "Primary Datacentre Migration — one-to-two-minute cutover per production VM" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Primary Datacentre Migration",
    description: "A vSphere 7 migration balancing continuity, rollback readiness and cross-team validation.",
    images: ["https://www.surakshithsuvarna.com/social/primary-datacentre-migration-v2.png"],
  },
};

export default function DatacentreMigrationCaseStudy() {
  return (
    <CaseStudy
      eyebrow="Infrastructure · Migration"
      title="Primary Datacentre Migration"
      introduction="A phased vSphere 7 datacentre migration completed during the COVID-19 lockdown, with replicated production workloads, planned rollback paths and coordinated application-level validation."
      canonicalPath="/case-studies/primary-datacentre-migration"
      description="A phased VMware vSphere 7 datacentre migration of approximately 230 production and VDI virtual machines with minimal service disruption."
      image="https://www.surakshithsuvarna.com/social/primary-datacentre-migration-v2.png"
      datePublished="2026-08-23T04:06:30Z"
      dateModified="2026-08-24T23:28:13Z"
      keywords={["VMware vSphere 7", "datacentre migration", "vSphere Replication", "VDI", "disaster recovery", "infrastructure"]}
      metrics={[
        { value: "≈230", label: "Production and VDI VMs" },
        { value: "1 month", label: "Phased delivery" },
        { value: "1–2 min", label: "Per production VM cutover" },
        { value: "Dec 2020", label: "Migration completed" },
      ]}
      technologies={["VMware vSphere 7", "vSphere Replication", "VMware VDI", "Disaster recovery", "Application-level validation"]}
      nextHref="/case-studies/3cx-post-call-analytics"
      nextLabel="3CX Post-Call Analytics"
    >
      <section id="challenge">
        <p className="case-section-label">01 · Challenge</p>
        <h2>Move critical infrastructure within tightly constrained downtime.</h2>
        <p>During the December 2020 COVID-19 lockdown, the organisation needed to relocate its primary datacentre infrastructure while maintaining the availability of customer-facing services.</p>
        <p>The vSphere 7 estate included approximately 130 production virtual machines, a four-node VDI cluster supporting approximately 100 virtual machines and a separate disaster-recovery environment. The principal risk was the limited maintenance window available for critical workloads.</p>
      </section>

      <section id="ownership">
        <p className="case-section-label">02 · Ownership</p>
        <h2>Primary technical ownership of planning and execution.</h2>
        <p>I was the primary person responsible for planning and executing the migration. Management handled formal approvals, while my reporting manager coordinated with application, development, QA and database teams during migration and validation activities.</p>
        <p>I created the workload plan, mapped virtual machines to their associated applications and services, selected the migration approach for each environment and coordinated the technical cutovers.</p>
      </section>

      <section id="approach">
        <p className="case-section-label">03 · Approach</p>
        <h2>Pre-stage production workloads and migrate in controlled batches.</h2>
        <p>The programme was completed in batches over approximately one month. Production virtual machines were synchronised to the new datacentre using vSphere Replication, allowing replicated instances to be prepared before each final cutover.</p>
        <p>The VDI and disaster-recovery clusters were moved using a lift-and-shift approach. A detailed plan mapped each VM to the services supporting the organisation’s applications, enabling development, QA, application and database specialists to validate the correct systems after each move.</p>
        <p>For replicated production workloads, the original virtual machines remained available as a rollback option until the migrated services passed both VM-level and application-level validation.</p>
      </section>

      <section id="outcome">
        <p className="case-section-label">04 · Outcome</p>
        <h2>Critical services moved with interruption measured in minutes.</h2>
        <p>Each replicated production VM typically experienced around one to two minutes of interruption during its final cutover.</p>
        <p>The disaster-recovery and VDI environments each required approximately three hours of downtime, remaining close to their planned migration windows. The migration was completed successfully during lockdown while keeping disruption to critical customer services to a minimum.</p>
      </section>
    </CaseStudy>
  );
}
