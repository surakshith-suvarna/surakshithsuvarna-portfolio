// Atomic counters on the shared D1 primary, not an isolate-local IP map.
export interface LimitDatabase {
  prepare(sql: string): LimitStatement;
}
interface LimitStatement {
  bind(...values: (string | number)[]): LimitStatement;
  all(): Promise<{ results: unknown[] }>;
}

export type LimitResult = { allowed: boolean; retryAfter: number };

const MAX_IP_COUNTERS = 480;

async function reserveIp(db: LimitDatabase, identifier: string, now: number): Promise<LimitResult> {
  const expires = (Math.floor(now / 900) + 1) * 900;
  const key = `ip:${identifier}:${expires}`;
  // Bound new IP rows in the same atomic statement that inserts them. Existing
  // counters remain usable at capacity; a rejected insert spends no global slot.
  const result = await db.prepare(`
    INSERT INTO contact_limits (key, count, expires_at)
    SELECT ?, 1, ?
    WHERE EXISTS (SELECT 1 FROM contact_limits WHERE key = ?)
       OR (SELECT COUNT(*) FROM contact_limits WHERE key >= 'ip:' AND key < 'ip;') < ?
    ON CONFLICT(key) DO UPDATE SET count = count + 1
    WHERE count < 5
    RETURNING count
  `).bind(key, expires, key, MAX_IP_COUNTERS).all();
  return { allowed: result.results.length === 1, retryAfter: Math.max(1, expires - now) };
}

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
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`portfolio-contact-limit:${Math.floor(now / 900)}:${ip}`));
  const identifier = Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const perIp = await reserveIp(db, identifier, now);
  if (!perIp.allowed) return perIp;
  // Only IP-admitted requests may consume verification capacity. Keep this
  // before Google verification to bound provider calls, including invalid tokens.
  return reserve(db, "verification", 120, 3600, now);
}

export function reserveDelivery(db: LimitDatabase, now = Math.floor(Date.now() / 1000)): Promise<LimitResult> {
  // Reserve before delivery, including failed/ambiguous provider calls.
  return reserve(db, "delivery", 20, 86400, now);
}
