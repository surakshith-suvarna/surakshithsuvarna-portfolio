export interface ContactEnv {
  RECAPTCHA_SITE_KEY?: string;
  RECAPTCHA_SECRET_KEY?: string;
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

type RecaptchaResult = {
  success?: boolean;
  hostname?: string;
  action?: string;
  score?: number;
};

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

export function getContactConfig(env: ContactEnv): Response {
  if (!env.RECAPTCHA_SITE_KEY) {
    return json({ ok: false, message: "The contact form is not configured yet." }, 503);
  }

  return new Response(JSON.stringify({ siteKey: env.RECAPTCHA_SITE_KEY }), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "x-content-type-options": "nosniff",
    },
  });
}

export async function handleContact(request: Request, env: ContactEnv): Promise<Response> {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  const contentType = request.headers.get("content-type") ?? "";
  const declaredLength = Number(request.headers.get("content-length") ?? 0);

  if (!origin || origin !== requestUrl.origin) {
    return json({ ok: false, message: "This submission could not be verified." }, 403);
  }

  if (!contentType.includes("application/json") || declaredLength > 16_384) {
    return json({ ok: false, message: "The submission format is not valid." }, 415);
  }

  if (
    !env.RECAPTCHA_SECRET_KEY ||
    !env.RESEND_API_KEY ||
    !env.CONTACT_TO ||
    !env.CONTACT_FROM
  ) {
    return json({ ok: false, message: "The contact form is temporarily unavailable." }, 503);
  }

  let payload: ContactPayload;
  try {
    const rawBody = await request.text();
    if (rawBody.length > 12_000) {
      return json({ ok: false, message: "The message is too long." }, 413);
    }
    payload = JSON.parse(rawBody) as ContactPayload;
  } catch {
    return json({ ok: false, message: "The submission format is not valid." }, 400);
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

  const verificationBody = new URLSearchParams({
    secret: env.RECAPTCHA_SECRET_KEY,
    response: recaptchaToken,
  });
  const remoteIp = request.headers.get("cf-connecting-ip");
  if (remoteIp) verificationBody.set("remoteip", remoteIp);

  let verification: RecaptchaResult;
  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: verificationBody,
      signal: AbortSignal.timeout(8_000),
    });
    verification = (await response.json()) as RecaptchaResult;
  } catch {
    return json({ ok: false, message: "The security check is unavailable. Please try again." }, 502);
  }

  const configuredScore = Number(env.RECAPTCHA_MIN_SCORE ?? "0.5");
  const minimumScore = Number.isFinite(configuredScore) && configuredScore >= 0 && configuredScore <= 1
    ? configuredScore
    : 0.5;

  if (
    !verification.success ||
    verification.action !== "portfolio_contact" ||
    verification.hostname !== requestUrl.hostname ||
    typeof verification.score !== "number" ||
    verification.score < minimumScore
  ) {
    return json({ ok: false, message: "The security check failed. Please try again." }, 400);
  }

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
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
        "idempotency-key": `portfolio-contact-${crypto.randomUUID()}`,
      },
      body: JSON.stringify({
        from: env.CONTACT_FROM,
        to: [env.CONTACT_TO],
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
