import { reserveDelivery, reserveVerification, type LimitDatabase, type LimitResult } from "./contact-limits";
import { BodyError, readBoundedBody } from "./request-body";

export interface ContactEnv {
  DB?: LimitDatabase;
  RECAPTCHA_SITE_KEY?: string;
  RECAPTCHA_PROJECT_ID?: string;
  RECAPTCHA_API_KEY?: string;
  RECAPTCHA_MIN_SCORE?: string;
  RESEND_API_KEY?: string;
  CONTACT_TO?: string;
  CONTACT_FROM?: string;
}

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  company?: unknown;
  recaptchaToken?: unknown;
};

const CONTACT_ACTION = "portfolio_contact";
const GOOGLE_ASSESSMENT_ERRORS = new Set([
  "API_KEY_INVALID",
  "API_KEY_EXPIRED",
  "API_KEY_SERVICE_BLOCKED",
  "API_KEY_HTTP_REFERRER_BLOCKED",
  "API_KEY_IP_ADDRESS_BLOCKED",
  "BILLING_DISABLED",
  "SERVICE_DISABLED",
  "CONSUMER_INVALID",
  "INVALID_ARGUMENT",
  "NOT_FOUND",
  "PERMISSION_DENIED",
  "RESOURCE_EXHAUSTED",
]);

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });

const cleanSingleLine = (value: unknown, maxLength: number) =>
  typeof value === "string" ? value.trim().replace(/[\r\n]+/g, " ").slice(0, maxLength) : "";

const cleanMessage = (value: unknown) =>
  typeof value === "string" ? value.trim().slice(0, 3000) : "";

const isEmail = (value: string) =>
  value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const limited = ({ retryAfter }: LimitResult) => {
  const response = json({ ok: false, message: "Too many enquiries. Please try again later." }, 429);
  response.headers.set("retry-after", String(retryAfter));
  return response;
};

const unavailable = () => json({ ok: false, message: "The contact form is temporarily unavailable. Please try again later." }, 503);

function contactConfiguration(env: ContactEnv) {
  const { DB, RECAPTCHA_SITE_KEY: siteKey, RECAPTCHA_PROJECT_ID: projectId,
    RECAPTCHA_API_KEY: apiKey, RESEND_API_KEY: resendKey, CONTACT_TO: to, CONTACT_FROM: from } = env;
  if (!DB || !siteKey?.trim() || !projectId?.trim() || !apiKey?.trim() ||
      !resendKey || !to || !from) return null;
  return { DB, siteKey: siteKey.trim(), projectId: projectId.trim(), apiKey: apiKey.trim(), resendKey, to, from };
}

export function getContactConfig(env: ContactEnv): Response {
  const config = contactConfiguration(env);
  if (!config) return json({ ok: false, message: "The contact form is not configured yet." }, 503);
  return json({ siteKey: config.siteKey });
}

async function verifyRecaptcha(
  config: { projectId: string; siteKey: string; apiKey: string },
  token: string,
  hostname: string,
  minimumScore: number,
  remoteIp: string | null,
): Promise<boolean> {
  const endpoint = `https://recaptchaenterprise.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/assessments`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": config.apiKey },
    body: JSON.stringify({
      event: {
        token,
        siteKey: config.siteKey,
        expectedAction: CONTACT_ACTION,
        userIpAddress: remoteIp ?? undefined,
      },
    }),
    redirect: "manual",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const error = isRecord(body) && isRecord(body.error) ? body.error : undefined;
    const detail = Array.isArray(error?.details)
      ? error.details.find((item) => isRecord(item) && item["@type"] === "type.googleapis.com/google.rpc.ErrorInfo")
      : undefined;
    const reason = typeof detail?.reason === "string" && GOOGLE_ASSESSMENT_ERRORS.has(detail.reason)
      ? detail.reason
      : typeof error?.status === "string" && GOOGLE_ASSESSMENT_ERRORS.has(error.status)
        ? error.status
        : undefined;
    console.warn("reCAPTCHA assessment HTTP failure", { status: response.status, reason });
    throw new Error("Assessment HTTP failure");
  }

  const assessment: unknown = await response.json();
  if (!isRecord(assessment) || !isRecord(assessment.tokenProperties)) {
    throw new Error("Missing assessment token properties");
  }
  const { valid, invalidReason, action, hostname: tokenHostname } = assessment.tokenProperties;
  // Google may omit a default false boolean from its JSON response.
  if (valid === false || (valid === undefined && typeof invalidReason === "string" && invalidReason)) {
    return false;
  }

  const score = isRecord(assessment.riskAnalysis) ? assessment.riskAnalysis.score : undefined;
  if (valid !== true || typeof action !== "string" || typeof tokenHostname !== "string" ||
    typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 1) {
    throw new Error("Invalid assessment fields");
  }
  return action === CONTACT_ACTION && tokenHostname === hostname && score >= minimumScore;
}

