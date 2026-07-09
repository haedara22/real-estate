// src/app/api/admin/subscriptions/reject/route.ts

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptionRequests, users } from "@/lib/db/schema";
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
    const { requestId, reason } = body;

    // ✅ جلب الطلب قبل التحديث (لمعرفة المستخدم والخطة)
    const [request] = await db
      .select()
      .from(subscriptionRequests)
      .where(eq(subscriptionRequests.id, requestId))
      .limit(1);

    if (!request) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    // ✅ التحقق من وجود userId
    if (!request.userId) {
      return NextResponse.json(
        { error: "المستخدم المرتبط بالطلب غير موجود" },
        { status: 404 }
      );
    }

    // ✅ تحديث حالة الطلب إلى مرفوض
    await db
      .update(subscriptionRequests)
      .set({
        status: "rejected",
        rejectedAt: new Date(),
        rejectionReason: reason || "لم يتم تحديد سبب",
        updatedAt: new Date(),
      })
      .where(eq(subscriptionRequests.id, requestId));

    // ✅ ✅ ✅ إشعار للمستخدم برفض الاشتراك
    await createNotification({
      userId: request.userId, // ✅ الآن userId مؤكد أنه string
      type: 'subscription_rejected',
      title: '❌ تم رفض طلب الاشتراك',
      titleAr: '❌ تم رفض طلب الاشتراك',
      message: `تم رفض طلب الاشتراك الخاص بك. السبب: ${reason || 'لم يتم تحديد سبب'}`,
      messageAr: `تم رفض طلب الاشتراك الخاص بك. السبب: ${reason || 'لم يتم تحديد سبب'}`,
      link: '/subscriptions',
      metadata: {
        requestId: requestId,
        reason: reason,
        rejectedBy: session.user.id,
      },
    });

    // ✅ ✅ ✅ إشعار للأدمن (تأكيد الإجراء)
    await createNotification({
      userId: session.user.id,
      type: 'system',
      title: '❌ تم رفض طلب اشتراك',
      titleAr: '❌ تم رفض طلب اشتراك',
      message: `تم رفض طلب اشتراك للمستخدم ${session.user.name}`,
      messageAr: `تم رفض طلب اشتراك للمستخدم ${session.user.name}`,
      link: '/admin/subscriptions',
      metadata: {
        requestId: requestId,
        userId: request.userId,
        action: 'rejected_by_admin',
        reason: reason,
      },
    });

    return NextResponse.json({
      message: "تم رفض طلب الاشتراك",
      requestId: requestId,
    });

  } catch (error) {
    console.error("❌ Error rejecting subscription:", error);
    return NextResponse.json(
      { error: "فشل في رفض الاشتراك" },
      { status: 500 }
    );
  }
}