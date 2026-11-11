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
ALTER TABLE "workbench_canvas_chat_thread" ADD CONSTRAINT "workbench_canvas_chat_thread_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_thread" ADD CONSTRAINT "workbench_canvas_chat_thread_project_id_workbench_canvas_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."workbench_canvas_project"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_message" ADD CONSTRAINT "workbench_canvas_chat_message_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_message" ADD CONSTRAINT "workbench_canvas_chat_message_project_id_workbench_canvas_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."workbench_canvas_project"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_message" ADD CONSTRAINT "workbench_canvas_chat_message_thread_id_workbench_canvas_chat_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."workbench_canvas_chat_thread"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_message_attachment" ADD CONSTRAINT "workbench_canvas_chat_message_attachment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_message_attachment" ADD CONSTRAINT "workbench_canvas_chat_message_attachment_project_id_workbench_canvas_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."workbench_canvas_project"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_message_attachment" ADD CONSTRAINT "workbench_canvas_chat_message_attachment_thread_id_workbench_canvas_chat_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."workbench_canvas_chat_thread"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_message_attachment" ADD CONSTRAINT "workbench_canvas_chat_message_attachment_message_id_workbench_canvas_chat_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."workbench_canvas_chat_message"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_message_attachment" ADD CONSTRAINT "workbench_canvas_chat_message_attachment_asset_id_workbench_creation_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."workbench_creation"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_message_reference" ADD CONSTRAINT "workbench_canvas_chat_message_reference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_message_reference" ADD CONSTRAINT "workbench_canvas_chat_message_reference_project_id_workbench_canvas_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."workbench_canvas_project"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_message_reference" ADD CONSTRAINT "workbench_canvas_chat_message_reference_thread_id_workbench_canvas_chat_thread_id_fk" FOREIGN KEY ("thread_id") REFERENCES "public"."workbench_canvas_chat_thread"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_message_reference" ADD CONSTRAINT "workbench_canvas_chat_message_reference_message_id_workbench_canvas_chat_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."workbench_canvas_chat_message"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "workbench_canvas_chat_message_reference" ADD CONSTRAINT "workbench_canvas_chat_message_reference_target_asset_id_workbench_creation_id_fk" FOREIGN KEY ("target_asset_id") REFERENCES "public"."workbench_creation"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_canvas_chat_thread_user_project" ON "workbench_canvas_chat_thread" USING btree ("user_id","project_id");
--> statement-breakpoint
CREATE INDEX "idx_canvas_chat_thread_user_last_message" ON "workbench_canvas_chat_thread" USING btree ("user_id","last_message_at");
--> statement-breakpoint
CREATE INDEX "idx_canvas_chat_message_thread_created" ON "workbench_canvas_chat_message" USING btree ("thread_id","created_at");
--> statement-breakpoint
CREATE INDEX "idx_canvas_chat_message_project_created" ON "workbench_canvas_chat_message" USING btree ("project_id","created_at");
--> statement-breakpoint
CREATE INDEX "idx_canvas_chat_message_user_project" ON "workbench_canvas_chat_message" USING btree ("user_id","project_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_canvas_chat_message_thread_client" ON "workbench_canvas_chat_message" USING btree ("thread_id","client_message_id");
--> statement-breakpoint
CREATE INDEX "idx_canvas_chat_attachment_message_order" ON "workbench_canvas_chat_message_attachment" USING btree ("message_id","order_index");
--> statement-breakpoint
CREATE INDEX "idx_canvas_chat_attachment_project_asset" ON "workbench_canvas_chat_message_attachment" USING btree ("project_id","asset_id");
--> statement-breakpoint
CREATE INDEX "idx_canvas_chat_reference_message" ON "workbench_canvas_chat_message_reference" USING btree ("message_id");
--> statement-breakpoint
CREATE INDEX "idx_canvas_chat_reference_project_target" ON "workbench_canvas_chat_message_reference" USING btree ("project_id","target_type");
