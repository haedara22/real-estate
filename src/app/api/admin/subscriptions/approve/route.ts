import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptionRequests, userSubscriptions, users, subscriptionPlans, agencies } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const { requestId, userId, planId } = body;

    // ✅ التحقق من وجود الطلب
    const [request] = await db
      .update(subscriptionRequests)
      .set({
        status: "approved",
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptionRequests.id, requestId))
      .returning();

    if (!request) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    // ✅ جلب الخطة
    const plan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    if (!plan || plan.length === 0) {
      return NextResponse.json({ error: "الخطة غير موجودة" }, { status: 404 });
    }

    const selectedPlan = plan[0];

    // ✅ جلب الوكالة التابعة للمستخدم (إذا كان مالك وكالة)
    let agencyId = null;
    try {
      const userAgency = await db
        .select({ id: agencies.id })
        .from(agencies)
        .where(eq(agencies.ownerId, userId))
        .limit(1);

      if (userAgency && userAgency.length > 0) {
        agencyId = userAgency[0].id;
      }
    } catch (err) {
      console.log("⚠️ المستخدم ليس مالك وكالة، سيتم تعيين agencyId = null");
    }

    // ✅ حساب تاريخ الانتهاء (شهر واحد)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // ✅ إضافة اشتراك جديد مع ربط الوكالة
    const [subscription] = await db
      .insert(userSubscriptions)
      .values({
        userId: userId,
        agencyId: agencyId, // ✅ ربط الوكالة
        planId: planId,
        status: "active",
        startDate: startDate,
        endDate: endDate,
        autoRenew: false,
      })
      .returning();

    // ✅ تحديث المستخدم
    await db
      .update(users)
      .set({
        planId: planId,
        planStatus: "active",
        planExpiresAt: endDate,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // ✅ تسجيل النشاط
    console.log(`✅ تم تفعيل اشتراك ${selectedPlan.nameAr} للمستخدم ${userId}`);
    console.log(`   📌 الوكالة: ${agencyId || "غير مرتبطة"}`);
    console.log(`   📅 ينتهي في: ${endDate.toLocaleDateString()}`);

    return NextResponse.json({
      message: "✅ تم الموافقة على الاشتراك وتفعيله",
      subscriptionId: subscription.id,
      agencyId: agencyId,
      planName: selectedPlan.nameAr,
      expiresAt: endDate,
    });

  } catch (error) {
    console.error("❌ Error approving subscription:", error);
    return NextResponse.json(
      { 
        error: "فشل في الموافقة على الاشتراك",
        details: error instanceof Error ? error.message : "حدث خطأ غير متوقع"
      },
      { status: 500 }
    );
  }
}