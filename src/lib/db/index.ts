import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// 🔴 ضع رابط قاعدة البيانات الخاص بك هنا مباشرة (للاختبار)
// استبدل هذا بالرابط الحقيقي من Neon
const DATABASE_URL = "postgresql://neondb_owner:npg_9WHvrsMA4fxQ@ep-cool-wildflower-aizwyt3u-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

console.log("✅ Connecting to database...");
// إضافة خيار إخفاء التحذير
const sql = neon(DATABASE_URL, {
  disableWarningInBrowsers: true, // ✅ يخفي التحذيرات
});
// إنشاء اتصال بقاعدة البيانات
export const db = drizzle(sql, { schema });

// تصدير أنواع المساعدة
export type DbClient = typeof db;
export * from "./schema";