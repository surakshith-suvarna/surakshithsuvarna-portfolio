import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Only expiring abuse counters are persisted, never enquiry content or raw IPs.
export const contactLimits = sqliteTable("contact_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  expiresAt: integer("expires_at").notNull(),
}, (table) => [index("contact_limits_expiry_idx").on(table.expiresAt)]);
