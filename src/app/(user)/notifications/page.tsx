// src/app/(user)/notifications/page.tsx

'use client';

import { useNotifications } from "@/hooks/useNotifications";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import Link from "next/link";
import { ArrowLeft, CheckCheck, Bell } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const router = useRouter();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, string> = {
      property_new: '🏠',
      property_update: '📝',
      property_featured: '⭐',
      property_sold: '💰',
      message: '💬',
      system: '⚙️',
      payment: '💳',
      subscription: '📋',
      subscription_approved: '✅',
      subscription_rejected: '❌',
      agency_verified: '🏢',
      agency_rejected: '🚫',
      favorite: '❤️',
      report_resolved: '🛡️',
    };
    return icons[type] || '📢';
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMMM yyyy • hh:mm a', { locale: ar });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl p-4" dir="rtl">
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="w-6 h-6" />
              الإشعارات
            </h1>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-500">
                {unreadCount} إشعار غير مقروء
              </p>
            )}
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
          >
            <CheckCheck className="w-4 h-4" />
            تحديد الكل كمقروء
          </button>
        )}
      </div>

      {/* قائمة الإشعارات */}
      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300">
            لا توجد إشعارات
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            ستصلك الإشعارات عند حدوث أي نشاط مهم
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-xl border transition cursor-pointer hover:shadow-md ${
                notification.isRead
                  ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              }`}
              onClick={() => {
                if (!notification.isRead) {
                  markAsRead(notification.id);
                }
                if (notification.link) {
                  router.push(notification.link);
                }
              }}
            >
              <div className="flex items-start gap-4">
                <div className="text-3xl">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      {notification.titleAr}
                    </p>
                    {!notification.isRead && (
                      <span className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {notification.messageAr}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}