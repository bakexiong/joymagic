CREATE TABLE "affiliate_application" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"desired_tier" text DEFAULT 'standard' NOT NULL,
	"paypal_email" text,
	"social_account" text,
	"social_platform" text,
	"channel_summary" text,
	"application_note" text,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"reject_reason" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliate_profile" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"application_id" text,
	"code" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"tier" text DEFAULT 'standard' NOT NULL,
	"paypal_email" text,
	"social_account" text,
	"social_platform" text,
	"channel_summary" text,
	"profile_note" text,
	"custom_first_order_rate_bps" integer,
	"custom_renewal_rate_bps" integer,
	"pending_commission_cents" integer DEFAULT 0 NOT NULL,
	"available_commission_cents" integer DEFAULT 0 NOT NULL,
	"paid_commission_cents" integer DEFAULT 0 NOT NULL,
	"referred_users_count" integer DEFAULT 0 NOT NULL,
	"converted_orders_count" integer DEFAULT 0 NOT NULL,
	"last_referred_at" timestamp,
	"approved_by" text,
	"approved_at" timestamp,
	"suspended_at" timestamp,
	"blacklisted_at" timestamp,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "affiliate_profile_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "affiliate_profile_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "affiliate_referral_visit" (
	"id" text PRIMARY KEY NOT NULL,
	"affiliate_profile_id" text NOT NULL,
	"affiliate_user_id" text NOT NULL,
	"affiliate_code" text NOT NULL,
	"visitor_user_id" text,
	"session_id" text,
	"ip" text,
	"user_agent" text,
	"referrer" text,
	"landing_page" text,
	"utm_source" text,
	"utm_medium" text,
	"utm_campaign" text,
	"utm_content" text,
	"utm_term" text,
	"is_unique" boolean DEFAULT true NOT NULL,
	"is_valid" boolean DEFAULT true NOT NULL,
	"invalid_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliate_referral" (
	"id" text PRIMARY KEY NOT NULL,
	"affiliate_profile_id" text NOT NULL,
	"affiliate_user_id" text NOT NULL,
	"referred_user_id" text NOT NULL,
	"first_visit_id" text,
	"last_visit_id" text,
	"attribution_model" text DEFAULT 'first_touch' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"cookie_expires_at" timestamp,
	"first_visited_at" timestamp,
	"last_visited_at" timestamp,
	"converted_at" timestamp,
	"first_order_id" text,
	"first_subscription_id" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "affiliate_referral_referred_user_id_unique" UNIQUE("referred_user_id")
);
--> statement-breakpoint
CREATE TABLE "affiliate_commission" (
	"id" text PRIMARY KEY NOT NULL,
	"affiliate_profile_id" text NOT NULL,
	"affiliate_user_id" text NOT NULL,
	"referred_user_id" text,
	"referral_id" text,
	"source_order_id" text,
	"source_subscription_id" text,
	"payout_id" text,
	"commission_type" text NOT NULL,
	"source_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"base_amount_cents" integer DEFAULT 0 NOT NULL,
	"commission_rate_bps" integer NOT NULL,
	"commission_amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"occurred_at" timestamp NOT NULL,
	"available_at" timestamp,
	"settled_at" timestamp,
	"description" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "affiliate_payout" (
	"id" text PRIMARY KEY NOT NULL,
	"payout_no" text NOT NULL,
	"affiliate_profile_id" text NOT NULL,
	"affiliate_user_id" text NOT NULL,
	"status" text DEFAULT 'requested' NOT NULL,
	"requested_amount_cents" integer NOT NULL,
	"approved_amount_cents" integer,
	"paid_amount_cents" integer,
	"currency" text DEFAULT 'USD' NOT NULL,
	"paypal_email" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp,
	"paid_at" timestamp,
	"reviewed_by" text,
	"reject_reason" text,
	"payment_reference" text,
	"note" text,
	"metadata" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "affiliate_payout_payout_no_unique" UNIQUE("payout_no")
);
--> statement-breakpoint
CREATE TABLE "affiliate_program" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text DEFAULT 'default' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"default_first_order_rate_bps" integer DEFAULT 1500 NOT NULL,
	"default_renewal_rate_bps" integer DEFAULT 800 NOT NULL,
	"minimum_payout_amount_cents" integer DEFAULT 4000 NOT NULL,
	"cookie_ttl_days" integer DEFAULT 7 NOT NULL,
	"commission_confirm_days" integer DEFAULT 3 NOT NULL,
	"anti_fraud_window_minutes" integer DEFAULT 60 NOT NULL,
	"max_clicks_per_ip" integer DEFAULT 3 NOT NULL,
	"agreement_text" text,
	"metadata" text,
	"updated_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "affiliate_program_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "affiliate_profile_id" text;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "affiliate_referral_id" text;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "affiliate_referral_visit_id" text;--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "affiliate_code" text;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "affiliate_profile_id" text;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "affiliate_referral_id" text;--> statement-breakpoint
ALTER TABLE "subscription" ADD COLUMN "affiliate_code" text;--> statement-breakpoint
ALTER TABLE "affiliate_application" ADD CONSTRAINT "affiliate_application_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_application" ADD CONSTRAINT "affiliate_application_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_profile" ADD CONSTRAINT "affiliate_profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_profile" ADD CONSTRAINT "affiliate_profile_application_id_affiliate_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."affiliate_application"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_profile" ADD CONSTRAINT "affiliate_profile_approved_by_user_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_referral_visit" ADD CONSTRAINT "affiliate_referral_visit_affiliate_profile_id_affiliate_profile_id_fk" FOREIGN KEY ("affiliate_profile_id") REFERENCES "public"."affiliate_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_referral_visit" ADD CONSTRAINT "affiliate_referral_visit_affiliate_user_id_user_id_fk" FOREIGN KEY ("affiliate_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_referral_visit" ADD CONSTRAINT "affiliate_referral_visit_visitor_user_id_user_id_fk" FOREIGN KEY ("visitor_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_referral" ADD CONSTRAINT "affiliate_referral_affiliate_profile_id_affiliate_profile_id_fk" FOREIGN KEY ("affiliate_profile_id") REFERENCES "public"."affiliate_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_referral" ADD CONSTRAINT "affiliate_referral_affiliate_user_id_user_id_fk" FOREIGN KEY ("affiliate_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_referral" ADD CONSTRAINT "affiliate_referral_referred_user_id_user_id_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_referral" ADD CONSTRAINT "affiliate_referral_first_visit_id_affiliate_referral_visit_id_fk" FOREIGN KEY ("first_visit_id") REFERENCES "public"."affiliate_referral_visit"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_referral" ADD CONSTRAINT "affiliate_referral_last_visit_id_affiliate_referral_visit_id_fk" FOREIGN KEY ("last_visit_id") REFERENCES "public"."affiliate_referral_visit"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_referral" ADD CONSTRAINT "affiliate_referral_first_order_id_order_id_fk" FOREIGN KEY ("first_order_id") REFERENCES "public"."order"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_referral" ADD CONSTRAINT "affiliate_referral_first_subscription_id_subscription_id_fk" FOREIGN KEY ("first_subscription_id") REFERENCES "public"."subscription"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_commission" ADD CONSTRAINT "affiliate_commission_affiliate_profile_id_affiliate_profile_id_fk" FOREIGN KEY ("affiliate_profile_id") REFERENCES "public"."affiliate_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_commission" ADD CONSTRAINT "affiliate_commission_affiliate_user_id_user_id_fk" FOREIGN KEY ("affiliate_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_commission" ADD CONSTRAINT "affiliate_commission_referred_user_id_user_id_fk" FOREIGN KEY ("referred_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_commission" ADD CONSTRAINT "affiliate_commission_referral_id_affiliate_referral_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."affiliate_referral"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_commission" ADD CONSTRAINT "affiliate_commission_source_order_id_order_id_fk" FOREIGN KEY ("source_order_id") REFERENCES "public"."order"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_commission" ADD CONSTRAINT "affiliate_commission_source_subscription_id_subscription_id_fk" FOREIGN KEY ("source_subscription_id") REFERENCES "public"."subscription"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_payout" ADD CONSTRAINT "affiliate_payout_affiliate_profile_id_affiliate_profile_id_fk" FOREIGN KEY ("affiliate_profile_id") REFERENCES "public"."affiliate_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_payout" ADD CONSTRAINT "affiliate_payout_affiliate_user_id_user_id_fk" FOREIGN KEY ("affiliate_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_payout" ADD CONSTRAINT "affiliate_payout_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_program" ADD CONSTRAINT "affiliate_program_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_affiliate_application_user_status" ON "affiliate_application" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_affiliate_application_status_created" ON "affiliate_application" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_affiliate_profile_status_tier" ON "affiliate_profile" USING btree ("status","tier");--> statement-breakpoint
CREATE INDEX "idx_affiliate_profile_code_status" ON "affiliate_profile" USING btree ("code","status");--> statement-breakpoint
CREATE INDEX "idx_affiliate_profile_available_commission" ON "affiliate_profile" USING btree ("available_commission_cents","status");--> statement-breakpoint
CREATE INDEX "idx_affiliate_referral_visit_affiliate_created" ON "affiliate_referral_visit" USING btree ("affiliate_profile_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_affiliate_referral_visit_session_created" ON "affiliate_referral_visit" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_affiliate_referral_visit_ip_created" ON "affiliate_referral_visit" USING btree ("ip","created_at");--> statement-breakpoint
CREATE INDEX "idx_affiliate_referral_affiliate_status" ON "affiliate_referral" USING btree ("affiliate_profile_id","status");--> statement-breakpoint
CREATE INDEX "idx_affiliate_referral_referred_status" ON "affiliate_referral" USING btree ("referred_user_id","status");--> statement-breakpoint
CREATE INDEX "idx_affiliate_commission_affiliate_status" ON "affiliate_commission" USING btree ("affiliate_profile_id","status");--> statement-breakpoint
CREATE INDEX "idx_affiliate_commission_affiliate_occurred" ON "affiliate_commission" USING btree ("affiliate_user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "idx_affiliate_commission_order_type" ON "affiliate_commission" USING btree ("source_order_id","commission_type");--> statement-breakpoint
CREATE INDEX "idx_affiliate_commission_subscription_type" ON "affiliate_commission" USING btree ("source_subscription_id","commission_type");--> statement-breakpoint
CREATE INDEX "idx_affiliate_commission_payout_status" ON "affiliate_commission" USING btree ("payout_id","status");--> statement-breakpoint
CREATE INDEX "idx_affiliate_payout_affiliate_status" ON "affiliate_payout" USING btree ("affiliate_profile_id","status");--> statement-breakpoint
CREATE INDEX "idx_affiliate_payout_requested_at" ON "affiliate_payout" USING btree ("requested_at");--> statement-breakpoint
CREATE INDEX "idx_affiliate_payout_status_requested" ON "affiliate_payout" USING btree ("status","requested_at");--> statement-breakpoint
CREATE INDEX "idx_affiliate_program_status" ON "affiliate_program" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_order_affiliate_profile_created" ON "order" USING btree ("affiliate_profile_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_subscription_affiliate_profile_created" ON "subscription" USING btree ("affiliate_profile_id","created_at");
