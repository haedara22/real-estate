import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptionRequests } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";

// ✅ استخدم NextRequest بدلاً من Request
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // ✅ استخدم req.json() بدلاً من request.json()
    const body = await req.json();
    const { requestId, reason } = body;

    await db
      .update(subscriptionRequests)
      .set({
        status: "rejected",
        rejectedAt: new Date(),
        rejectionReason: reason || null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionRequests.id, requestId));

    return NextResponse.json({
      message: "تم رفض طلب الاشتراك",
    });

  } catch (error) {
    console.error("Error rejecting subscription:", error);
    return NextResponse.json(
      { error: "فشل في رفض الاشتراك" },
      { status: 500 }
    );
  }
}