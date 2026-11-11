CREATE TABLE "r2_upload_task" (
	"id" text PRIMARY KEY NOT NULL,
	"ai_task_id" text,
	"user_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"source_urls" text NOT NULL,
	"result_urls" text,
	"payload" text,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 5 NOT NULL,
	"last_error" text,
	"locked_at" timestamp,
	"locked_by" text,
	"next_run_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "r2_upload_task" ADD CONSTRAINT "r2_upload_task_ai_task_id_ai_task_id_fk" FOREIGN KEY ("ai_task_id") REFERENCES "public"."ai_task"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "r2_upload_task" ADD CONSTRAINT "r2_upload_task_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_r2_upload_task_status_next_run" ON "r2_upload_task" USING btree ("status","next_run_at");
--> statement-breakpoint
CREATE INDEX "idx_r2_upload_task_ai_task" ON "r2_upload_task" USING btree ("ai_task_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_r2_upload_task_ai_task" ON "r2_upload_task" USING btree ("ai_task_id");
