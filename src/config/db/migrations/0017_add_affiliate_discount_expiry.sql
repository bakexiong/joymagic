ALTER TABLE "affiliate_profile" ADD COLUMN IF NOT EXISTS "discount_expires_at" timestamp DEFAULT (CURRENT_TIMESTAMP + interval '30 days');--> statement-breakpoint
UPDATE "affiliate_profile"
SET "discount_expires_at" = CURRENT_TIMESTAMP + interval '30 days'
WHERE "discount_expires_at" IS NULL;--> statement-breakpoint
ALTER TABLE "affiliate_profile" ALTER COLUMN "discount_expires_at" SET DEFAULT (CURRENT_TIMESTAMP + interval '30 days');--> statement-breakpoint
ALTER TABLE "affiliate_profile" ALTER COLUMN "discount_expires_at" SET NOT NULL;
