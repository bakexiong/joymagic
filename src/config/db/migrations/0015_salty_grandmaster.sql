ALTER TABLE "affiliate_profile" ADD COLUMN IF NOT EXISTS "discount_code" text;--> statement-breakpoint
ALTER TABLE "affiliate_profile" ADD COLUMN IF NOT EXISTS "discount_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "affiliate_discount_code" text;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN IF NOT EXISTS "affiliate_discount_code" text;--> statement-breakpoint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'affiliate_profile_discount_code_unique'
    ) THEN
        ALTER TABLE "affiliate_profile"
        ADD CONSTRAINT "affiliate_profile_discount_code_unique" UNIQUE("discount_code");
    END IF;
END $$;
