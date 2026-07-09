// src/app/api/notifications/mark-read/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { markAsRead } from "@/lib/notifications";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    const { notificationId } = await request.json();

    if (!notificationId) {
      return NextResponse.json(
        { error: "معرف الإشعار مطلوب" },
        { status: 400 }
      );
    }

    await markAsRead(notificationId, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    return NextResponse.json(
      { error: "فشل في تحديث الإشعار" },
      { status: 500 }
    );
  }
}