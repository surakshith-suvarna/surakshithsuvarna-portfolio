type RecaptchaApi = {
  ready(callback: () => void): void;
  execute(siteKey: string, options: { action: string }): Promise<string>;
};
declare global { interface Window { grecaptcha?: RecaptchaApi } }
type RecaptchaContext = { api: RecaptchaApi; siteKey: string };

export async function withDeadline<T>(operation: Promise<T>, milliseconds: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([operation, new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), milliseconds);
    })]);
  } finally { clearTimeout(timer); }
}

// Shared across form remounts. Failure resets the promise and removes the script
// and its listeners, so a later interaction makes a real new loading attempt.
export function createRecaptchaLoader(timeoutMs = 10_000) {
  let pending: Promise<RecaptchaContext> | null = null;
  return function load(): Promise<RecaptchaContext> {
    if (pending) return pending;
    pending = withDeadline((async () => {
      const response = await fetch("/api/contact-config", {
        headers: { accept: "application/json" }, signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) throw new Error("The contact form is temporarily unavailable.");
      const data: unknown = await response.json();
      if (!data || typeof data !== "object" || !("siteKey" in data) || typeof data.siteKey !== "string" || !data.siteKey) throw new Error("The contact form is temporarily unavailable.");
      return data.siteKey;
    })(), timeoutMs, "The contact form could not load. Please try again.")
      .then((siteKey) => new Promise<RecaptchaContext>((resolve, reject) => {
        const script = document.createElement("script");
        let settled = false;
        const cleanup = () => {
          clearTimeout(timer);
          script.removeEventListener("load", loaded);
          script.removeEventListener("error", failed);
        };
        const failed = () => {
          if (settled) return;
          settled = true;
          cleanup();
          script.remove();
          reject(new Error("The security check could not load. Please try again."));
        };
        const loaded = () => {
          const api = window.grecaptcha;
          if (!api) { failed(); return; }
          try {
            api.ready(() => {
              if (settled) return;
              settled = true;
              cleanup();
              resolve({ api, siteKey });
            });
          } catch { failed(); }
        };
        const timer = setTimeout(failed, timeoutMs);
        script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}&trustedtypes=true`;
        script.async = true;
        script.defer = true;
        script.dataset.recaptchaScript = "true";
        script.addEventListener("load", loaded);
        script.addEventListener("error", failed);
        document.head.appendChild(script);
      }))
      .catch((error) => { pending = null; throw error; });
    return pending;
  };
}

export const ensureRecaptcha = createRecaptchaLoader();
