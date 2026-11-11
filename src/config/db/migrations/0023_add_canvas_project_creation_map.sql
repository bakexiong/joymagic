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
ALTER TABLE "workbench_canvas_project_creation" ADD CONSTRAINT "workbench_canvas_project_creation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "workbench_canvas_project_creation" ADD CONSTRAINT "workbench_canvas_project_creation_project_id_workbench_canvas_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."workbench_canvas_project"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "workbench_canvas_project_creation" ADD CONSTRAINT "workbench_canvas_project_creation_creation_id_workbench_creation_id_fk" FOREIGN KEY ("creation_id") REFERENCES "public"."workbench_creation"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_workbench_canvas_project_creation_user_project" ON "workbench_canvas_project_creation" USING btree ("user_id","project_id");
--> statement-breakpoint
CREATE INDEX "idx_workbench_canvas_project_creation_user_creation" ON "workbench_canvas_project_creation" USING btree ("user_id","creation_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "uq_workbench_canvas_project_creation_pair" ON "workbench_canvas_project_creation" USING btree ("project_id","creation_id");
