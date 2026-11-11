CREATE TABLE "iap_google_purchase" (
	"id" text PRIMARY KEY NOT NULL,
	"server_order_no" text NOT NULL,
	"user_id" text NOT NULL,
	"platform" text DEFAULT 'google' NOT NULL,
	"package_name" text NOT NULL,
	"product_id" text NOT NULL,
	"product_type" text NOT NULL,
	"purchase_token" text NOT NULL,
	"order_id" text,
	"purchase_state" text NOT NULL,
	"verify_status" text NOT NULL,
	"entitlement_code" text NOT NULL,
	"entitlement_status" text NOT NULL,
	"acknowledgement_state" integer DEFAULT 0 NOT NULL,
	"purchase_time" timestamp,
	"start_at" timestamp,
	"expire_at" timestamp,
	"last_verified_at" timestamp DEFAULT now() NOT NULL,
	"last_notification_type" text,
	"last_notification_at" timestamp,
	"restore_task_id" text,
	"linked_order_no" text,
	"linked_subscription_no" text,
	"client_trace_id" text,
	"idempotency_key" text,
	"google_payload" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "iap_google_event" (
	"id" text PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"notification_type" text,
	"purchase_token" text,
	"package_name" text,
	"product_id" text,
	"process_status" text NOT NULL,
	"payload" text NOT NULL,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "iap_google_purchase" ADD CONSTRAINT "iap_google_purchase_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_iap_google_purchase_server_order_no" ON "iap_google_purchase" USING btree ("server_order_no");
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_iap_google_purchase_token" ON "iap_google_purchase" USING btree ("purchase_token");
--> statement-breakpoint
CREATE INDEX "idx_iap_google_purchase_user_status" ON "iap_google_purchase" USING btree ("user_id","entitlement_status","expire_at");
--> statement-breakpoint
CREATE INDEX "idx_iap_google_purchase_user_product" ON "iap_google_purchase" USING btree ("user_id","product_id","created_at");
--> statement-breakpoint
CREATE INDEX "idx_iap_google_purchase_order_id" ON "iap_google_purchase" USING btree ("order_id");
--> statement-breakpoint
CREATE INDEX "idx_iap_google_event_type_created" ON "iap_google_event" USING btree ("event_type","created_at");
--> statement-breakpoint
CREATE INDEX "idx_iap_google_event_token_created" ON "iap_google_event" USING btree ("purchase_token","created_at");
