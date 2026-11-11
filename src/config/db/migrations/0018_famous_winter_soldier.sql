CREATE TABLE "workbench_upload" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"media_type" text NOT NULL,
	"scene_id" text,
	"scene_label" text,
	"model_url" text,
	"model_label" text,
	"filename" text NOT NULL,
	"storage_key" text,
	"url" text NOT NULL,
	"mime_type" text,
	"file_size" integer,
	"keyword_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workbench_upload" ADD CONSTRAINT "workbench_upload_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_workbench_upload_user_created" ON "workbench_upload" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_workbench_upload_user_type_created" ON "workbench_upload" USING btree ("user_id","media_type","created_at");--> statement-breakpoint
CREATE INDEX "idx_workbench_upload_user_scene_created" ON "workbench_upload" USING btree ("user_id","scene_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_workbench_upload_user_model_created" ON "workbench_upload" USING btree ("user_id","model_url","created_at");