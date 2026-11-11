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
ALTER TABLE "workbench_canvas_project" ADD CONSTRAINT "workbench_canvas_project_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "workbench_canvas_snapshot" ADD CONSTRAINT "workbench_canvas_snapshot_project_id_workbench_canvas_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."workbench_canvas_project"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "workbench_canvas_snapshot" ADD CONSTRAINT "workbench_canvas_snapshot_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_workbench_canvas_project_user_created" ON "workbench_canvas_project" USING btree ("user_id","created_at");
--> statement-breakpoint
CREATE INDEX "idx_workbench_canvas_project_user_updated" ON "workbench_canvas_project" USING btree ("user_id","updated_at");
--> statement-breakpoint
CREATE INDEX "idx_workbench_canvas_project_user_last_opened" ON "workbench_canvas_project" USING btree ("user_id","last_opened_at");
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_workbench_canvas_snapshot_project" ON "workbench_canvas_snapshot" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX "idx_workbench_canvas_snapshot_user_project" ON "workbench_canvas_snapshot" USING btree ("user_id","project_id");
