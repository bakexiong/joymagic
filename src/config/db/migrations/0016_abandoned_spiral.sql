ALTER TABLE "affiliate_profile" ADD COLUMN IF NOT EXISTS "custom_discount_rate_bps" integer;--> statement-breakpoint
ALTER TABLE "affiliate_program" ADD COLUMN IF NOT EXISTS "default_discount_rate_bps" integer DEFAULT 1000 NOT NULL;
