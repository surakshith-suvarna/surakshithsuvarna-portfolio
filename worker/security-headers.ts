export function withSecurityHeaders(response: Response, request: Request): Response {
  const headers = new Headers(response.headers);
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  const url = new URL(request.url);
  if (url.protocol === "https:" && ["surakshithsuvarna.com", "www.surakshithsuvarna.com"].includes(url.hostname)) {
    // No includeSubDomains or preload: unrelated mail/app hosts are out of scope.
    headers.set("strict-transport-security", "max-age=31536000");
  }
  if (headers.get("content-type")?.includes("text/html")) {
    // Allow the site's own frames and the ChatGPT Sites workspace. X-Frame-Options
    // cannot express this intended cross-origin parent; frame-ancestors can.
    const base = "base-uri 'self'; object-src 'none'; frame-ancestors 'self' https://chatgpt.com";
    headers.set("content-security-policy", base);
    // Stage script restrictions without breaking streamed React bootstrap or
    // hosting-injected scripts. Browser validation is required before enforcing.
    headers.set("content-security-policy-report-only", `${base}; default-src 'self'; script-src 'self' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://challenges.cloudflare.com https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://www.gstatic.com https://www.google.com; font-src 'self'; connect-src 'self' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/ https://cloudflareinsights.com; frame-src https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/ https://challenges.cloudflare.com; form-action 'self'`);
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
