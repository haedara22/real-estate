import { 
  pgTable, 
  uuid, 
  text, 
  timestamp, 
  boolean, 
  decimal, 
  jsonb, 
  integer,
  unique 
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const agencies = pgTable("agencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  logo: text("logo"),
  coverImage: text("cover_image"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  isVerified: boolean("is_verified").default(false),
  isActive: boolean("is_active").default(true),
  // ❌ إزالة subscription_id مؤقتاً
  // subscriptionId: uuid("subscription_id").references(() => userSubscriptions.id, { onDelete: "set null" }),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  reviewCount: integer("review_count").default(0),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agencyStaff = pgTable("agency_staff", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyId: uuid("agency_id").references(() => agencies.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  role: text("role").default("staff").notNull(),
  permissions: text("permissions").array().default([]),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueStaff: unique().on(table.agencyId, table.userId),
}));