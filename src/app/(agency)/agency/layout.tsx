// src/app/(agency)/agency/layout.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Home,
  Users,
  CreditCard,
  Settings,
  LogOut,
  PlusCircle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Building,
  Bell,
  User,
  ArrowLeft,
  Shield,
  BarChart3,
  Eye,
  Calendar,
  Clock,
  TrendingUp,
} from "lucide-react";

const navigation = [
  { name: "لوحة التحكم", href: "/agency/dashboard", icon: LayoutDashboard },
  { name: "عقاراتي", href: "/agency/properties", icon: Home },
  { name: "إضافة عقار", href: "/properties/new", icon: PlusCircle },
  { name: "فريق العمل", href: "/agency/staff", icon: Users },
  { name: "الاشتراكات", href: "/agency/subscriptions", icon: CreditCard },
  { name: "الإعدادات", href: "/agency/settings", icon: Settings },
];

export default function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // ✅ التحقق من حجم الشاشة
  useEffect(() => {
    const checkScreen = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
        setIsCollapsed(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  // ✅ إغلاق السايدبار عند تغيير المسار في الموبايل
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(!isSidebarOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const isActive = (path: string) => {
    if (path === "/agency/dashboard") {
      return pathname === path;
    }
    return pathname?.startsWith(path);
  };

  // ✅ منع التمرير عند فتح السايدبار في الموبايل
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobile, isSidebarOpen]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ✅ Overlay للموبايل */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ✅ السايدبار */}
      <aside
        className={`fixed top-0 right-0 h-full bg-white dark:bg-gray-800 shadow-2xl z-50 transition-all duration-300 ease-in-out flex flex-col ${
          isMobile
            ? `w-72 translate-x-0 ${isSidebarOpen ? "translate-x-0" : "translate-x-full"}`
            : isCollapsed
            ? "w-20"
            : "w-64"
        }`}
        style={{
          direction: "rtl",
        }}
      >
        {/* ✅ رأس السايدبار */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-lg flex-shrink-0">
              🏠
            </div>
            {(!isCollapsed || isMobile) && (
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
                  سوريا للعقارات
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                  لوحة الوكالة
                </p>
              </div>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition flex-shrink-0"
            aria-label={isSidebarOpen ? "إغلاق" : "فتح"}
          >
            {isMobile ? (
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            ) : isCollapsed ? (
              <ChevronLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* ✅ معلومات المستخدم */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
              {session?.user?.name?.[0] || "U"}
            </div>
            {(!isCollapsed || isMobile) && (
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                  {session?.user?.name || "مستخدم"}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                  {session?.user?.role === "agency_owner"
                    ? "مالك وكالة"
                    : "موظف وكالة"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ✅ قائمة التنقل - مع overflow للتمرير */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  if (isMobile) setIsSidebarOpen(false);
                }}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 group ${
                  active
                    ? "bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/30 dark:to-blue-800/20 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                }`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    active
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200"
                  }`}
                />
                {(!isCollapsed || isMobile) && (
                  <span className="text-sm font-medium truncate">
                    {item.name}
                  </span>
                )}
                {!isCollapsed && !isMobile && active && (
                  <span className="mr-auto w-1.5 h-6 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ✅ زر تسجيل الخروج */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 ${
              isCollapsed && !isMobile ? "justify-center" : ""
            }`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {(!isCollapsed || isMobile) && (
              <span className="text-sm font-medium">تسجيل الخروج</span>
            )}
          </button>
        </div>
      </aside>

      {/* ✅ المحتوى الرئيسي */}
      <div
        className={`transition-all duration-300 ${
          isMobile
            ? "mr-0"
            : isCollapsed
            ? "mr-20"
            : "mr-64"
        }`}
      >
        {/* ✅ الهيدر العلوي (في الموبايل) */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between lg:hidden">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </Link>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              لوحة الوكالة
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/notifications"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition relative"
            >
              <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Link>
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
              {session?.user?.name?.[0] || "U"}
            </div>
          </div>
        </header>

        {/* ✅ المحتوى */}
        <main className="p-4 md:p-6 max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
}