import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, subscriptionPlans } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // جلب المستخدم مع خطته
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user || user.length === 0) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    const userData = user[0];

    // إذا كان للمستخدم خطة
    if (userData.planId) {
      const plan = await db
        .select()
        .from(subscriptionPlans)
        .where(eq(subscriptionPlans.id, userData.planId))
        .limit(1);

      return NextResponse.json({
        plan: plan[0] || null,
        status: userData.planStatus,
        expiresAt: userData.planExpiresAt,
      });
    }

    return NextResponse.json({ plan: null, status: "free" });

  } catch (error) {
    console.error("Error fetching user plan:", error);
    return NextResponse.json(
      { error: "فشل في جلب خطة المستخدم" },
      { status: 500 }
    );
  }
}