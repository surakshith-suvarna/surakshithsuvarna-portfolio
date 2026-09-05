"use client";

import { FormEvent, useRef, useState } from "react";
import { ensureRecaptcha, withDeadline } from "./recaptcha";

type FormStatus = "idle" | "submitting" | "success" | "error";

export default function ContactForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const submittingRef = useRef(false);

  const prepareSecurityCheck = () => {
    void ensureRecaptcha().catch(() => undefined);
  };

  const getRecaptchaToken = async () => {
    const { api, siteKey } = await ensureRecaptcha();
    try {
      return await withDeadline(api.execute(siteKey, { action: "portfolio_contact" }), 10_000, "The security check timed out. Please try again.");
    } catch {
      throw new Error("The security check could not run. Please try again.");
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    const form = event.currentTarget;
    const fields = new FormData(form);
    setStatus("submitting");
    setStatusMessage("Sending your message…");

    try {
      // v3 tokens expire quickly, so generate one only when the visitor submits.
      const recaptchaToken = await getRecaptchaToken();
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        signal: AbortSignal.timeout(25_000),
        body: JSON.stringify({
          name: fields.get("name"),
          email: fields.get("email"),
          message: fields.get("message"),
          company: fields.get("company"),
          recaptchaToken,
        }),
      });
      const result: unknown = await response.json();
      if (!result || typeof result !== "object" || !("ok" in result)) throw new Error("Your message could not be sent. Please try again later.");
      const message = "message" in result && typeof result.message === "string" ? result.message : "";

      if (!response.ok || result.ok !== true) throw new Error(message || "Your message could not be sent.");

      setStatus("success");
      setStatusMessage(message || "Thanks — your message has been sent.");
      formRef.current?.reset();
    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error && error.name !== "TimeoutError" && error.name !== "AbortError" ? error.message : "Your message could not be sent. Please try again later.");
    } finally { submittingRef.current = false; }
  };

  return (
    <form className="contact-form" ref={formRef} onSubmit={submit} onFocusCapture={prepareSecurityCheck} onPointerEnter={prepareSecurityCheck} aria-busy={status === "submitting"}>
      <div className="contact-field">
        <label htmlFor="contact-name">Name</label>
        <input id="contact-name" name="name" type="text" autoComplete="name" minLength={2} maxLength={80} required />
      </div>
      <div className="contact-field">
        <label htmlFor="contact-email">Email</label>
        <input id="contact-email" name="email" type="email" autoComplete="email" maxLength={254} required />
      </div>
      <div className="contact-field contact-field-wide">
        <label htmlFor="contact-message">How can I help?</label>
        <textarea id="contact-message" name="message" minLength={20} maxLength={3000} rows={7} required />
      </div>
      <div className="contact-honeypot" aria-hidden="true">
        <label htmlFor="contact-company">Company website</label>
        <input id="contact-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="contact-submit-row">
        <button className="contact-submit" type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Sending…" : "Send message"} <span aria-hidden="true">↗</span>
        </button>
        <p className={`contact-status contact-status-${status}`} role={status === "error" ? "alert" : "status"} aria-live="polite">
          {statusMessage}
        </p>
      </div>
      <p className="contact-privacy">
        Your enquiry is emailed for a reply; its contents are not stored on this site. Temporary security counters help prevent spam. Protected by reCAPTCHA; Google&apos;s <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Terms</a> apply.
      </p>
    </form>
  );
}
