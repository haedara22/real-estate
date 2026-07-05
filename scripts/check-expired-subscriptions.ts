import { db } from "../src/lib/db";
import { users, userSubscriptions, subscriptionPlans } from "../src/lib/db/schema";
import { eq, and, lt } from "drizzle-orm";

async function getFreePlan() {
  try {
    const plan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.name, "Free"))
      .limit(1);
    return plan[0] || null;
  } catch (error) {
    console.error("❌ خطأ في جلب الخطة المجانية:", error);
    return null;
  }
}

async function checkExpiredSubscriptions() {
  console.log("🔄 التحقق من الاشتراكات المنتهية...");

  try {
    const now = new Date();
    const freePlan = await getFreePlan();

    if (!freePlan) {
      console.log("❌ الخطة المجانية غير موجودة في قاعدة البيانات!");
      return;
    }

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

    console.log(`📊 تم العثور على ${expired.length} اشتراك منتهي`);

    if (expired.length === 0) {
      console.log("✅ لا توجد اشتراكات منتهية");
      return;
    }

    for (const sub of expired) {
      // ✅ التحقق من وجود userId
      if (!sub.userId) {
        console.log(`⚠️ تخطي: الاشتراك ${sub.id} ليس له userId`);
        continue;
      }

      // 1. تحديث حالة الاشتراك
      await db
        .update(userSubscriptions)
        .set({
          status: "expired",
          updatedAt: now,
        })
        .where(eq(userSubscriptions.id, sub.id));

      // 2. تحديث المستخدم إلى الخطة المجانية
      await db
        .update(users)
        .set({
          planId: freePlan.id,
          planStatus: "expired",
          planExpiresAt: null,
          updatedAt: now,
        })
        .where(eq(users.id, sub.userId));

      console.log(`✅ تم إنهاء اشتراك المستخدم: ${sub.userId}`);
    }

    console.log(`✅ تم التحقق. عدد الاشتراكات المنتهية: ${expired.length}`);
  } catch (error) {
    console.error("❌ خطأ في التحقق من الاشتراكات:", error);
  }
}

// تشغيل السكربت
checkExpiredSubscriptions()
  .catch((error) => {
    console.error("❌ فشل في تشغيل السكربت:", error);
    process.exit(1);
  })
  .finally(() => {
    console.log("🏁 انتهى السكربت");
    process.exit(0);
  });