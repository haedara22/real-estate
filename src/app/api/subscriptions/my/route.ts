import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userSubscriptions, subscriptionPlans } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const subscriptions = await db
      .select({
        id: userSubscriptions.id,
        status: userSubscriptions.status,
        startDate: userSubscriptions.startDate,
        endDate: userSubscriptions.endDate,
        autoRenew: userSubscriptions.autoRenew,
        planId: userSubscriptions.planId,
      })
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, session.user.id))
      .orderBy(desc(userSubscriptions.createdAt));

    // جلب تفاصيل الخطط
    const subscriptionsWithPlans = await Promise.all(
      subscriptions.map(async (sub) => {
        let plan = null;
        if (sub.planId) {
          const planResult = await db
            .select()
            .from(subscriptionPlans)
            .where(eq(subscriptionPlans.id, sub.planId))
            .limit(1);
          plan = planResult[0] || null;
        }

        return {
          ...sub,
          planName: plan?.name || "غير معروف",
          planNameAr: plan?.nameAr || "غير معروف",
          amount: plan?.price || "0",
          currency: plan?.currency || "USD",
          plan: plan,
        };
      })
    );

    return NextResponse.json(subscriptionsWithPlans);
  } catch (error) {
    console.error("Error fetching user subscriptions:", error);
    return NextResponse.json(
      { error: "فشل في جلب الاشتراكات" },
      { status: 500 }
    );
  }
}