CREATE TABLE `records` (
	`id` text NOT NULL,
	`workspace_id` text NOT NULL,
	`kind` text NOT NULL,
	`data` text NOT NULL,
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `records_identity` ON `records` (`workspace_id`,`kind`,`id`);--> statement-breakpoint
CREATE INDEX `records_workspace` ON `records` (`workspace_id`);--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `workspaces_token_hash_unique` ON `workspaces` (`token_hash`);