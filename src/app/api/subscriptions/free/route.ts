import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, userSubscriptions, subscriptionPlans } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await request.json();
    const { planId } = body;

    // جلب الخطة
    const plan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    if (!plan || plan.length === 0) {
      return NextResponse.json({ error: "الخطة غير موجودة" }, { status: 404 });
    }

    const selectedPlan = plan[0];

    // التحقق من أن الخطة مجانية
    if (Number(selectedPlan.price) > 0) {
      return NextResponse.json({ error: "هذه الخطة مدفوعة" }, { status: 400 });
    }

    // حساب تاريخ الانتهاء (شهر واحد)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // إضافة اشتراك جديد
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

    // تحديث المستخدم
    await db
      .update(users)
      .set({
        planId: selectedPlan.id,
        planStatus: "active",
        planExpiresAt: endDate,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      message: "تم تفعيل الخطة المجانية بنجاح",
      subscriptionId: subscription.id,
    });

  } catch (error) {
    console.error("Error activating free plan:", error);
    return NextResponse.json(
      { error: "فشل في تفعيل الخطة المجانية" },
      { status: 500 }
    );
  }
}