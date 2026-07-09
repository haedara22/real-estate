// src/app/api/notifications/mark-all-read/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { markAllAsRead } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    await markAllAsRead(session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error marking all notifications as read:", error);
    return NextResponse.json(
      { error: "فشل في تحديث الإشعارات" },
      { status: 500 }
    );
  }
}