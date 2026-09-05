import type { Metadata } from "next";
import CaseStudy from "../../case-study";

export const metadata: Metadata = {
  title: "3CX Post-Call Analytics — Surakshith Suvarna",
  description: "How Surakshith Suvarna designed and built an AI-assisted post-call system that processes approximately 250 customer-service calls each day.",
  alternates: { canonical: "/case-studies/3cx-post-call-analytics" },
  openGraph: {
    type: "article",
    title: "3CX Post-Call Analytics",
    description: "AI-assisted call documentation, built in 15 days and running in production since September 2023.",
    url: "/case-studies/3cx-post-call-analytics",
    publishedTime: "2026-08-23T04:06:30Z",
    modifiedTime: "2026-08-30T12:33:20Z",
    authors: ["https://surakshithsuvarna.com"],
    images: [{ url: "https://surakshithsuvarna.com/social/3cx-post-call-analytics.png", width: 1200, height: 630, alt: "3CX Post-Call Analytics — approximately 250 calls processed daily" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "3CX Post-Call Analytics",
    description: "AI-assisted call documentation processing approximately 250 calls each day.",
    images: ["https://surakshithsuvarna.com/social/3cx-post-call-analytics.png"],
  },
};

export default function ThreeCXCaseStudy() {
  return (
    <CaseStudy
      eyebrow="AI · Workflow automation"
      title="3CX Post-Call Analytics"
      introduction="An AI-assisted production system that turns call recordings into consistent notes and structured insights—reducing manual wrap-up work and helping customer-service agents move to the next conversation sooner."
      canonicalPath="/case-studies/3cx-post-call-analytics"
      description="How Surakshith Suvarna designed and built an AI-assisted post-call system that processes approximately 250 customer-service calls each day."
      image="https://surakshithsuvarna.com/social/3cx-post-call-analytics.png"
      datePublished="2026-08-23T04:06:30Z"
      dateModified="2026-08-30T12:33:20Z"
      keywords={["3CX", "call analytics", "AssemblyAI", "Gemini 2.5 Flash", "Go", "workflow automation", "MySQL"]}
      metrics={[
        { value: "15 days", label: "Research, design and build" },
        { value: "≈250", label: "Calls processed each day" },
        { value: "<1 min", label: "Typical processing time" },
        { value: "Sep 2023", label: "In production since" },
      ]}
      technologies={["Go", "3CX", "AssemblyAI Async Transcription API", "AssemblyAI LLM Gateway", "Google Gemini 2.5 Flash", "MySQL"]}
      nextHref="/case-studies/microsoft-teams-insights"
      nextLabel="Microsoft Teams Insights"
    >
      <section id="challenge">
        <p className="case-section-label">01 · Challenge</p>
        <h2>Manual notes were extending the time between calls.</h2>
        <p>Customer-service agents had to document each conversation after the caller disconnected. That post-call work delayed agents from accepting the next call, increased queue times and contributed to customers abandoning calls while waiting.</p>
        <p>As call volumes grew, the team also needed a more consistent way to capture outcomes and identify the issues driving customer contact. Leaving the process unchanged would have increased pressure on the call-taking team and made operational analysis dependent on variable manual notes.</p>
      </section>

      <section id="ownership">
        <p className="case-section-label">02 · Ownership</p>
        <h2>From AI research to a production processing workflow.</h2>
        <p>I researched how AI could be integrated with the existing 3CX recording workflow, then designed and built the post-call processing solution in 15 days.</p>
        <p>My responsibility covered transcription, insight extraction and storing structured results in MySQL. The internal development team integrated that data with the in-house CRM, while the BI team incorporated it into custom management dashboards for call-driver analysis.</p>
      </section>

      <section id="approach">
        <p className="case-section-label">03 · Approach</p>
        <h2>Convert every recording into structured, reusable context.</h2>
        <p>After 3CX generates a recording, the application submits it to AssemblyAI’s asynchronous transcription API. The completed transcript is then processed through AssemblyAI’s LLM Gateway using Google Gemini 2.5 Flash.</p>
        <p>The workflow extracts a concise summary, issues raised during the conversation, the final outcome and relevant customer details. These results are stored in MySQL for downstream CRM and business-intelligence integrations.</p>
        <p>The system processes approximately 250 calls each day. Once a recording becomes available, transcription and insight extraction normally complete within one minute.</p>
      </section>

      <section id="outcome">
        <p className="case-section-label">04 · Outcome</p>
        <h2>Less wrap-up work and better context for the next interaction.</h2>
        <p>Automated note-taking removed much of the manual work previously required after customer calls. Agents can move to their next conversation sooner, helping reduce queue times and the associated risk of abandoned calls.</p>
        <p>Consistent records also give agents better context during follow-up conversations. Management can use the structured information to investigate recurring issues and identify the major reasons customers contact the support team.</p>
      </section>
    </CaseStudy>
  );
}
