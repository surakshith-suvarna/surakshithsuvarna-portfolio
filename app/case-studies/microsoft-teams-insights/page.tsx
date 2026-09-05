import type { Metadata } from "next";
import CaseStudy from "../../case-study";

export const metadata: Metadata = {
  title: "Microsoft Teams Insights — Surakshith Suvarna",
  description: "An on-premises Microsoft Teams meeting-insights application researched, designed, built and maintained by Surakshith Suvarna.",
  alternates: { canonical: "/case-studies/microsoft-teams-insights" },
  openGraph: {
    type: "article",
    title: "Microsoft Teams Insights",
    description: "Automated meeting notes and reusable follow-up context for an 80-person workforce.",
    url: "/case-studies/microsoft-teams-insights",
    publishedTime: "2026-08-23T04:06:30Z",
    modifiedTime: "2026-08-30T12:33:20Z",
    authors: ["https://surakshithsuvarna.com"],
    images: [{ url: "https://surakshithsuvarna.com/social/microsoft-teams-insights.png", width: 1200, height: 630, alt: "Microsoft Teams Insights — supporting an 80-person workforce" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Microsoft Teams Insights",
    description: "Automated meeting notes and follow-up intelligence in Microsoft Teams.",
    images: ["https://surakshithsuvarna.com/social/microsoft-teams-insights.png"],
  },
};

export default function TeamsInsightsCaseStudy() {
  return (
    <CaseStudy
      eyebrow="Collaboration · Applied AI"
      title="Microsoft Teams Insights"
      introduction="An on-premises Teams application that turns meeting recordings and transcripts into consistent notes, summaries and reusable context for follow-on meetings."
      canonicalPath="/case-studies/microsoft-teams-insights"
      description="An on-premises Microsoft Teams meeting-insights application researched, designed, built and maintained by Surakshith Suvarna."
      image="https://surakshithsuvarna.com/social/microsoft-teams-insights.png"
      datePublished="2026-08-23T04:06:30Z"
      dateModified="2026-08-30T12:33:20Z"
      keywords={["Microsoft Teams", "meeting insights", "Go", "React", "RabbitMQ", "SigNoz", "Microsoft Fluent UI"]}
      metrics={[
        { value: "≈80", label: "Employees supported" },
        { value: "Jan 2025", label: "In production since" },
        { value: "End-to-end", label: "Personal ownership" },
        { value: "Active", label: "Production status" },
      ]}
      technologies={["Go", "React", "Microsoft Fluent UI", "RabbitMQ", "SigNoz", "Microsoft change notifications", "Webhooks", "Teams Tab App", "Microsoft identity", "On-premises deployment"]}
      nextHref="/case-studies/primary-datacentre-migration"
      nextLabel="Primary Datacentre Migration"
    >
      <section id="challenge">
        <p className="case-section-label">01 · Challenge</p>
        <h2>Coordinators were splitting their attention between the meeting and the notes.</h2>
        <p>Meeting coordinators needed to participate in calls while also creating an accurate record of the discussion. Concentrating on note-taking made it harder to stay engaged, and the quality and consistency of meeting artefacts could vary.</p>
        <p>The goal was to automate that work without moving the application itself away from the organisation’s on-premises environment.</p>
      </section>

      <section id="ownership">
        <p className="case-section-label">02 · Ownership</p>
        <h2>A complete solution researched, designed and built independently.</h2>
        <p>I researched, designed and built the entire application and remain its sole maintainer, responsible for production support, upgrades and continued development.</p>
        <p>The work covered the Go backend, webhook-based Microsoft change-notification integration, RabbitMQ processing queues, SigNoz telemetry, on-premises deployment and the React and Microsoft Fluent UI experience presented within Teams as a tab application.</p>
      </section>

      <section id="approach">
        <p className="case-section-label">03 · Approach</p>
        <h2>React to Teams events, then return the useful context to Teams.</h2>
        <p>The application subscribes to Microsoft change notifications for meeting recordings and transcripts. Microsoft publishes each notification to a webhook exposed by the Go backend. The application then retrieves the relevant meeting artefacts and uses RabbitMQ to queue them for processing.</p>
        <p>Summaries and structured notes are presented through a Teams tab built with React and Microsoft Fluent UI, allowing participants to use the output in the same collaboration environment as the meeting. SigNoz provides application telemetry for monitoring and operational investigation.</p>
        <p>Access is provided through the Microsoft identity and Teams context, while retention and additional security controls continue to be expanded as part of the development roadmap.</p>
        <p>The most significant engineering challenge was integrating cloud-hosted Microsoft APIs with an on-premises application. Available documentation did not fully cover the combination of recording notifications, transcript processing and Teams tab integration, requiring detailed research and iterative testing.</p>
      </section>

      <section id="outcome">
        <p className="case-section-label">04 · Outcome</p>
        <h2>More attention in the meeting and more reliable artefacts afterwards.</h2>
        <p>The application is used across a workforce of approximately 80 employees and has been in active production since January 2025.</p>
        <p>Automated note-taking allows coordinators to concentrate on the conversation instead of documenting it manually. The resulting notes are more consistent and are reused as previous-meeting context during follow-on discussions.</p>
      </section>
    </CaseStudy>
  );
}
