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
CREATE TABLE "workbench_canvas_chat_message" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_id" text NOT NULL,
	"thread_id" text NOT NULL,
	"client_message_id" text,
	"role" text NOT NULL,
	"status" text DEFAULT 'completed' NOT NULL,
	"content" text NOT NULL,
	"parts_json" text NOT NULL,
	"attachments_json" text,
	"mentioned_references_json" text,
	"operations_json" text,
	"billing_json" text,
	"generation_json" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workbench_canvas_chat_message_attachment" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_id" text NOT NULL,
	"thread_id" text NOT NULL,
	"message_id" text NOT NULL,
	"asset_id" text NOT NULL,
	"kind" text DEFAULT 'image' NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL,
	"source" text DEFAULT 'upload' NOT NULL,
	"node_id" text,
	"label" text,
	"metadata_json" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workbench_canvas_chat_message_reference" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_id" text NOT NULL,
	"thread_id" text NOT NULL,
	"message_id" text NOT NULL,
	"mention_text" text NOT NULL,
	"mention_key" text NOT NULL,
	"target_type" text NOT NULL,
	"target_node_id" text,
	"target_asset_id" text,
	"relation" text DEFAULT 'reference' NOT NULL,
	"resolve_status" text DEFAULT 'resolved' NOT NULL,
	"resolve_strategy" text,
	"start_offset" integer,
	"end_offset" integer,
	"snapshot_json" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workbench_canvas_chat_thread" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_id" text NOT NULL,
	"session_id" text NOT NULL,
	"resource_id" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"last_message_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workbench_canvas_project" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"mode" text DEFAULT 'canvas' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"cover_url" text,
	"entry_scene_id" text,
	"entry_model_url" text,
	"last_opened_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workbench_canvas_project_creation" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"project_id" text NOT NULL,
	"creation_id" text NOT NULL,
	"source_node_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workbench_canvas_snapshot" (
	"id" text PRIMARY KEY NOT NULL,
	"project_id" text NOT NULL,
	"user_id" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"graph_json" text NOT NULL,
	"meta_json" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "nsfw_whitelisted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "iap_google_purchase" ADD CONSTRAINT "iap_google_purchase_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_message" ADD CONSTRAINT "workbench_canvas_chat_message_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_message" ADD CONSTRAINT "workbench_canvas_chat_message_project_id_workbench_canvas_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."workbench_canvas_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_message" ADD CONSTRAINT "workbench_canvas_chat_message_thread_id_workbench_canvas_chat_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."workbench_canvas_chat_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_message_attachment" ADD CONSTRAINT "workbench_canvas_chat_message_attachment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_message_attachment" ADD CONSTRAINT "workbench_canvas_chat_message_attachment_project_id_workbench_canvas_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."workbench_canvas_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_message_attachment" ADD CONSTRAINT "workbench_canvas_chat_message_attachment_thread_id_workbench_canvas_chat_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."workbench_canvas_chat_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_message_attachment" ADD CONSTRAINT "workbench_canvas_chat_message_attachment_message_id_workbench_canvas_chat_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."workbench_canvas_chat_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_message_attachment" ADD CONSTRAINT "workbench_canvas_chat_message_attachment_asset_id_workbench_creation_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."workbench_creation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_message_reference" ADD CONSTRAINT "workbench_canvas_chat_message_reference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_message_reference" ADD CONSTRAINT "workbench_canvas_chat_message_reference_project_id_workbench_canvas_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."workbench_canvas_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_message_reference" ADD CONSTRAINT "workbench_canvas_chat_message_reference_thread_id_workbench_canvas_chat_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."workbench_canvas_chat_thread"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_message_reference" ADD CONSTRAINT "workbench_canvas_chat_message_reference_message_id_workbench_canvas_chat_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."workbench_canvas_chat_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_message_reference" ADD CONSTRAINT "workbench_canvas_chat_message_reference_target_asset_id_workbench_creation_id_fk" FOREIGN KEY ("target_asset_id") REFERENCES "public"."workbench_creation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_thread" ADD CONSTRAINT "workbench_canvas_chat_thread_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_thread" ADD CONSTRAINT "workbench_canvas_chat_thread_project_id_workbench_canvas_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."workbench_canvas_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbench_canvas_project" ADD CONSTRAINT "workbench_canvas_project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbench_canvas_project_creation" ADD CONSTRAINT "workbench_canvas_project_creation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbench_canvas_project_creation" ADD CONSTRAINT "workbench_canvas_project_creation_project_id_workbench_canvas_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."workbench_canvas_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbench_canvas_project_creation" ADD CONSTRAINT "workbench_canvas_project_creation_creation_id_workbench_creation_id_fk" FOREIGN KEY ("creation_id") REFERENCES "public"."workbench_creation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbench_canvas_snapshot" ADD CONSTRAINT "workbench_canvas_snapshot_project_id_workbench_canvas_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."workbench_canvas_project"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbench_canvas_snapshot" ADD CONSTRAINT "workbench_canvas_snapshot_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_iap_google_event_type_created" ON "iap_google_event" USING btree ("event_type","created_at");--> statement-breakpoint
CREATE INDEX "idx_iap_google_event_token_created" ON "iap_google_event" USING btree ("purchase_token","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_iap_google_purchase_server_order_no" ON "iap_google_purchase" USING btree ("server_order_no");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_iap_google_purchase_token" ON "iap_google_purchase" USING btree ("purchase_token");--> statement-breakpoint
CREATE INDEX "idx_iap_google_purchase_user_status" ON "iap_google_purchase" USING btree ("user_id","entitlement_status","expire_at");--> statement-breakpoint
CREATE INDEX "idx_iap_google_purchase_user_product" ON "iap_google_purchase" USING btree ("user_id","product_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_iap_google_purchase_order_id" ON "iap_google_purchase" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_canvas_chat_message_thread_created" ON "workbench_canvas_chat_message" USING btree ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_canvas_chat_message_project_created" ON "workbench_canvas_chat_message" USING btree ("project_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_canvas_chat_message_user_project" ON "workbench_canvas_chat_message" USING btree ("user_id","project_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_canvas_chat_message_thread_client" ON "workbench_canvas_chat_message" USING btree ("thread_id","client_message_id");--> statement-breakpoint
CREATE INDEX "idx_canvas_chat_attachment_message_order" ON "workbench_canvas_chat_message_attachment" USING btree ("message_id","order_index");--> statement-breakpoint
CREATE INDEX "idx_canvas_chat_attachment_project_asset" ON "workbench_canvas_chat_message_attachment" USING btree ("project_id","asset_id");--> statement-breakpoint
CREATE INDEX "idx_canvas_chat_reference_message" ON "workbench_canvas_chat_message_reference" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "idx_canvas_chat_reference_project_target" ON "workbench_canvas_chat_message_reference" USING btree ("project_id","target_type");--> statement-breakpoint
CREATE INDEX "idx_canvas_chat_thread_user_project" ON "workbench_canvas_chat_thread" USING btree ("user_id","project_id");--> statement-breakpoint
CREATE INDEX "idx_canvas_chat_thread_user_last_message" ON "workbench_canvas_chat_thread" USING btree ("user_id","last_message_at");--> statement-breakpoint
CREATE INDEX "idx_workbench_canvas_project_user_created" ON "workbench_canvas_project" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_workbench_canvas_project_user_updated" ON "workbench_canvas_project" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "idx_workbench_canvas_project_user_last_opened" ON "workbench_canvas_project" USING btree ("user_id","last_opened_at");--> statement-breakpoint
CREATE INDEX "idx_workbench_canvas_project_creation_user_project" ON "workbench_canvas_project_creation" USING btree ("user_id","project_id");--> statement-breakpoint
CREATE INDEX "idx_workbench_canvas_project_creation_user_creation" ON "workbench_canvas_project_creation" USING btree ("user_id","creation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_workbench_canvas_project_creation_pair" ON "workbench_canvas_project_creation" USING btree ("project_id","creation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_workbench_canvas_snapshot_project" ON "workbench_canvas_snapshot" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_workbench_canvas_snapshot_user_project" ON "workbench_canvas_snapshot" USING btree ("user_id","project_id");