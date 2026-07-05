ALTER TABLE "agencies" DROP CONSTRAINT "agencies_subscription_id_user_subscriptions_id_fk";
--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "code" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "subscription_plans" ALTER COLUMN "interval" SET DEFAULT 'month';--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "max_images_per_property" integer DEFAULT 5;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "max_featured_properties" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "has_analytics" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "has_priority_support" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "has_advanced_analytics" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "has_dedicated_support" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "has_marketing_boost" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "subscription_plans" ADD COLUMN "display_order" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "agencies" ADD CONSTRAINT "agencies_subscription_id_user_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."user_subscriptions"("id") ON DELETE set null ON UPDATE no action;