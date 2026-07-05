import { 
  pgTable, 
  uuid, 
  text, 
  timestamp, 
  decimal, 
  integer, 
  boolean, 
  jsonb 
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { agencies } from "./agencies";

export const subscriptionPlans = pgTable("subscription_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(), // Free, Basic, Premium, Enterprise
  nameAr: text("name_ar").notNull(), // مجاني, أساسي, مميز, احترافي
  description: text("description"),
  descriptionAr: text("description_ar"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  interval: text("interval").default("month").notNull(), // month, year
  
  // ✅ مميزات الخطة (مصفوفة)
  features: text("features").array().default([]),
  featuresAr: text("features_ar").array().default([]),
  
  // ✅ الحدود
  maxProperties: integer("max_properties").default(0),
  maxImagesPerProperty: integer("max_images_per_property").default(5),
  maxFeaturedProperties: integer("max_featured_properties").default(0),
  
  // ✅ ميزات خاصة
  hasAnalytics: boolean("has_analytics").default(false),
  hasPrioritySupport: boolean("has_priority_support").default(false),
  hasAdvancedAnalytics: boolean("has_advanced_analytics").default(false),
  hasDedicatedSupport: boolean("has_dedicated_support").default(false),
  hasMarketingBoost: boolean("has_marketing_boost").default(false),
  isFeatured: boolean("is_featured").default(false),
  isActive: boolean("is_active").default(true),
  
  // ✅ Stripe
  stripePriceId: text("stripe_price_id"),
  
  // ✅ ترتيب العرض
  displayOrder: integer("display_order").default(0),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userSubscriptions = pgTable("user_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  agencyId: uuid("agency_id").references(() => agencies.id, { onDelete: "cascade" }),
  planId: uuid("plan_id").references(() => subscriptionPlans.id),
  status: text("status").notNull(), // active, inactive, expired, cancelled, pending
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  autoRenew: boolean("auto_renew").default(true),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCustomerId: text("stripe_customer_id"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
// ✅ جدول طلبات الاشتراك
export const subscriptionRequests = pgTable("subscription_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  planId: uuid("plan_id").references(() => subscriptionPlans.id),
  status: text("status").default("pending").notNull(), // pending, approved, rejected, expired
  paymentProof: text("payment_proof"), // رابط الصورة
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  notes: text("notes"),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});