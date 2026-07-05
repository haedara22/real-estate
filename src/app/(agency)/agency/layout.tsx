"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Building, 
  Users, 
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  PlusCircle,
  BarChart3,
  Store,
  Shield,
  TrendingUp,
  Clock
} from "lucide-react";

export default function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // التحقق من صلاحية الوكالة
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
    if (session?.user?.role !== "agency_owner" && session?.user?.role !== "agency_staff") {
      router.push("/");
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (session?.user?.role !== "agency_owner" && session?.user?.role !== "agency_staff") {
    return null;
  }

  const menuItems = [
    { name: "لوحة التحكم", href: "/agency/dashboard", icon: LayoutDashboard },
    { name: "عقاراتي", href: "/agency/properties", icon: Building },
    { name: "إضافة عقار", href: "/properties/new", icon: PlusCircle },
    { name: "فريق العمل", href: "/agency/staff", icon: Users },
    { name: "الاشتراكات", href: "/agency/subscriptions", icon: CreditCard },
    { name: "الإعدادات", href: "/agency/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* الهيدر */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition lg:hidden"
            >
              <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <Link href="/agency/dashboard" className="flex items-center gap-2">
              <Store className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
                لوحة الوكالة
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {session?.user?.role === "agency_owner" ? "مالك وكالة" : "موظف"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                {session?.user?.name?.[0] || "A"}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* الشريط الجانبي */}
        <aside
          className={`bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 w-64 min-h-[calc(100vh-72px)] transition-all duration-300 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          } fixed lg:sticky top-[72px] z-20`}
        >
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition group"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}

            <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/"
                className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <Home className="w-5 h-5" />
                <span className="text-sm font-medium">العودة للموقع</span>
              </Link>
            </div>
          </nav>
        </aside>

        {/* المحتوى */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}