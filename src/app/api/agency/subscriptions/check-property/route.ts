// src/app/api/subscription/check-property/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { properties, userSubscriptions, subscriptionPlans } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { allowed: false, message: "يرجى تسجيل الدخول" },
        { status: 401 }
      );
    }

    // ✅ جلب الاشتراك النشط
    const subscription = await db
      .select({
        planMaxProperties: subscriptionPlans.maxProperties,
        planName: subscriptionPlans.nameAr,
      })
      .from(userSubscriptions)
      .innerJoin(subscriptionPlans, eq(userSubscriptions.planId, subscriptionPlans.id))
      .where(
        and(
          eq(userSubscriptions.userId, userId),
          eq(userSubscriptions.status, 'active')
        )
      )
      .limit(1);

    if (!subscription || subscription.length === 0) {
      return NextResponse.json({
        allowed: false,
        message: "ليس لديك اشتراك نشط. يرجى الاشتراك أولاً."
      });
    }

    const maxProperties = subscription[0].planMaxProperties || 0;

    // ✅ حساب عدد العقارات الحالية
    const propertiesCount = await db
      .select({ count: count() })
      .from(properties)
      .where(eq(properties.userId, userId));

    const currentCount = propertiesCount[0]?.count || 0;

    // ✅ التحقق من الحد الأقصى
    if (maxProperties > 0 && currentCount >= maxProperties) {
      return NextResponse.json({
        allowed: false,
        message: `لقد وصلت للحد الأقصى (${maxProperties} عقار). يرجى ترقية خطتك لإضافة المزيد.`,
        currentCount,
        maxProperties,
        planName: subscription[0].planName,
      });
    }

    return NextResponse.json({
      allowed: true,
      currentCount,
      maxProperties: maxProperties === 0 ? 'غير محدود' : maxProperties,
      planName: subscription[0].planName,
      remaining: maxProperties === 0 ? 'غير محدود' : maxProperties - currentCount,
    });

  } catch (error) {
    console.error("❌ Error checking property permission:", error);
    return NextResponse.json({
      allowed: false,
      message: "حدث خطأ في التحقق من الصلاحية"
    });
  }
}