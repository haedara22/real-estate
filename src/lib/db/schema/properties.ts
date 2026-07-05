import { 
  pgTable, 
  uuid, 
  text, 
  timestamp, 
  decimal, 
  integer, 
  boolean, 
  jsonb,
  unique
} from "drizzle-orm/pg-core";
import { agencies } from "./agencies";
import { cities, districts } from "./locations";
import { users } from "./users";

export const properties = pgTable("properties", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: text("code").notNull().unique(),
  agencyId: uuid("agency_id").references(() => agencies.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  description: text("description"),
  price: decimal("price", { precision: 15, scale: 2 }),
  purpose: text("purpose").notNull(),
  type: text("type").notNull(),
  status: text("status").default("pending").notNull(),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  area: decimal("area", { precision: 10, scale: 2 }),
  cityId: uuid("city_id").references(() => cities.id),
  districtId: uuid("district_id").references(() => districts.id),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  isFeatured: boolean("is_featured").default(false),
  viewsCount: integer("views_count").default(0),
  favoritesCount: integer("favorites_count").default(0),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  publishedAt: timestamp("published_at"),
});

// ✅ تأكد من تصدير propertyImages
export const propertyImages = pgTable("property_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  alt: text("alt"),
  order: integer("order").default(0),
  isMain: boolean("is_main").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ✅ تأكد من تصدير propertyFeatures
export const propertyFeatures = pgTable("property_features", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  value: text("value"),
  icon: text("icon"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ✅ تأكد من تصدير propertyViews
export const propertyViews = pgTable("property_views", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id").references(() => properties.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});