export async function handleContact(request: Request, env: ContactEnv): Promise<Response> {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  const contentType = request.headers.get("content-type") ?? "";
  const declaredLength = Number(request.headers.get("content-length") ?? 0);

  if (!origin || origin !== requestUrl.origin) {
    return json({ ok: false, message: "This submission could not be verified." }, 403);
  }

  if (contentType.split(";", 1)[0].trim().toLowerCase() !== "application/json") {
    return json({ ok: false, message: "The submission format is not valid." }, 415);
  }
  if (declaredLength > 16_384) return json({ ok: false, message: "The message is too long." }, 413);

  const config = contactConfiguration(env);
  if (!config) return unavailable();

  let payload: ContactPayload;
  try {
    const parsed: unknown = JSON.parse(await readBoundedBody(request));
    if (!isRecord(parsed)) throw new Error("Invalid shape");
    payload = parsed;
  } catch (error) {
    if (error instanceof BodyError) return json({ ok: false, message: error.status === 413 ? "The message is too long." : "The submission timed out. Please try again." }, error.status);
    return json({ ok: false, message: "The submission format is not valid." }, 400);
  }

  for (const [field, maximum] of [["name", 80], ["email", 254], ["message", 3000], ["recaptchaToken", 4096], ["company", 120]] as const) {
    const value = payload[field];
    if (field === "company" && value === undefined) continue;
    if (typeof value !== "string" || value.length > maximum) {
      return json({ ok: false, message: "Please check the fields and their length limits." }, 400);
    }
  }

  const name = cleanSingleLine(payload.name, 80);
  const email = cleanSingleLine(payload.email, 254).toLowerCase();
  const message = cleanMessage(payload.message);
  const company = cleanSingleLine(payload.company, 120);
  const recaptchaToken = cleanSingleLine(payload.recaptchaToken, 4096);

  // A hidden field catches basic form-filling bots without inconveniencing visitors.
  if (company) {
    return json({ ok: true, message: "Thanks — your message has been sent." });
  }

  if (name.length < 2 || !isEmail(email) || message.length < 20 || !recaptchaToken) {
    return json({ ok: false, message: "Please complete every field and the security check." }, 400);
  }

  const remoteIp = request.headers.get("cf-connecting-ip");
  try {
    const limit = await reserveVerification(config.DB, remoteIp || "unknown", config.apiKey);
    if (!limit.allowed) return limited(limit);
  } catch {
    console.error("Contact abuse protection unavailable");
    return unavailable();
  }

  const configuredScore = Number(env.RECAPTCHA_MIN_SCORE?.trim() || "0.5");
  const minimumScore = Number.isFinite(configuredScore) && configuredScore >= 0 && configuredScore <= 1
    ? configuredScore
    : 0.5;
  let verified: boolean;
  try {
    verified = await verifyRecaptcha(config, recaptchaToken, requestUrl.hostname, minimumScore, remoteIp);
  } catch (error) {
    if (error instanceof Error && error.message !== "Assessment HTTP failure") {
      console.warn("reCAPTCHA assessment unavailable", {
        category: error.name === "TimeoutError" ? "timeout"
          : error.name === "SyntaxError" ? "invalid_json"
          : error.message === "Missing assessment token properties" ? "missing_token_properties"
          : error.message === "Invalid assessment fields" ? "invalid_assessment_fields"
          : /header|bytestring|invalid (?:value|character)/i.test(error.message) ? "invalid_request_header"
          : /dns|resolve host/i.test(error.message) ? "dns"
          : /tls|certificate|ssl/i.test(error.message) ? "tls"
          : /not allowed|denied|blocked|disallowed/i.test(error.message) ? "blocked_transport"
          : /connection lost|reset|disconnected|socket/i.test(error.message) ? "network_connection"
          : "transport",
      });
    }
    return json({ ok: false, message: "The security check is unavailable. Please try again." }, 502);
  }
  if (!verified) return json({ ok: false, message: "The security check failed. Please try again." }, 400);

  const emailText = [
    "New portfolio contact submission",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Page: ${origin}`,
    "",
    "Message:",
    message,
  ].join("\n");

  try {
    const limit = await reserveDelivery(config.DB);
    if (!limit.allowed) return limited(limit);
  } catch {
    console.error("Contact delivery budget unavailable");
    return unavailable();
  }

  try {
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.resendKey}`,
        "content-type": "application/json",
        "idempotency-key": `portfolio-contact-${crypto.randomUUID()}`,
      },
      body: JSON.stringify({
        from: config.from,
        to: [config.to],
        reply_to: email,
        subject: `Portfolio enquiry from ${name}`,
        text: emailText,
      }),
      signal: AbortSignal.timeout(8_000),
    });

    if (!resendResponse.ok) {
      console.error("Contact delivery failed", { status: resendResponse.status });
      return json({ ok: false, message: "Your message could not be sent. Please try again later." }, 502);
    }
  } catch {
    return json({ ok: false, message: "Your message could not be sent. Please try again later." }, 502);
  }

  return json({ ok: true, message: "Thanks — your message has been sent." });
}
