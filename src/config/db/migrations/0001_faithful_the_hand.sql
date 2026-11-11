ALTER TABLE "user" ADD COLUMN "free_image_generations" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "free_image_generations_last_reset" timestamp;