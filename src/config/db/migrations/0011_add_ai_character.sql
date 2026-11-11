CREATE TABLE "ai_character" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "status" text NOT NULL,
  "dna" text NOT NULL,
  "extra_description" text,
  "image_url" text,
  "provider_task_id" text,
  "aspect_ratio" text NOT NULL,
  "resolution" text NOT NULL,
  "error_message" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp NOT NULL,
  "completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "ai_character" ADD CONSTRAINT "ai_character_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_ai_character_user_created_at" ON "ai_character" USING btree ("user_id","created_at");
--> statement-breakpoint
CREATE INDEX "idx_ai_character_user_status" ON "ai_character" USING btree ("user_id","status");
