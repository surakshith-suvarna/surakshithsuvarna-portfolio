// Atomic counters on the shared D1 primary, not an isolate-local IP map.
export interface LimitDatabase {
  prepare(sql: string): LimitStatement;
}
interface LimitStatement {
  bind(...values: (string | number)[]): LimitStatement;
  all(): Promise<{ results: unknown[] }>;
}

export type LimitResult = { allowed: boolean; retryAfter: number };

async function reserve(db: LimitDatabase, key: string, maximum: number, seconds: number, now: number): Promise<LimitResult> {
  const expires = (Math.floor(now / seconds) + 1) * seconds;
  const statement = db.prepare(`
    INSERT INTO contact_limits (key, count, expires_at) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET count = count + 1
    WHERE count < ?
    RETURNING count
  `).bind(`${key}:${expires}`, expires, maximum);
  const result = await statement.all();
  return { allowed: result.results.length === 1, retryAfter: Math.max(1, expires - now) };
}

export async function reserveVerification(db: LimitDatabase, ip: string, secret: string, now = Math.floor(Date.now() / 1000)): Promise<LimitResult> {
  // Cleanup on submissions; idle sites retain at most their last bounded window.
  await db.prepare("DELETE FROM contact_limits WHERE expires_at <= ?").bind(now).all();
  // Admission comes before creating IP rows: even rotating addresses cannot
  // grow the table without bound. Fixed windows permit a burst at a boundary.
  const global = await reserve(db, "verification", 120, 3600, now);
  if (!global.allowed) return global;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`portfolio-contact-limit:${Math.floor(now / 900)}:${ip}`));
  const identifier = Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return reserve(db, `ip:${identifier}`, 5, 900, now);
}

export function reserveDelivery(db: LimitDatabase, now = Math.floor(Date.now() / 1000)): Promise<LimitResult> {
  // Reserve before delivery, including failed/ambiguous provider calls.
  return reserve(db, "delivery", 20, 86400, now);
}
