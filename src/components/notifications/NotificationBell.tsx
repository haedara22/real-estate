// src/components/notifications/NotificationBell.tsx

'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Bell, BellDot, CheckCheck, X } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  type: string;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ✅ جلب الإشعارات
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications?limit=10');
      const data = await response.json();
      if (response.ok) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('❌ فشل جلب الإشعارات:', error);
    }
  };

  // ✅ تحديد إشعار كمقروء
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      
      // تحديث القائمة محلياً
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('❌ فشل تحديث الإشعار:', error);
    }
  };

  // ✅ تحديد الكل كمقروء
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('❌ فشل تحديث الإشعارات:', error);
    }
  };

  // ✅ جلب الإشعارات عند التحميل
  useEffect(() => {
    fetchNotifications();

    // ✅ تحديث كل 30 ثانية
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // ✅ إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ✅ الحصول على أيقونة حسب النوع
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

  // ✅ تنسيق التاريخ
  const formatDate = (date: string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diff = Math.floor((now.getTime() - notifDate.getTime()) / 1000 / 60);
    
    if (diff < 1) return 'الآن';
    if (diff < 60) return `${diff} دقيقة`;
    if (diff < 1440) return `${Math.floor(diff / 60)} ساعة`;
    return format(notifDate, 'dd MMM yyyy', { locale: ar });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ✅ زر الجرس */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        aria-label="الإشعارات"
      >
        {unreadCount > 0 ? (
          <>
            <BellDot className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        ) : (
          <Bell className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        )}
      </button>

      {/* ✅ قائمة الإشعارات */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
          {/* رأس القائمة */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔔</span>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                الإشعارات
              </h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount} جديدة
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:underline"
                >
                  تحديد الكل كمقروء
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* قائمة الإشعارات */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                جاري التحميل...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">📭</div>
                <p className="text-gray-500 dark:text-gray-400">
                  لا توجد إشعارات
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => {
                    if (!notification.isRead) {
                      markAsRead(notification.id);
                    }
                    if (notification.link) {
                      router.push(notification.link);
                      setIsOpen(false);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.isRead ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                        {notification.titleAr}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 line-clamp-2">
                        {notification.messageAr}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-center">
            <Link
              href="/notifications"
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
              onClick={() => setIsOpen(false)}
            >
              عرض كل الإشعارات
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}