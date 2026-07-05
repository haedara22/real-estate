import { db } from "../src/lib/db";
import { users, userSubscriptions } from "../src/lib/db/schema";
import { eq, and, lt } from "drizzle-orm";

async function checkExpiredSubscriptions() {
  console.log("🔄 التحقق من الاشتراكات المنتهية...");

  const now = new Date();

  // جلب الاشتراكات المنتهية
  const expired = await db
    .select()
    .from(userSubscriptions)
    .where(
      and(
        eq(userSubscriptions.status, "active"),
        lt(userSubscriptions.endDate, now)
      )
    );

  for (const sub of expired) {
    // تحديث حالة الاشتراك
    await db
      .update(userSubscriptions)
      .set({ status: "expired", updatedAt: now })
      .where(eq(userSubscriptions.id, sub.id));

    // تحديث المستخدم
    await db
      .update(users)
      .set({
        planStatus: "expired",
        planExpiresAt: null,
        updatedAt: now,
      })
      .where(eq(users.id, sub.userId));

    console.log(`✅ تم إنهاء اشتراك المستخدم: ${sub.userId}`);
  }

  console.log(`✅ تم التحقق. عدد الاشتراكات المنتهية: ${expired.length}`);
}

checkExpiredSubscriptions()
  .catch(console.error)
  .finally(() => process.exit(0));