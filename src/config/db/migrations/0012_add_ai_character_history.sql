ALTER TABLE "ai_character" ADD COLUMN "current_version" integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
CREATE TABLE "ai_character_history" (
  "id" text PRIMARY KEY NOT NULL,
  "character_id" text NOT NULL,
  "user_id" text NOT NULL,
  "version" integer NOT NULL,
  "action" text NOT NULL,
  "snapshot" text NOT NULL,
  "changes" text,
  "rollback_from_version" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_character_history" ADD CONSTRAINT "ai_character_history_character_id_ai_character_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."ai_character"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ai_character_history" ADD CONSTRAINT "ai_character_history_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "idx_ai_character_history_character_version" ON "ai_character_history" USING btree ("character_id","version");
--> statement-breakpoint
CREATE INDEX "idx_ai_character_history_user_created" ON "ai_character_history" USING btree ("user_id","created_at");
