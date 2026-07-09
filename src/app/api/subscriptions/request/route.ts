// src/app/api/subscriptions/request/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptionRequests, subscriptionPlans, users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm"; // ✅ أضف and
import { createNotification } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const { planId, paymentProof, notes } = body;

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

    // ✅ التحقق من وجود طلب سابق بنفس الخطة ومعلق - استخدم and
    const existingRequest = await db
      .select()
      .from(subscriptionRequests)
      .where(
        and(
          eq(subscriptionRequests.userId, session.user.id),
          eq(subscriptionRequests.planId, planId),
          eq(subscriptionRequests.status, "pending")
        )
      )
      .limit(1);

    if (existingRequest && existingRequest.length > 0) {
      return NextResponse.json(
        { error: "لديك طلب اشتراك سابق بنفس الخطة في انتظار المراجعة" },
        { status: 400 }
      );
    }

    // ✅ إنشاء طلب اشتراك
    const [request] = await db
      .insert(subscriptionRequests)
      .values({
        userId: session.user.id,
        planId: selectedPlan.id,
        paymentProof: paymentProof || null,
        amount: selectedPlan.price,
        currency: selectedPlan.currency || "USD",
        notes: notes || null,
        status: "pending",
      })
      .returning();

    // ✅ إشعار للمستخدم بتأكيد الطلب
    await createNotification({
      userId: session.user.id,
      type: 'subscription',
      title: '📋 تم إرسال طلب اشتراك',
      titleAr: '📋 تم إرسال طلب اشتراك',
      message: `تم إرسال طلب اشتراك في خطة "${selectedPlan.nameAr}" بنجاح، في انتظار المراجعة`,
      messageAr: `تم إرسال طلب اشتراك في خطة "${selectedPlan.nameAr}" بنجاح، في انتظار المراجعة`,
      link: '/subscriptions',
      metadata: {
        requestId: request.id,
        planId: selectedPlan.id,
        planName: selectedPlan.nameAr,
        status: 'pending',
      },
    });

    // ✅ إشعار للأدمن بطلب اشتراك جديد
    const admins = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'));

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'subscription',
        title: '📢 طلب اشتراك جديد في انتظار المراجعة',
        titleAr: '📢 طلب اشتراك جديد في انتظار المراجعة',
        message: `طلب اشتراك جديد في خطة "${selectedPlan.nameAr}" من المستخدم ${session.user.name}`,
        messageAr: `طلب اشتراك جديد في خطة "${selectedPlan.nameAr}" من المستخدم ${session.user.name}`,
        link: '/admin/subscriptions',
        metadata: {
          requestId: request.id,
          userId: session.user.id,
          planId: selectedPlan.id,
          planName: selectedPlan.nameAr,
          action: 'new_subscription_request',
        },
      });
    }

    return NextResponse.json({
      message: "تم إرسال طلب الاشتراك بنجاح",
      requestId: request.id,
      status: request.status,
      planName: selectedPlan.nameAr,
    });

  } catch (error) {
    console.error("❌ Error creating subscription request:", error);
    return NextResponse.json(
      { error: "فشل في إرسال طلب الاشتراك" },
      { status: 500 }
    );
  }
}