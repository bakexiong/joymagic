CREATE TABLE "workbench_collection" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workbench_collection" ADD CONSTRAINT "workbench_collection_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_workbench_collection_user_created" ON "workbench_collection" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_workbench_collection_user_updated" ON "workbench_collection" USING btree ("user_id","updated_at");