--> statement-breakpoint
CREATE TABLE "utm_tracking" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"session_id" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_content" text,
	"utm_term" text,
	"referrer" text,
	"landing_page" text,
	"user_agent" text,
	"ip" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "utm_source" text;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "utm_medium" text;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "utm_campaign" text;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "utm_content" text;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "utm_term" text;--> statement-breakpoint
ALTER TABLE "utm_tracking" ADD CONSTRAINT "utm_tracking_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_utm_tracking_user_id" ON "utm_tracking" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_utm_tracking_campaign" ON "utm_tracking" USING btree ("utm_campaign");--> statement-breakpoint
CREATE INDEX "idx_utm_tracking_created_at" ON "utm_tracking" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_utm_tracking_session_id" ON "utm_tracking" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_utm_tracking_campaign_created" ON "utm_tracking" USING btree ("utm_campaign","created_at");--> statement-breakpoint
CREATE INDEX "idx_order_utm_campaign" ON "order" USING btree ("utm_campaign");--> statement-breakpoint
CREATE INDEX "idx_order_utm_source" ON "order" USING btree ("utm_source");--> statement-breakpoint
CREATE INDEX "idx_order_utm_campaign_created" ON "order" USING btree ("utm_campaign","created_at");