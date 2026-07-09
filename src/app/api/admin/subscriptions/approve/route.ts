// src/app/api/admin/subscriptions/approve/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptionRequests, userSubscriptions, users, subscriptionPlans, agencies } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { createNotification } from "@/lib/notifications";

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
        agencyId: agencyId,
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

    // ✅ ✅ ✅ إشعار للمستخدم بقبول الاشتراك
    await createNotification({
      userId: userId,
      type: 'subscription_approved',
      title: '✅ تم قبول طلب الاشتراك',
      titleAr: '✅ تم قبول طلب الاشتراك',
      message: `تم قبول طلب الاشتراك في خطة "${selectedPlan.nameAr}" بنجاح`,
      messageAr: `تم قبول طلب الاشتراك في خطة "${selectedPlan.nameAr}" بنجاح`,
      link: '/agency/subscriptions',
      metadata: {
        subscriptionId: subscription.id,
        planId: planId,
        planName: selectedPlan.nameAr,
        expiresAt: endDate,
        agencyId: agencyId,
      },
    });

    // ✅ ✅ ✅ إشعار للأدمن (تأكيد الإجراء)
    await createNotification({
      userId: session.user.id,
      type: 'system',
      title: '✅ تمت الموافقة على طلب اشتراك',
      titleAr: '✅ تمت الموافقة على طلب اشتراك',
      message: `تمت الموافقة على طلب اشتراك خطة "${selectedPlan.nameAr}" للمستخدم ${session.user.name}`,
      messageAr: `تمت الموافقة على طلب اشتراك خطة "${selectedPlan.nameAr}" للمستخدم ${session.user.name}`,
      link: '/admin/subscriptions',
      metadata: {
        subscriptionId: subscription.id,
        userId: userId,
        planId: planId,
        action: 'approved_by_admin',
      },
    });

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