// src/app/api/notifications/route.ts

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserNotifications, getUnreadCount } from "@/lib/notifications";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "غير مصرح" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(session.user.id, limit),
      getUnreadCount(session.user.id),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      total: notifications.length,
    });
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
    return NextResponse.json(
      { error: "فشل في جلب الإشعارات" },
      { status: 500 }
    );
  }
}