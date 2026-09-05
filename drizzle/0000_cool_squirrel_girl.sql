CREATE TABLE `contact_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `contact_limits_expiry_idx` ON `contact_limits` (`expires_at`);