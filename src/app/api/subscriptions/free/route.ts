// src/app/api/subscriptions/free/route.ts

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, userSubscriptions, subscriptionPlans } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm"; // ✅ أضف and
import { createNotification } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const { planId } = body;

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

    // ✅ التحقق من أن الخطة مجانية
    if (Number(selectedPlan.price) > 0) {
      return NextResponse.json({ error: "هذه الخطة مدفوعة" }, { status: 400 });
    }

    // ✅ التحقق من وجود اشتراك نشط سابق - استخدم and
    const existingSubscription = await db
      .select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, session.user.id),
          eq(userSubscriptions.status, "active")
        )
      )
      .limit(1);

    if (existingSubscription && existingSubscription.length > 0) {
      return NextResponse.json(
        { error: "لديك اشتراك نشط بالفعل" },
        { status: 400 }
      );
    }

    // ✅ حساب تاريخ الانتهاء (شهر واحد)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // ✅ إضافة اشتراك جديد
    const [subscription] = await db
      .insert(userSubscriptions)
      .values({
        userId: session.user.id,
        planId: selectedPlan.id,
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
        planId: selectedPlan.id,
        planStatus: "active",
        planExpiresAt: endDate,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    // ✅ إشعار للمستخدم بتفعيل الخطة المجانية
    await createNotification({
      userId: session.user.id,
      type: 'subscription',
      title: '✅ تم تفعيل الخطة المجانية',
      titleAr: '✅ تم تفعيل الخطة المجانية',
      message: `تم تفعيل خطة "${selectedPlan.nameAr}" المجانية بنجاح، تنتهي في ${endDate.toLocaleDateString('ar-EG')}`,
      messageAr: `تم تفعيل خطة "${selectedPlan.nameAr}" المجانية بنجاح، تنتهي في ${endDate.toLocaleDateString('ar-EG')}`,
      link: '/agency/subscriptions',
      metadata: {
        subscriptionId: subscription.id,
        planId: selectedPlan.id,
        planName: selectedPlan.nameAr,
        planType: 'free',
        expiresAt: endDate,
      },
    });

    // ✅ إشعار للأدمن (للإطلاع)
    const admins = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'));

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'system',
        title: '📢 تم تفعيل خطة مجانية',
        titleAr: '📢 تم تفعيل خطة مجانية',
        message: `المستخدم ${session.user.name} قام بتفعيل خطة "${selectedPlan.nameAr}" المجانية`,
        messageAr: `المستخدم ${session.user.name} قام بتفعيل خطة "${selectedPlan.nameAr}" المجانية`,
        link: '/admin/subscriptions',
        metadata: {
          userId: session.user.id,
          planId: selectedPlan.id,
          planName: selectedPlan.nameAr,
          action: 'free_plan_activated',
        },
      });
    }

    return NextResponse.json({
      message: "تم تفعيل الخطة المجانية بنجاح",
      subscriptionId: subscription.id,
      planName: selectedPlan.nameAr,
      expiresAt: endDate,
    });

  } catch (error) {
    console.error("❌ Error activating free plan:", error);
    return NextResponse.json(
      { error: "فشل في تفعيل الخطة المجانية" },
      { status: 500 }
    );
  }
}