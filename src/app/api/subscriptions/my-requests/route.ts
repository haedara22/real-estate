import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptionRequests, subscriptionPlans } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const requests = await db
      .select({
        id: subscriptionRequests.id,
        status: subscriptionRequests.status,
        amount: subscriptionRequests.amount,
        currency: subscriptionRequests.currency,
        paymentProof: subscriptionRequests.paymentProof,
        notes: subscriptionRequests.notes,
        createdAt: subscriptionRequests.createdAt,
        planId: subscriptionRequests.planId,
      })
      .from(subscriptionRequests)
      .where(eq(subscriptionRequests.userId, session.user.id))
      .orderBy(desc(subscriptionRequests.createdAt));

    // جلب أسماء الخطط
    const requestsWithPlanNames = await Promise.all(
      requests.map(async (req) => {
        let planName = null;
        let planNameAr = null;
        
        if (req.planId) {
          const plan = await db
            .select({ name: subscriptionPlans.name, nameAr: subscriptionPlans.nameAr })
            .from(subscriptionPlans)
            .where(eq(subscriptionPlans.id, req.planId))
            .limit(1);
          
          if (plan.length > 0) {
            planName = plan[0].name;
            planNameAr = plan[0].nameAr;
          }
        }

        return {
          ...req,
          planName,
          planNameAr: planNameAr || "غير معروف",
        };
      })
    );

    return NextResponse.json(requestsWithPlanNames);
  } catch (error) {
    console.error("Error fetching user subscription requests:", error);
    return NextResponse.json(
      { error: "فشل في جلب طلبات الاشتراك" },
      { status: 500 }
    );
  }
}