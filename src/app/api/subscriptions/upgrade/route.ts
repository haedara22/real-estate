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

    const { planId, interval = "month" } = await request.json();

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

    // حساب تاريخ انتهاء الاشتراك
    const startDate = new Date();
    const endDate = new Date();
    if (interval === "year") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }

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

    // تسجيل الاشتراك
    const [subscription] = await db
      .insert(userSubscriptions)
      .values({
        userId: session.user.id,
        planId: selectedPlan.id,
        status: "active",
        startDate: startDate,
        endDate: endDate,
        autoRenew: true,
      })
      .returning();

    return NextResponse.json({
      message: "تم الترقية بنجاح",
      subscription: {
        id: subscription.id,
        plan: selectedPlan.name,
        planAr: selectedPlan.nameAr,
        startDate,
        endDate,
      },
    });

  } catch (error) {
    console.error("Error upgrading plan:", error);
    return NextResponse.json(
      { error: "فشل في ترقية الخطة" },
      { status: 500 }
    );
  }
}