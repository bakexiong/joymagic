CREATE TABLE "ai_character_perspective" (
  "id" text PRIMARY KEY NOT NULL,
  "character_id" text NOT NULL,
  "user_id" text NOT NULL,
  "status" text NOT NULL,
  "image_url" text,
  "provider_task_id" text,
  "horizontal_angle" integer NOT NULL,
  "vertical_angle" integer NOT NULL,
  "distance" real NOT NULL,
  "error_message" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp NOT NULL,
  "completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "ai_character_perspective" ADD CONSTRAINT "ai_character_perspective_character_id_ai_character_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."ai_character"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ai_character_perspective" ADD CONSTRAINT "ai_character_perspective_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_ai_character_perspective_character_created" ON "ai_character_perspective" USING btree ("character_id","created_at");
--> statement-breakpoint
CREATE INDEX "idx_ai_character_perspective_provider_task" ON "ai_character_perspective" USING btree ("provider_task_id");
