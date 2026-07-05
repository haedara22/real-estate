import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptionPlans } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// ✅ استخدم NextRequest و params مع Promise
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params;
    
    const plan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    if (!plan || plan.length === 0) {
      return NextResponse.json(
        { error: "الخطة غير موجودة" },
        { status: 404 }
      );
    }

    return NextResponse.json(plan[0]);
  } catch (error) {
    console.error("Error fetching plan:", error);
    return NextResponse.json(
      { error: "فشل في جلب الخطة" },
      { status: 500 }
    );
  }
}