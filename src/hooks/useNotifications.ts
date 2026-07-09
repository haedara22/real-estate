// src/hooks/useNotifications.ts

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

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

export function useNotifications() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // ✅ جلب الإشعارات
  const fetchNotifications = useCallback(async () => {
    if (!session?.user) return;

    try {
      const response = await fetch('/api/notifications?limit=20');
      const data = await response.json();
      if (response.ok) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('❌ فشل جلب الإشعارات:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  // ✅ تحديد إشعار كمقروء
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('❌ فشل تحديث الإشعار:', error);
    }
  }, []);

  // ✅ تحديد الكل كمقروء
  const markAllAsRead = useCallback(async () => {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('❌ فشل تحديث الإشعارات:', error);
    }
  }, []);

  // ✅ جلب الإشعارات عند التحميل
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}