// src/lib/notifications/index.ts

import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

// ✅ أنواع الإشعارات
export type NotificationType = 
  | 'property_new'
  | 'property_update'
  | 'property_featured'
  | 'property_sold'
  | 'message'
  | 'system'
  | 'payment'
  | 'subscription'
  | 'subscription_approved'
  | 'subscription_rejected'
  | 'agency_verified'
  | 'agency_rejected'
  | 'favorite'
  | 'report_resolved';

// ✅ إنشاء إشعار
export async function createNotification({
  userId,
  type,
  title,
  titleAr,
  message,
  messageAr,
  link,
  metadata,
}: {
  userId: string;
  type: NotificationType;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  link?: string;
  metadata?: Record<string, any>;
}) {
  try {
    // ✅ التحقق من صحة الرابط
    let validLink: string | undefined = undefined;
    if (link) {
      if (link.startsWith('/') || link.startsWith('http://') || link.startsWith('https://')) {
        validLink = link;
      }
    }

    const [notification] = await db
      .insert(notifications)
      .values({
        userId,
        type,
        title,
        titleAr: titleAr || title,
        message,
        messageAr: messageAr || message,
        link: validLink,
        metadata: metadata || {},
        isRead: false,
        createdAt: new Date(),
      })
      .returning();

    console.log(`🔔 إشعار جديد: ${title} للمستخدم ${userId}`);
    return notification;
  } catch (error) {
    console.error("❌ فشل إنشاء الإشعار:", error);
    return null;
  }
}

// ✅ جلب إشعارات المستخدم
export async function getUserNotifications(userId: string, limit = 20) {
  try {
    const userNotifications = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return userNotifications;
  } catch (error) {
    console.error("❌ فشل جلب الإشعارات:", error);
    return [];
  }
}

// ✅ جلب عدد الإشعارات غير المقروءة
export async function getUnreadCount(userId: string) {
  try {
    const result = await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );

    return result.length;
  } catch (error) {
    console.error("❌ فشل جلب عدد الإشعارات غير المقروءة:", error);
    return 0;
  }
}

// ✅ تحديد إشعار كمقروء
export async function markAsRead(notificationId: string, userId: string) {
  try {
    await db
      .update(notifications)
      .set({ 
        isRead: true, 
        readAt: new Date() 
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId)
        )
      );
    return true;
  } catch (error) {
    console.error("❌ فشل تحديد الإشعار كمقروء:", error);
    return false;
  }
}

// ✅ تحديد كل الإشعارات كمقروءة
export async function markAllAsRead(userId: string) {
  try {
    await db
      .update(notifications)
      .set({ 
        isRead: true, 
        readAt: new Date() 
      })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );
    return true;
  } catch (error) {
    console.error("❌ فشل تحديد الكل كمقروء:", error);
    return false;
  }
}