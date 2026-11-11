CREATE TABLE "ip_blacklist" (
	"id" text PRIMARY KEY NOT NULL,
	"ip" text NOT NULL,
	"reason" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_by" text,
	CONSTRAINT "ip_blacklist_ip_unique" UNIQUE("ip")
);
--> statement-breakpoint
CREATE INDEX "idx_ip_blacklist_ip_status" ON "ip_blacklist" USING btree ("ip","status");--> statement-breakpoint
CREATE INDEX "idx_ip_blacklist_created_at" ON "ip_blacklist" USING btree ("created_at");--> statement-breakpoint

