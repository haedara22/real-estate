import { pgTable, uuid, text, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { users } from "./users";
import { userSubscriptions } from "./subscriptions";

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  subscriptionId: uuid("subscription_id").references(() => userSubscriptions.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").default("USD"),
  status: text("status").notNull(), // pending, completed, failed, refunded
  paymentMethod: text("payment_method"), // stripe, shamkash, cash
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  stripeInvoiceId: text("stripe_invoice_id"),
  metadata: jsonb("metadata").default({}),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});