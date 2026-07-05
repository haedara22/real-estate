import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptionRequests, subscriptionPlans } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

// ✅ استخدم NextRequest بدلاً من Request
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // ✅ استخدم req.json() بدلاً من request.json()
    const body = await req.json();
    const { planId, paymentProof, notes } = body;

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

    // إنشاء طلب اشتراك
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

    return NextResponse.json({
      message: "تم إرسال طلب الاشتراك بنجاح",
      requestId: request.id,
      status: request.status,
    });

  } catch (error) {
    console.error("Error creating subscription request:", error);
    return NextResponse.json(
      { error: "فشل في إرسال طلب الاشتراك" },
      { status: 500 }
    );
  }
}