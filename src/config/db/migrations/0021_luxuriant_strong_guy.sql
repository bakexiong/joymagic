CREATE TABLE "workbench_collection_creation" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"collection_id" text NOT NULL,
	"creation_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "workbench_collection_creation" ADD CONSTRAINT "workbench_collection_creation_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbench_collection_creation" ADD CONSTRAINT "workbench_collection_creation_collection_id_workbench_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."workbench_collection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workbench_collection_creation" ADD CONSTRAINT "workbench_collection_creation_creation_id_workbench_creation_id_fk" FOREIGN KEY ("creation_id") REFERENCES "public"."workbench_creation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_workbench_collection_creation_user_collection" ON "workbench_collection_creation" USING btree ("user_id","collection_id");--> statement-breakpoint
CREATE INDEX "idx_workbench_collection_creation_user_creation" ON "workbench_collection_creation" USING btree ("user_id","creation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_workbench_collection_creation_pair" ON "workbench_collection_creation" USING btree ("collection_id","creation_id");