"use client";

import { FormEvent, useRef, useState } from "react";

type RecaptchaApi = {
  ready: (callback: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
};

declare global {
  interface Window {
    grecaptcha?: RecaptchaApi;
  }
}

type FormStatus = "idle" | "submitting" | "success" | "error";
type RecaptchaContext = { api: RecaptchaApi; siteKey: string };

export default function ContactForm() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const recaptchaPromiseRef = useRef<Promise<RecaptchaContext> | null>(null);

  const ensureRecaptcha = () => {
    if (recaptchaPromiseRef.current) return recaptchaPromiseRef.current;

    recaptchaPromiseRef.current = fetch("/api/contact-config", { headers: { accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) throw new Error("The contact form is temporarily unavailable.");
        const data = (await response.json()) as { siteKey?: string };
        if (!data.siteKey) throw new Error("The contact form is temporarily unavailable.");
        return data.siteKey;
      })
      .then((siteKey) => new Promise<RecaptchaContext>((resolve, reject) => {
        const fail = () => reject(new Error("The security check could not load. Please try again."));
        const markReady = () => {
          const api = window.grecaptcha;
          if (!api) {
            fail();
            return;
          }
          api.ready(() => resolve({ api, siteKey }));
        };

        if (window.grecaptcha) {
          markReady();
          return;
        }

        const existingScript = document.querySelector<HTMLScriptElement>("script[data-recaptcha-script]");
        if (existingScript) {
          existingScript.addEventListener("load", markReady, { once: true });
          existingScript.addEventListener("error", fail, { once: true });
          return;
        }

        const script = document.createElement("script");
        script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}&trustedtypes=true`;
        script.async = true;
        script.defer = true;
        script.dataset.recaptchaScript = "true";
        script.addEventListener("load", markReady, { once: true });
        script.addEventListener("error", fail, { once: true });
        document.head.appendChild(script);
      }))
      .catch((error) => {
        recaptchaPromiseRef.current = null;
        throw error;
      });

    return recaptchaPromiseRef.current;
  };

  const prepareSecurityCheck = () => {
    void ensureRecaptcha().catch(() => undefined);
  };

  const getRecaptchaToken = async () => {
    const { api, siteKey } = await ensureRecaptcha();
    try {
      return await api.execute(siteKey, { action: "portfolio_contact" });
    } catch {
      throw new Error("The security check could not run. Please try again.");
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
        body: JSON.stringify({
          name: fields.get("name"),
          email: fields.get("email"),
          message: fields.get("message"),
          company: fields.get("company"),
          recaptchaToken,
        }),
      });
      const result = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !result.ok) throw new Error(result.message || "Your message could not be sent.");

      setStatus("success");
      setStatusMessage(result.message || "Thanks — your message has been sent.");
      formRef.current?.reset();
    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "Your message could not be sent.");
    }
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
        Your details are used only to reply to this enquiry and are not stored on this site. Protected by reCAPTCHA; Google&apos;s <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a> and <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer">Terms</a> apply.
      </p>
    </form>
  );
}
